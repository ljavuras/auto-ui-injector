import { App, MarkdownView, WorkspaceLeaf } from "obsidian";
import { embedRegister } from "../embed-register";
import { isValidSpec, UISpec, Zone, AnchorType } from "./spec";
import { inject } from "../inject";
import { autoUIUpdateEffect } from "../surface/codemirror";

export class AutoUIInjectorAPI {
    Zone = Zone;
    AnchorType = AnchorType;
    
    constructor(
        private app: App,
    ) {}

    registerAutoUI(spec: UISpec) {
        if (!isValidSpec(spec)) return;
        if (embedRegister.add(spec)) {
            const embed = embedRegister.get(spec);
            if (!embed) return;
            const cmUpdate = embed.zone === Zone.Body;
            this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
                inject(leaf.view, embed);
                if (cmUpdate) {
                    (leaf.view as MarkdownView).editMode?.editor?.cm.dispatch({
                        effects: autoUIUpdateEffect.of(null)
                    });
                }
            });
        }
    }

    unregisterAutoUI(spec: UISpec) {
        embedRegister.remove(spec);
    }
}