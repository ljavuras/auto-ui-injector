import { MarkdownEditView, MarkdownPreviewView, MarkdownView } from "obsidian";
import { Embed } from "../embed/embed";
import { injectMarkdownSubView } from "./markdown-sub-view";
import { InjectFunction } from "../inject";

export function isSourceMode(view: MarkdownView) {
    return view.getState?.().source;
}

export const injectMarkdownView: InjectFunction<MarkdownView> = function(
    view: MarkdownView, embed: Embed
) {
    injectMarkdownSubView(
        view.currentMode as MarkdownEditView | MarkdownPreviewView,
        embed
    );
}