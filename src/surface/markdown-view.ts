import { MarkdownEditView, MarkdownPreviewView, MarkdownView } from "obsidian";
import { Embed } from "../embed/embed";
import { injectMarkdownSubView, refreshMarkdownSubView } from "./markdown-sub-view";
import { InjectFunction, RefreshFunction } from "../inject";

export function isSourceMode(view: MarkdownView) {
    return view.getState().source;
}

export const injectMarkdownView: InjectFunction<MarkdownView> = function(
    view: MarkdownView, embed: Embed
) {
    injectMarkdownSubView(
        view.currentMode as MarkdownEditView | MarkdownPreviewView,
        embed
    );
}

export const refreshMarkdownView: RefreshFunction<MarkdownView> = function(view: MarkdownView) {
    refreshMarkdownSubView(view.currentMode as MarkdownEditView | MarkdownPreviewView);
}