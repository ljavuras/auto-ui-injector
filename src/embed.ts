import { Component, View } from "obsidian";
import { UISpec, Zone } from "./api/spec";
import { shouldInject } from "./condition";
import { renderContent } from "./render";
import { CLASS_HEADER_FOOTER, CLASS_TOP_BOTTOM_BAR, setElAttr } from "./element";

export class Embed extends Component {
    private instances = new Set<WeakRef<HTMLElement>>();
    private recycler = new WeakMap<View, HTMLElement>();

    get zone() { return Zone[this.spec.position.zone]; }
    get order() { return this.spec.position.order; }

    constructor(
        private spec: UISpec,
    ) {
        super();
    }

    shouldInject(view: View) {
        return shouldInject(this.spec.condition, view);
    }

    render(view: View) {
        let cls, el;
        el = this.recycler.get(view);
        if (el) return el;
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
        }
        el = createDiv(cls);
        setElAttr(el, this);
        renderContent(el, view, this, this.spec.content);
        this.instances.add(new WeakRef(el));
        this.recycler.set(view, el);
        return el;
    }

    cleanUp() {
        this.instances.forEach((ref: WeakRef<HTMLElement>) => {
            ref.deref()?.remove();
        });
        this.instances.clear();
    }

    destory() {
        this.cleanUp();
        this.unload();
    }
}