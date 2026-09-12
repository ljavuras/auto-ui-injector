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
    zone: Zone;
    order: number;
    // anchor?: AnchorSpec;
}

export type Condition = (view: View) => boolean

export type Content = 
    | ((el: HTMLElement, view: View, component: Component) => void)
    | TFile
    | string;

export class UISpec {
    private position;
    public condition;
    public content;

    get zone() { return this.position.zone; }
    get order() { return this.position.order; }

    constructor({ position, when, content } : {
        position: Position,
        when: Condition,
        content: Content
    }) {
        this.position = position;
        this.condition = when;
        this.content = content;
    }
}