import { View } from "obsidian";
import { Condition } from "../api/spec";

export function shouldInject(condition: Condition, view: View) {
    return condition(view);
}