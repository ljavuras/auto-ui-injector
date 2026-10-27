import { Tree } from "@lezer/common";
import { AnchorSpec, AnchorType } from "../api/spec";
import { EditorState } from "@codemirror/state";

export function locateOffset(
    anchorSpec: AnchorSpec,
    tree: Tree,
    state: EditorState
): number | undefined {
    if (anchorSpec.type === AnchorType.Raw) {
        const offset = anchorSpec.locateSourceOffset(tree, state);
        return Number.isFinite(offset)? offset : undefined;
    }
    return undefined;
}