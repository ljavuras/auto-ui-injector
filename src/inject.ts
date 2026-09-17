import { App, View } from "obsidian";
import { Embed } from "./embed";
import { injectView, isVisible } from "./surface/view";

export function inject(app: App, view: View, embed: Embed) {
    if (!isVisible(view)) return;
    if (!embed.shouldInject(view)) return;
    injectView(app, view, embed);
}