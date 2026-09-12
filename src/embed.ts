import { Component, View } from "obsidian";
import { UISpec } from "./api/spec";
import { shouldInject } from "./condition";
import { renderContent } from "./render";
import { setElAttr } from "./element";

export class Embed extends Component {
    private instances = new Set<WeakRef<HTMLElement>>();
    get zone() { return this.spec.zone; }
    get order() { return this.spec.order; }

    constructor(
        private spec: UISpec,
    ) {
        super();
    }

    shouldInject(view: View) {
        return shouldInject(this.spec.condition, view);
    }

    render(el: HTMLElement, view: View) {
        setElAttr(el, this);
        renderContent(el, view, this, this.spec.content);
        this.instances.add(new WeakRef(el));
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