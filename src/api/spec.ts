import { View } from "obsidian";
import * as z from "zod";
import { EditorState } from "@codemirror/state";
import { ReadViewRenderer } from "@obsidian-typings/obsidian-public-latest";
import { Tree } from "@lezer/common";

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
    anchor?: AnchorSpec;
}

export enum AnchorType {
    Raw = "raw",
}

export type AnchorSpec = {
    type: AnchorType.Raw,
    locateSourceOffset: (tree: Tree, state: EditorState) => number,
    locatePreviewAnchorEl: (renderer: ReadViewRenderer) => HTMLElement,
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
        anchor: z.optional(z.object({
            type: z.literal(Object.values(AnchorType)),
            locateSourceOffset: z.function({
                // input: [z.instanceof(Tree), z.instanceof(EditorState)],
                input: [z.any(), z.any()],
                output: z.number()
            }),
            locatePreviewAnchorEl: z.function({
                // input: [z.instanceof(ReadViewRenderer)],
                input: [z.any()],
                output: z.instanceof(HTMLElement)
            }),
        }))
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