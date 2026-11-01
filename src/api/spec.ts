import { View } from "obsidian";
import * as z from "zod";
import { EditorState } from "@codemirror/state";
import { ReadViewRenderer } from "@obsidian-typings/obsidian-public-latest";
import type { Tree } from "@lezer/common";

export enum Zone {
    /* Top Bar */
    RunningHead = "running-head",
    // Tab title bar
    Eyebrow = "eyebrow",

    /* Viewport */
    Kicker = "kicker",
    // Inline title
    Byline = "byline",
    // Properties
    Preface = "preface",
    Body = "body",
    Afterword = "afterword",
    // Footnotes
    Postscript = "postscript",
    // Backlinks
    EndMatter = "end-matter",

    /* Bottom Bar */
    RunningFoot = "running-foot",
}

export const ZoneIndex: Record<Zone, number> = Object.fromEntries(
    Object.values(Zone).map((value, index) => [value, index])
) as Record<Zone, number>;

type Position = {
    zone: Zone;
    order: number;
    anchor?: AnchorSpec;
}

export enum AnchorType {
    Raw = "raw",
}

export type AnchorSpec = {
    type: AnchorType.Raw,
    locateSourceOffset: (tree: Tree, state: EditorState) => number,
    locatePreviewRendererSection: (renderer: ReadViewRenderer) => number,
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
        zone: z.literal(Object.values(Zone)),
        order: z.number(),
        anchor: z.optional(z.object({
            type: z.literal(Object.values(AnchorType)),
            locateSourceOffset: z.function({
                // input: [z.instanceof(Tree), z.instanceof(EditorState)],
                input: [z.any(), z.any()],
                output: z.number()
            }),
            locatePreviewRendererSection: z.function({
                // input: [z.instanceof(ReadViewRenderer)],
                input: [z.any()],
                output: z.number()
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

export function isValidSpec(obj: unknown): boolean {
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