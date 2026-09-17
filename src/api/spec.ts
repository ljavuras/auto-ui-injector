import { Component, TFile, View } from "obsidian";

export enum Zone {
    /* Top Bar */
    RunningHead,
    // Tab title bar
    Eyebrow,

    /* Viewport */
    Kicker,
    // Inline title
    Byline,
    // Properties
    Preface,
    Body,
    Afterword,
    // Footnotes
    Postscript,
    // Backlinks
    EndMatter,

    /* Bottom Bar */
    RunningFoot,
}

type Position = {
    zone: keyof typeof Zone;
    order: number;
    // anchor?: AnchorSpec;
}

export type Condition = (view: View) => boolean

export type Content = 
    | ((el: HTMLElement, view: View, component: Component) => void)
    | TFile
    | string;

export type UISpec = {
    position: Position,
    condition: Condition,
    content: Content,
}