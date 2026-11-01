import { App, MarkdownPreviewRenderer, MarkdownView } from "obsidian";
import { Zone } from "../api/spec";
import { around } from "monkey-around";
import { embedRegister } from "../embed-register";
import { ReadViewRenderer, RendererSection } from "@obsidian-typings/obsidian-public-latest";

const { Body, Afterword } = Zone;
const zones = [Body, Afterword];
let MarkdownPreviewSection: new (element: string | Node | null) => RendererSection;

function injectSections(this: ReadViewRenderer) {
    if (!MarkdownPreviewSection) {
        MarkdownPreviewSection = this.sections[0]!.constructor as new (element: string | Node | null) => RendererSection;
    }

    const view = this.owner.view  // MarkdownPreviewView
        ?? this.owner.owner;  // MarkdownEmbedView

    embedRegister.values()
        .filter(embed => zones.includes(embed.zone))
        .forEach((embed) => {
            const sectionIndex = embed.zone === Body
                ? embed.locateSection(this)
                : (embed.zone === Afterword
                    ? this.sections.findLastIndex(s => !(
                        s.el.hasClass("mod-footer")
                        || s.el.firstElementChild?.hasClass("footnotes")
                    ))
                    : undefined
                );
            if (!(Number.isFinite(sectionIndex)
                && sectionIndex as number > 0
                && sectionIndex as number < this.sections.length
            )) return;

            const el = embed.render(view);
            // TODO: patch method that modify this.sections, NOT before display
            if (this.sections.some(s => s.el === el)) return;
            const isBefore = embed.order < 0;
            const embedPos = isBefore
                ? this.sections[sectionIndex].start
                : this.sections[sectionIndex].end;
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
            // TODO: multiple sections anchored on same element
            this.sections.splice(isBefore? sectionIndex : sectionIndex + 1, 0, section);
        })
}

export function patchMarkdownPreviewRenderer(app: App) {
    const unwrapMarkdownPreviewRenderer = around(
        MarkdownPreviewRenderer.prototype, {
        updateVirtualDisplay(original) {
            return function(this: MarkdownPreviewRenderer, ...args) {
                injectSections.call(this as unknown as ReadViewRenderer);
                original.apply(this, args);
            }
        }
    });
    return () => {
        unwrapMarkdownPreviewRenderer();
        app.workspace.getLeavesOfType('markdown').forEach(leaf => {
            const sections = (leaf.view as MarkdownView).previewMode?.renderer.sections;
            if (!sections) return;
            // Filter array in place in case someone required with its identity to be exact
            for (let i = sections.length - 1; i >= 0; i--) {
                if (sections[i].isEmbed) {
                    sections.splice(i, 1);
                }
            }
        })
    }
}