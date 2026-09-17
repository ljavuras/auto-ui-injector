import { App, MarkdownEditView, MarkdownPreviewView, MarkdownView } from "obsidian";
import { Embed } from "../embed";
import { injectMarkdownSubView } from "./markdown-sub-view";
import { InjectFunction } from "../inject";

export const injectMarkdownView: InjectFunction<MarkdownView> = function(
    app: App, view: MarkdownView, embed: Embed
) {
    injectMarkdownSubView(
        app,
        view.currentMode as MarkdownEditView | MarkdownPreviewView,
        embed
    );
}