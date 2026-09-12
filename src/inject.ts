import { View } from "obsidian";
import { Embed } from "./embed";
import { Zone } from "./api/spec";
import { injectView, isVisible } from "./surface/view";

export function inject(view: View, embed: Embed) {
    if (!isVisible(view)) return;
    if (!embed.shouldInject(view)) return;
    switch (embed.zone) {
        case Zone.RunningHead:
        case Zone.Eyebrow:
        case Zone.RunningFoot:
            injectView(view, embed);
            break;
    }
}