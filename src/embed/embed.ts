import { Component, editorInfoField, FileView, MarkdownView, View } from "obsidian";
import { compareZone, UISpec, Zone } from "../api/spec";
import { shouldInject } from "./condition";
import { renderContent } from "./render";
import { CLASS_BODY, CLASS_HEADER_FOOTER, CLASS_TOP_BOTTOM_BAR, setElAttr } from "../element";
import type { Tree } from "@lezer/common";
import { EditorState } from "@codemirror/state";
import { locateOffset, locateSection } from "./locate";
import { ReadViewRenderer } from "@obsidian-typings/obsidian-public-latest";
import { EditorView } from "@codemirror/view";

export class Embed extends Component {
    private instances = new Set<WeakRef<HTMLElement>>();
    private recycler = new WeakMap<object, [HTMLElement, string | undefined]>();

    get zone() { return this.spec.position.zone; }
    get order() { return this.spec.position.order; }

    constructor(
        private spec: UISpec,
    ) {
        super();
    }

    shouldInject(view: View): boolean {
        return shouldInject(this.spec.condition, view);
    }

    locateOffset(tree: Tree, state: EditorState): number | undefined {
        const { zone, anchor } = this.spec.position;
        if (zone !== Zone.Body) return undefined;
        return locateOffset(anchor, tree, state);
    }

    locateSection(renderer: ReadViewRenderer): number | undefined {
        const { zone, anchor } = this.spec.position;
        if (zone !== Zone.Body) return undefined;
        return locateSection(anchor, renderer);
    }

    render(v: View | EditorView, force: boolean = false): HTMLElement {
        const view = v instanceof View
            ? v
            : v.state?.field(editorInfoField) as MarkdownView;
        if (!(view instanceof View)) return createDiv();
        let cls;
        let [el, path] = this.recycler.get(v) || [];
        if (!force && el) return el;
        el?.remove();
        switch (this.zone) {
            case Zone.RunningHead:
            case Zone.Eyebrow:
            case Zone.RunningFoot:
                cls = CLASS_TOP_BOTTOM_BAR;
                break;
            case Zone.Kicker:
            case Zone.Byline:
            case Zone.Preface:
            case Zone.Postscript:
            case Zone.EndMatter:
                cls = CLASS_HEADER_FOOTER;
                break;
            case Zone.Body:
            case Zone.Afterword:
                cls = CLASS_BODY;
                break;
        }
        el = createDiv(cls);
        setElAttr(el, this);
        renderContent(el, view, this.spec.content);
        this.instances.add(new WeakRef(el));
        path = view instanceof FileView? view.file?.path : undefined;
        this.recycler.set(v, [el, path]);
        return el;
    }

    /**
     * Returns el if it's a new render, else directly replace old embed with
     * new embed and return null.
     */
    rerender(view: View): HTMLElement | null {
        const [oldEl, oldPath] = this.recycler.get(view) || [];
        if (!oldEl) return this.render(view);  // New render

        // No path change, skip render
        if (view instanceof FileView && oldPath === view.file?.path) return null;
    
        const newEl = this.render(view, true);
        oldEl.replaceWith(newEl);
        return null;
    }

    removeFromView(view: View) {
        this.recycler.get(view)?.[0].remove();
    }

    removeAll() {
        this.instances.forEach((ref: WeakRef<HTMLElement>) => {
            ref.deref()?.remove();
        });
    }

    destory() {
        this.removeAll();
        this.instances.clear();
        this.unload();
    }

    compare(b: Embed) {
        return this.zone === b.zone
            ? this.order - b.order
            : compareZone(this.zone, b.zone);
    }
}