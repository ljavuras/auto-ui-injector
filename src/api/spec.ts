import { Component, TFile, View } from "obsidian";
import * as z from "zod";

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
    | ((el: HTMLElement, view: View) => void)
    // | TFile
    | string;

export type UISpec = {
    position: Position,
    condition: Condition,
    content: Content,
}

const SpecObj = z.object({
    position: z.object({
        zone: z.literal(Object.keys(Zone).filter(k => isNaN(Number(k)))),
        order: z.number(),
    }),
    condition: z.function({
        input: [z.instanceof(View)],
        output: z.boolean(),
    }),
    content: z.union([
        z.function({input: [
            z.instanceof(HTMLElement),
            z.instanceof(View),
        ]}),
        // z.instanceof(TFile, { error: (iss) => `Invalid input: expected TFile, received ${iss.input}` }),
        z.string(),
    ]),
})

export function isValidSpec(obj: any) {
    try {
        SpecObj.parse(obj);
    } catch(e) {
        console.error(
            "Auto UI Injector error: Invalid 'UISpec' registered through 'registerAutoUI'.\n",
            e
        );
        return false;
    }
    return true;
}