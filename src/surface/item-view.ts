import { ItemView } from "obsidian";
import { Embed } from "../embed";
import { CLASS_TOP_BOTTOM_BAR, insertLookBefore, insertLookAfter } from "../element";
import { Zone } from "../api/spec";

export function injectItemView(view: ItemView, embed: Embed) {
    const { RunningHead, Eyebrow, RunningFoot } = Zone;
    const el = createDiv(CLASS_TOP_BOTTOM_BAR);
    embed.render(el, view);

    if (embed.zone === RunningHead || embed.zone === Eyebrow) {
        const anchorEl = embed.zone === RunningHead? view.headerEl : view.contentEl;
        insertLookBefore(anchorEl, el);
    }

    else if (embed.zone === RunningFoot) {
        const anchorEl = view.contentEl;
        insertLookAfter(anchorEl, el);
    }
}