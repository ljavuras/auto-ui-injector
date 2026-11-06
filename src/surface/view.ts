import { ItemView, View } from "obsidian";
import { Zone } from "../api/spec";
import { Embed } from "../embed/embed";
import { insertLookBefore, insertLookAfter } from "../element";
import type { InjectFunction } from "../inject";

const { RunningHead, Eyebrow, RunningFoot } = Zone;
const zones = [RunningHead, Eyebrow, RunningFoot];

export function isVisible(view: View) {
    return view.leaf.isVisible();
}

function injectEl(view: View, zone: Zone, el: HTMLElement) {
    if (zone === RunningHead || zone === Eyebrow) {
        const anchorEl = view.containerEl.firstElementChild;
        if (!anchorEl) {
            view.containerEl.appendChild(el);
        } else {
            insertLookAfter(anchorEl, el);
        }
    }

    else if (zone === RunningFoot) {
        const anchorEl = view.containerEl.lastElementChild;
        if (!anchorEl) {
            view.containerEl.appendChild(el);
        } else {
            insertLookBefore(anchorEl, el);
        }
    }
}

export const injectView: InjectFunction<View> = function(view: View, embed: Embed) {
    // Embeds are injected around headerEl and contentEl in ItemView
    if (view instanceof ItemView) return;

    // Skip if not in zones View should handle
    if (!zones.includes(embed.zone)) return;

    const el = embed.render(view);
    injectEl(view, embed.zone, el);
}