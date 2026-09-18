import { App, ItemView, MarkdownView, View } from "obsidian";
import { Embed } from "./embed";
import { injectView, isVisible } from "./surface/view";
import { injectItemView } from "./surface/item-view";
import { injectMarkdownView } from "./surface/markdown-view";
import { Zone } from "./api/spec";
import { embeds } from "./embeds";

export type InjectFunction<T extends View> = (app: App, view: T, embed: Embed) => void;

const injectors = new Map<typeof View, InjectFunction<any>>([
    [View, injectView],
    [ItemView, injectItemView],
    [MarkdownView, injectMarkdownView],
]);

export function inject(app: App, view: View, embed: Embed) {
    if (!isVisible(view)) return;
    if (!embed.shouldInject(view)) return;

    for (const [Type, injector] of injectors) {
        if (view instanceof Type) {
            injector(app, view, embed);
        }
    }
}

export function injectAllOfZone(app: App, zone: Zone | undefined) {
    embeds.values()
        .filter(e => zone === undefined || e.zone === zone)
        .forEach(e => {
            app.workspace.iterateAllLeaves(l => inject(app, l.view, e));
        });
}

export function ejectAllOfZone(zone: Zone | undefined) {
    embeds.values()
        .filter(e => zone === undefined || e.zone === zone)
        .forEach(e => e.removeAll());
}