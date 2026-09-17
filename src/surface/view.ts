import { App, ItemView, MarkdownEditView, MarkdownPreviewView, MarkdownView, View } from "obsidian";
import { Zone } from "../api/spec";
import { Embed } from "../embed";
import { CLASS_TOP_BOTTOM_BAR, insertLookBefore, insertLookAfter } from "../element";
import { injectItemView } from "./item-view";
import { injectMarkdownSubView } from "./markdown-sub-view";

export function isVisible(view: View) {
    return view.leaf.isVisible();
}

export function injectView(app: App, view: View, embed: Embed) {
    if (view instanceof ItemView) {
        injectItemView(view, embed);
    } else {
        const { RunningHead, Eyebrow, RunningFoot } = Zone;
        const el = createDiv(CLASS_TOP_BOTTOM_BAR);
        embed.render(el, view);

        if (embed.zone === RunningHead || embed.zone === Eyebrow) {
            const anchorEl = view.containerEl.firstElementChild;
            if (!anchorEl) { view.containerEl.appendChild(el); }
            insertLookAfter(anchorEl!, el);
        }
        
        else if (embed.zone === RunningFoot) {
            const anchorEl = view.containerEl.lastElementChild;
            if (!anchorEl) { view.containerEl.appendChild(el); }
            insertLookBefore(anchorEl!, el);
        }
    }

    if (view instanceof MarkdownView) {
        injectMarkdownSubView(
            app,
            view.currentMode as MarkdownEditView | MarkdownPreviewView,
            embed
        );
    }
}