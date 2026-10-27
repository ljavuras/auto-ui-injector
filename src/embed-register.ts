import { UISpec } from "./api/spec";
import { Embed } from "./embed/embed";

class EmbedRegister {
    container: Map<UISpec, Embed> = new Map();
    
    add(spec: UISpec) {
        if (this.has(spec)) {
            return false;
        }
        const embed = new Embed(spec)
        this.container.set(spec, embed);
        return true;
    }

    has(spec: UISpec) {
        return this.container.has(spec);
    }

    get(spec: UISpec) {
        return this.container.get(spec);
    }

    remove(spec: UISpec) {
        this.get(spec)?.destory();
        this.container.delete(spec);
    }

    clear() {
        for (const embed of this.container.values()) {
            embed.destory();
        }
        this.container.clear();
    }

    values() {
        return [...this.container.values()];
    }
}

export let embedRegister = new EmbedRegister();