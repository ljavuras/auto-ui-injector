import { ItemView, MarkdownEditView, MarkdownPreviewView, MarkdownView } from "obsidian";
import { Embed } from "../embed/embed";
import { insertLookBefore, insertLookAfter } from "../element";
import { Zone } from "../api/spec";
import type { InjectFunction, RefreshFunction } from "../inject";
import { isSourceMode } from "./markdown-view";
import { embedRegister } from "../embed-register";

const { RunningHead, Eyebrow, RunningFoot } = Zone;
const zones = [RunningHead, Eyebrow, RunningFoot];

function injectEl(view: ItemView, zone: Zone, el: HTMLElement) {
    if (zone === RunningHead || zone === Eyebrow) {
        const anchorEl = zone === RunningHead? view.headerEl : view.contentEl;
        insertLookBefore(anchorEl, el);
    }

    else if (zone === RunningFoot) {
        const anchorEl = view.contentEl;
        insertLookAfter(anchorEl, el);
    }
}

export const injectItemView: InjectFunction<ItemView> = function(
    view: ItemView, embed: Embed
) {
    // Skip if not is zones ItemView should handle
    if (!zones.contains(embed.zone)) return;

    // Skip if MarkdownView is in source mode
    if (view instanceof MarkdownView
        && (view.currentMode as MarkdownEditView | MarkdownPreviewView).type === "source"
        && view.getState().source
    ) return;

    const el = embed.render(view);
    injectEl(view, embed.zone, el);
}

export const refreshItemView: RefreshFunction<ItemView> = function(view: ItemView) {
    // No embeds are visible in source mode
    if (view instanceof MarkdownView && isSourceMode(view)) return;

    const embeds = embedRegister.values()
        .filter(embed => zones.contains(embed.zone));
    embeds.forEach(embed => {
        if (!embed.shouldInject(view)) {
            embed.removeFromView(view);
            return;
        }
        const el = embed.rerender(view);
        if (el) injectEl(view, embed.zone, el);
    })
}