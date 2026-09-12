import { ItemView } from "obsidian";
import { Embed } from "../embed";
import { CLASS_TOP_BOTTOM_BAR, compareEmbedGT, isEmbedEl } from "../element";
import { Zone } from "../api/spec";

export function injectItemView(view: ItemView, embed: Embed) {
    const { RunningHead, Eyebrow, RunningFoot } = Zone;
    const el = createDiv(CLASS_TOP_BOTTOM_BAR);
    embed.render(el, view);
    
    let anchorEl, nextEl: Element | null | undefined;
    if (embed.zone === RunningHead || embed.zone === Eyebrow) {
        anchorEl = embed.zone === RunningHead? view.headerEl : view.contentEl;
        nextEl = anchorEl.previousElementSibling;
        while (nextEl && isEmbedEl(nextEl) && compareEmbedGT(nextEl, embed)) {
            anchorEl = nextEl;
            nextEl = anchorEl.previousElementSibling;
        }
        anchorEl.before(el);
    } else if (embed.zone === RunningFoot) {
        anchorEl = view.contentEl;
        nextEl = anchorEl.nextElementSibling;
        while (nextEl && isEmbedEl(nextEl) && compareEmbedGT(embed, nextEl)) {
            anchorEl = nextEl
            nextEl = anchorEl.nextElementSibling;
        }
        anchorEl.after(el);
    }
}