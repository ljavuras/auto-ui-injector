import { ItemView, MarkdownView, View } from "obsidian";
import { Zone } from "../api/spec";
import { Embed } from "../embed";
import { insertLookBefore, insertLookAfter } from "../element";
import type { InjectFunction, RefreshFunction } from "../inject";
import { embedRegister } from "../embed-register";
import { isSourceMode } from "./markdown-view";

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

    const el = embed.render(view);
    injectEl(view, embed.zone, el);
}

export const refreshView: RefreshFunction<View> = function(view: View) {
    // Embeds are injected around headerEl and contentEl in ItemView
    if (view instanceof ItemView) return;

    // No embeds are visible in source mode
    if (view instanceof MarkdownView && isSourceMode(view)) return;

    const embeds = embedRegister.values().filter(embed => zones.contains(embed.zone));
    embeds.forEach(embed => {
        if (!embed.shouldInject(view)) {
            embed.removeFromView(view);
            return;
        }
        const el = embed.rerender(view);
        if (el) injectEl(view, embed.zone, el);
    })
}