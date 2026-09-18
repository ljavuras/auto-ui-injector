import { App, WorkspaceLeaf } from "obsidian";
import { embeds } from "../embeds";
import { isValidSpec, UISpec, Zone } from "./spec";
import { inject } from "../inject";

export class AutoUIInjectorAPI {
    Zone = Zone;
    
    constructor(
        private app: App,
    ) {}

    registerAutoUI(spec: UISpec) {
        if (!isValidSpec(spec)) return;
        if (embeds.add(spec)) {
            const embed = embeds.get(spec);
            this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
                inject(this.app, leaf.view, embed!);
            })
        }
    }

    unregisterAutoUI(spec: UISpec) {
        embeds.remove(spec);
    }
}