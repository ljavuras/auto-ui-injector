import { App, MarkdownPreviewRenderer, MarkdownView } from "obsidian";
import { compareZone, Zone } from "../api/spec";
import { around } from "monkey-around";
import { embedRegister } from "../embed-register";
import { ReadViewRenderer, RendererSection } from "@obsidian-typings/obsidian-public-latest";

const { Body, Afterword, EOF } = Zone;
const zones = [Body, Afterword, EOF];
let MarkdownPreviewSection: new (element: string | Node | null) => RendererSection;

function filterInPlace(
    array: Array<unknown>,
    predicate: (value: unknown, index: number, array: Array<unknown>) => boolean
) {
    for(let i = array.length - 1; i >= 0; i--) {
        if (!predicate(array[i], i, array)) array.splice(i, 1);
    }
}

function injectSections(this: ReadViewRenderer) {
    if (!MarkdownPreviewSection) {
        MarkdownPreviewSection = this.sections[0]!.constructor as new (element: string | Node | null) => RendererSection;
    }

    const view = this.owner.view  // MarkdownPreviewView
        ?? this.owner.owner;  // MarkdownEmbedView

    // TODO: find the correct function to patch, `injectSections` should receive
    // a clean array to patch
    filterInPlace(this.sections, s => !s.isEmbed);

    const sectionIndex: Partial<Record<Zone, number>> = {
        [Afterword]: this.sections.findLastIndex(s => !(
            s.el.hasClass("mod-footer")
            || s.html.startsWith(`<section class="footnotes">`)
        )),
        [EOF]: this.sections.length - 2,
    }

    embedRegister.values()
        .filter(embed => zones.includes(embed.zone) && embed.shouldInject(view))
        .map((embed) => {
            const anchorIndex = embed.zone === Body
                ? embed.locateSection(this)
                : sectionIndex[embed.zone];
            if (!(typeof anchorIndex === "number"
                && Number.isFinite(anchorIndex)
                && anchorIndex > 0
                && anchorIndex < this.sections.length
            )) return null;

            return {
                anchorIndex,
                embed,
            };
        })
        .filter(e => !!e)
        // Sort by anchorIndex, zone and order, respectively
        .sort((a, b) => {
            if (a.anchorIndex !== b.anchorIndex)
                return a.anchorIndex - b.anchorIndex;
            if (a.embed.zone !== b.embed.zone)
                return compareZone(a.embed.zone, b.embed.zone);
            return a.embed.order - b.embed.order;
        })
        .forEach(({ anchorIndex, embed }, index) => {
            // Every prior insert pushes anchorIndex by 1
            (anchorIndex as number) += index;

            const el = embed.render(view);
            // Afterword always inserts before footnote (after last non-footnote)
            const isBefore = embed.zone === Body? embed.order < 0 : false;
            const embedPos = isBefore
                ? this.sections[anchorIndex].start
                : this.sections[anchorIndex].end;
            const section = new MarkdownPreviewSection(null);
            Object.assign(section, {
                rendered: true,
                height: Math.round(el.getBoundingClientRect().height),
                computed: true,
                level: 7,
                el: el,
                start: { line: 0, col: 0, offset: embedPos.offset },
                end: { line: 0, col: 0, offset: embedPos.offset },
                isEmbed: true,
            });
            this.sections.splice(isBefore? anchorIndex : anchorIndex + 1, 0, section);
        })
}

export function patchMarkdownPreviewRenderer(app: App) {
    const unwrapMarkdownPreviewRenderer = around(
        MarkdownPreviewRenderer.prototype, {
        parseFinish(original) {
            return function(this: MarkdownPreviewRenderer, ...args) {
                original.apply(this, args);
                injectSections.call(this as unknown as ReadViewRenderer);
            }
        }
    });

    // Clean up function
    return () => {
        unwrapMarkdownPreviewRenderer();
        app.workspace.getLeavesOfType('markdown').forEach(leaf => {
            const sections = (leaf.view as MarkdownView).previewMode?.renderer.sections;
            if (!sections) return;
            // Filter array in place in case someone required with its identity to be exact
            filterInPlace(sections, s => !s.isEmbed)
        })
    }
}