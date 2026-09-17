import { App, ItemView, View } from "obsidian";
import { Zone } from "../api/spec";
import { Embed } from "../embed";
import { insertLookBefore, insertLookAfter } from "../element";
import type { InjectFunction } from "../inject";

export function isVisible(view: View) {
    return view.leaf.isVisible();
}

export const injectView: InjectFunction<View> = function(app: App, view: View, embed: Embed) {
    // Leave top/bottom bar injections to `injectItemView`
    if (view instanceof ItemView) return;

    const { RunningHead, Eyebrow, RunningFoot } = Zone;
    const el = embed.render(view);

    if (embed.zone === RunningHead || embed.zone === Eyebrow) {
        const anchorEl = view.containerEl.firstElementChild;
        if (!anchorEl) {
            view.containerEl.appendChild(el);
        } else {
            insertLookAfter(anchorEl, el);
        }
    }

    else if (embed.zone === RunningFoot) {
        const anchorEl = view.containerEl.lastElementChild;
        if (!anchorEl) {
            view.containerEl.appendChild(el);
        } else {
            insertLookBefore(anchorEl, el);
        }
    }
}