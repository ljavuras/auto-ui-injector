import { ItemView, View } from "obsidian";
import { Zone } from "../api/spec";
import { Embed } from "../embed";
import { CLASS_TOP_BOTTOM_BAR, compareEmbedGT, isEmbedEl } from "../element";
import { injectItemView } from "./item-view";

export function isVisible(view: View) {
    return view.leaf.isVisible();
}

export function injectView(view: View, embed: Embed) {
    if (view instanceof ItemView) {
        injectItemView(view, embed);
        return;
    }

    const { RunningHead, Eyebrow, RunningFoot } = Zone;
    const el = createDiv(CLASS_TOP_BOTTOM_BAR);
    embed.render(el, view);

    let anchorEl, nextEl: Element | null | undefined;
    if (embed.zone === RunningHead || embed.zone === Eyebrow) {
        anchorEl = view.containerEl.firstElementChild;
        nextEl = anchorEl?.nextElementSibling;
        if (!anchorEl) { view.containerEl.appendChild(el); }
        if (compareEmbedGT(anchorEl!, embed)) {
            anchorEl!.before(el);
            return;
        }
        while (nextEl && isEmbedEl(nextEl) && compareEmbedGT(embed, nextEl)) {
            anchorEl = nextEl;
            nextEl = anchorEl.nextElementSibling;
        }
        anchorEl!.after(el);
    } else if (embed.zone === RunningFoot) {
        anchorEl = view.containerEl.lastElementChild;
        nextEl = anchorEl?.previousElementSibling;
        if (!anchorEl) { view.containerEl.appendChild(el); }
        if (compareEmbedGT(embed, anchorEl!)) {
            anchorEl!.after(el);
            return;
        }
        while (nextEl && isEmbedEl(nextEl) && compareEmbedGT(nextEl!, embed)) {
            anchorEl = nextEl;
            nextEl = anchorEl.previousElementSibling;
        }
        anchorEl!.before(el);
    }
}