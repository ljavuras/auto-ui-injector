import { App, MarkdownEditView, MarkdownPreviewView } from "obsidian";
import { Embed } from "../embed";
import { Zone } from "../api/spec";
import { insertLookAfter, insertLookBefore } from "../element";

export function injectMarkdownSubView(
    app: App,
    subView: MarkdownEditView | MarkdownPreviewView,
    embed: Embed
) {
    const { Kicker, Byline, Preface, Postscript, EndMatter } = Zone;
    const view = subView.view;
    const anchorEl = ({
        [Kicker]: view.inlineTitleEl,
        [Byline]: view.metadataEditor.containerEl,
        [Preface]: view.metadataEditor.containerEl,
        [Postscript]: view.backlinksEl,
        [EndMatter]: view.backlinksEl,
    } as Record<Zone, HTMLElement | undefined>)[embed.zone];

    if (!anchorEl) return;

    // Leave preface embeds to CodeMirror extension if property display is set
    // to source (not hidden or visible)
    if (embed.zone === Preface
        && app.vault.config.propertiesInDocument === "source"
    ) {
        return;
    }

    const el = embed.render(subView.view);

    switch (embed.zone) {
        case Kicker:
        case Byline:
        case Postscript:
            insertLookBefore(anchorEl, el);
            break;
        case Preface:
        case EndMatter:
            insertLookAfter(anchorEl, el);
            break;
    }
}