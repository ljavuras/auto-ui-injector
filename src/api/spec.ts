import { MarkdownPreviewRenderer, View } from "obsidian";
import * as z from "zod";
import { EditorState } from "@codemirror/state";
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
    EOF = "eof",
    Postscript = "postscript",
    // Backlinks
    EndMatter = "end-matter",

    /* Bottom Bar */
    RunningFoot = "running-foot",
}

const ZoneIndex: Record<Zone, number> = Object.fromEntries(
    Object.values(Zone).map((value, index) => [value, index])
) as Record<Zone, number>;

export function compareZone(a: Zone, b: Zone): number {
    return ZoneIndex[a] - ZoneIndex[b];
}

export enum AnchorType {
    Raw = "raw",
    Section = "section",
}

export interface RawAnchorSpec {
    type: AnchorType.Raw,
    locateSourceOffset: (tree: Tree, state: EditorState) => number,
    locatePreviewRendererSection: (renderer: MarkdownPreviewRenderer) => number,
};

export interface SectionAnchorSpec {
    type: AnchorType.Section,
    match: {
        text?: string,
        startsWith?: string,
        endsWith?: string,
        includes?: string,
        regex?: RegExp,
        level?: 1 | 2 | 3 | 4 | 5 | 6,
    },
    occurrence?: number,  // Omitting results in first match
    // pick: "heading" | "content" | "section",
}

export type AnchorSpec = RawAnchorSpec | SectionAnchorSpec;

type Position = {
    zone: Exclude<Zone, Zone.Body>,
    order: number,
} | BodyPosition;

export type BodyPosition = {
    zone: Zone.Body,
    order: number,
    anchor: AnchorSpec,
};

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
        anchor: z.optional(
            z.union([
                z.object({
                    type: z.literal(AnchorType.Raw),
                    locateSourceOffset: z.function({
                        // input: [z.instanceof(Tree), z.instanceof(EditorState)],
                        input: [z.any(), z.any()],
                        output: z.number()
                    }),
                    locatePreviewRendererSection: z.function({
                        // input: [z.instanceof(MarkdownPreviewRenderer)],
                        input: [z.any()],
                        output: z.number()
                    }),
                }),
                z.object({
                    type: z.literal(AnchorType.Section),
                    match: z.object({
                        text: z.optional(z.string()),
                        startsWith: z.optional(z.string()),
                        endsWith: z.optional(z.string()),
                        includes: z.optional(z.string()),
                        regex: z.optional(z.instanceof(RegExp)),
                        level: z.optional(z.int().gt(0).lt(7)),
                    }),
                    occurrence: z.optional(z.int().gt(0)),
                    // type:
                })
            ])
        )
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