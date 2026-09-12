import { App, WorkspaceLeaf } from "obsidian";
import { embeds } from "../embeds";
import { UISpec, Zone } from "./spec";
import { inject } from "../inject";

export class AutoUIInjectorAPI {
    Zone = Zone;
    UISpec = UISpec;
    
    constructor(
        private app: App,
    ) {}

    registerAutoUI(spec: UISpec) {
        if (embeds.add(spec)) {
            const embed = embeds.get(spec);
            this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
                inject(leaf.view, embed!);
            })
        }
    }

    unregisterAutoUI(spec: UISpec) {
        embeds.remove(spec);
    }
}