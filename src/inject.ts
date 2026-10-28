import { ItemView, MarkdownView, View } from "obsidian";
import { Embed } from "./embed/embed";
import { injectView, isVisible, refreshView } from "./surface/view";
import { injectItemView, refreshItemView } from "./surface/item-view";
import { injectMarkdownView, refreshMarkdownView } from "./surface/markdown-view";
import { Zone } from "./api/spec";
import { embedRegister } from "./embed-register";

export type InjectFunction<T extends View> = (view: T, embed: Embed) => void;
export type RefreshFunction<T extends View> = (view: T) => void;

const injectors = new Map<typeof View, InjectFunction<any>>([
    [View, injectView],
    [ItemView, injectItemView],
    [MarkdownView, injectMarkdownView],
]);

const refreshers = new Map<typeof View, RefreshFunction<any>>([
    [View, refreshView],
    [ItemView, refreshItemView],
    [MarkdownView, refreshMarkdownView],
]);

/**
 * Injects an embed into a view.
 * @param view - View to be injected.
 * @param embed - The embed that gets injected.
 */
export function inject(view: View, embed: Embed): void {
    if (!isVisible(view)) return;
    if (!embed.shouldInject(view)) return;

    for (const [Type, injector] of injectors) {
        if (view instanceof Type) {
            injector(view, embed);
        }
    }
}

export function refresh(view: View) {
    if (!isVisible(view)) return;
    for (const [Type, refresher] of refreshers) {
        if (view instanceof Type) {
            refresher(view);
        }
    }
}

export function injectAllOfZone(zone: Zone | undefined) {
    embedRegister.values()
        .filter(e => zone === undefined || e.zone === zone)
        .forEach(e => {
            app.workspace.iterateAllLeaves(l => inject(l.view, e));
        });
}

export function ejectAllOfZone(zone: Zone | undefined) {
    embedRegister.values()
        .filter(e => zone === undefined || e.zone === zone)
        .forEach(e => e.removeAll());
}

export function injectZonesOfView(view: View, zone?: Zone | Zone[]) {
    const zones = Array.isArray(zone)? zone : [zone];
    embedRegister.values()
        .filter(e => zone === undefined || zones.includes(e.zone))
        .forEach(e => inject(view, e));
}

export function ejectAllOfView(view: View) {
    embedRegister.values().forEach(e => e.removeFromView(view));
}