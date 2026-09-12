import { Component, View } from "obsidian";
import { Content } from "./api/spec";

export function renderContent(
    el: HTMLElement,
    view: View,
    component: Component,
    content: Content
) {
    if (typeof content === "function") {
        content(el, view, component);
    }
}