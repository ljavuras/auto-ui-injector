import { FileView, MarkdownRenderer, View } from "obsidian";
import { Content } from "./api/spec";

export function renderContent(
    el: HTMLElement,
    view: View,
    content: Content
) {
    if (typeof content === "function") {
        content(el, view);
    }

    else if (typeof content === "string") {
        const sourcePath = (view as FileView).file?.path ?? "";
        void MarkdownRenderer.render(view.app, content, el, sourcePath, view);
    }
}