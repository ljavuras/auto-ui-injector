import { Decoration, EditorView, WidgetType } from "@codemirror/view";
import { Embed } from "../embed/embed";
import { editorInfoField, MarkdownView } from "obsidian";
import { EditorState, RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { isSourceMode } from "./markdown-view";
import { syntaxTree } from "@codemirror/language";
import { Zone } from "../api/spec";
import { embedRegister } from "../embed-register";
import { SyntaxNode } from "@obsidian-typings/obsidian-public-latest";
import { compareEmbed } from "../element";

const { Preface, Body, Afterword, EOF } = Zone;
const zones = [Preface, Body, Afterword, EOF];

class AutoUIWidget extends WidgetType {
    constructor(private embed: Embed) {
        super();
    }

    eq(other: AutoUIWidget) { return this.embed === other.embed; }

    toDOM(view: EditorView): HTMLElement {
        return this.embed.render(view);
    }
}

function buildAutoUIDecorationSet(state: EditorState) {
    const view = state.field(editorInfoField) as MarkdownView;
    const app = view.app;

    // Don't inject UI in source mode
    if (isSourceMode(view)) return Decoration.none;

    // Find position of end of frontmatter and start of footnote
    const tree = syntaxTree(state);
    let node: SyntaxNode | null;
    let frontmatterEndOffset, footnoteStartOffset: number;
    
    node = tree.topNode.firstChild;
    if (!node) {
        frontmatterEndOffset = footnoteStartOffset = 0;
    } else {
        frontmatterEndOffset = 0;
        while (node && node.name?.includes("frontmatter")) {
            frontmatterEndOffset = node.to;
            node = node.nextSibling;
        }

        footnoteStartOffset = state.doc.length;
        node = tree.topNode.lastChild;
        while (node && node.name?.includes("footnote")) {
            footnoteStartOffset = node.from;
            node = node.prevSibling;
        }
    }

    const zoneOffset: Partial<Record<Zone, number>> = {
        [Preface]: frontmatterEndOffset,
        [Afterword]: footnoteStartOffset,
        [EOF]: state.doc.length,
    };

    const builder = new RangeSetBuilder();
    embedRegister.values()
        .filter(embed => zones.includes(embed.zone)
            // Only show Preface in editor if frontmatters are displayed as source
            && !(embed.zone === Preface
                && app.vault.config.propertiesInDocument !== "source"
            )
            && embed.shouldInject(view)
        )
        .map((embed) => ({
            offset: embed.zone === Body
                ? embed.locateOffset(tree, state)
                : zoneOffset[embed.zone],
            embed,
        }))
        // Validate user input
        .filter((e): e is {offset: number, embed: Embed} => typeof e.offset === "number"
            && Number.isFinite(e.offset)
            && e.offset >= 0
            && e.offset <= state.doc.length
        )
        // Ensure widgets are sorted according to their offset and zone
        .sort((a, b) => {
            return a.offset !== b.offset
                ? a.offset - b.offset
                : compareEmbed(a.embed, b.embed);
        })
        // When widgets from different zones clash at the same offset, they
        // should order according to their zone and embed order
        .map ((e, index, array) => ({
            embed: e.embed,
            offset: e.offset,
            side: index + 1,
            // side: e.embed.order >= 0
            //     ? index
            //     : index - array.length
        }))
        .forEach(e => builder.add(
            e.offset,
            e.offset,
            Decoration.widget({
                widget: new AutoUIWidget(e.embed),
                side: e.side,
                block: true,
            })
        ));
    return builder.finish();
}

export const autoUIUpdateEffect = StateEffect.define();
export const autoUIField = StateField.define({
    create(state) {
        return buildAutoUIDecorationSet(state);
    },
    update(value, transaction) {
        if (transaction.docChanged
            || transaction.effects.some(e => e.is(autoUIUpdateEffect))) {
            return buildAutoUIDecorationSet(transaction.state);
        }
        return value.map(transaction.changes);
    },
    provide: field => EditorView.decorations.from(field)
});