import 'obsidian'
import { RendererSection } from "@obsidian-typings/obsidian-public-latest";

export interface MarkdownPreviewSection extends RendererSection {
    hight: number,
    computed: boolean,
    lines: number,
    used: boolean,
    highlightRanges: Array,
    level: number,
    headingCollapsed: boolean,
    shown: boolean,
    usesFrontMatter: boolean,
    start: { line: number, col: number, offset: number },
    end: { line: number, col: number, offset: number },
}

declare module "obsidian" {
    interface MarkdownPreviewRenderer {
        previewEl: HTMLElement | null,
        sizerEl: HTMLElement | null,
        pusherEl: HTMLElement | null,
        header: MarkdownPreviewSection | null,
        footer: MarkdownPreviewSection | null,
        cssClasses: Array<string> | null,
        sections: Array<MarkdownPreviewSection>,
        asyncSections: Array<MarkdownPreviewSection>,
        recycledSections: Array<MarkdownPreviewSection>,
        lastText: string | null,
        text: string,
        frontmatter: Record<string, unknown> | null,
        queued: { high: boolean, cancel: () => unknown },
        rendered: Array<() => void> | null,
        lastRender: number,
        lastScroll: number,
        lastScrollTs: number,
        viewportHeight: number,
        renderedWidth: number,
        renderExtra: number,
        renderExtraMinPx: number,
        addBottomPadding: boolean,
        topSpace: number,
        parsing: boolean,
        scrolling: boolean,
        owner: unknown,
        workerPath: string,
    }
}