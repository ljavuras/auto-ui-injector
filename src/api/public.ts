import { App, WorkspaceLeaf } from "obsidian";
import { embedRegister } from "../embed-register";
import { isValidSpec, UISpec, Zone } from "./spec";
import { inject } from "../inject";

export class AutoUIInjectorAPI {
    Zone = Zone;
    
    constructor(
        private app: App,
    ) {}

    registerAutoUI(spec: UISpec) {
        if (!isValidSpec(spec)) return;
        if (embedRegister.add(spec)) {
            const embed = embedRegister.get(spec);
            this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
                inject(leaf.view, embed!);
            })
        }
    }

    unregisterAutoUI(spec: UISpec) {
        embedRegister.remove(spec);
    }
}