import { App, ItemView, MarkdownEditView, MarkdownPreviewView, MarkdownView } from "obsidian";
import { Embed } from "../embed";
import { insertLookBefore, insertLookAfter } from "../element";
import { Zone } from "../api/spec";
import type { InjectFunction } from "../inject";

export const injectItemView: InjectFunction<ItemView> = function(
    app: App, view: ItemView, embed: Embed
) {
    // Skip injection if MarkdownView is in source mode
    if (view instanceof MarkdownView
        && (view.currentMode as MarkdownEditView | MarkdownPreviewView).type === "source"
        && view.getState().source
    ) return;

    const { RunningHead, Eyebrow, RunningFoot } = Zone;
    const el = embed.render(view);

    if (embed.zone === RunningHead || embed.zone === Eyebrow) {
        const anchorEl = embed.zone === RunningHead? view.headerEl : view.contentEl;
        insertLookBefore(anchorEl, el);
    }

    else if (embed.zone === RunningFoot) {
        const anchorEl = view.contentEl;
        insertLookAfter(anchorEl, el);
    }
}