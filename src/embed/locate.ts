import { Tree } from "@lezer/common";
import { AnchorSpec, AnchorType } from "../api/spec";
import { EditorState } from "@codemirror/state";
import { ReadViewRenderer } from "@obsidian-typings/obsidian-public-latest";

function isString(s: unknown) {
    return typeof s === "string" || s instanceof String;
}

export function locateOffset(
    anchor: AnchorSpec,
    tree: Tree,
    state: EditorState
): number | undefined {
    if (anchor.type === AnchorType.Raw) {
        const offset = anchor.locateSourceOffset(tree, state);
        return Number.isFinite(offset)? offset : undefined;
    }
    if (anchor.type === AnchorType.Section) {
        let offset;
        let occurrence = ((
            Number.isInteger(anchor.occurrence) && anchor.occurrence! > 0
        )? anchor.occurrence : 1) as number;
        tree.iterate({
            enter(node) {
                if (occurrence === 0) return;
                if (!/^header_header-\d$/.test(node.name)) return;

                const { from, to } = node;
                const text = state.doc.sliceString(from, to);
                const match = anchor.match;

                if (isString(match.text) && text !== match.text) return;
                if (isString(match.startsWith)
                    && !text.startsWith(match.startsWith)) return;
                if (isString(match.endsWith)
                    && !text.endsWith(match.endsWith)) return;
                if (isString(match.includes)
                    && !text.includes(match.includes)) return;
                if (match.regex instanceof RegExp
                    && !match.regex.test(text)) return;
                if (Number.isInteger(match.level)
                    && match.level! > 0 && match.level! < 7
                    && node.name !== `header_header-${match.level}`) return;

                offset = to;
                occurrence--;
            }
        });
        return offset;
    }
    return undefined;
}

export function locateSection(
    anchor: AnchorSpec,
    renderer: ReadViewRenderer
): number | undefined {
    if (anchor.type === AnchorType.Raw)
        return anchor.locatePreviewRendererSection(renderer);
    if (anchor.type === AnchorType.Section) {
        let occurrence = ((
            Number.isInteger(anchor.occurrence) && anchor.occurrence! > 0
        )? anchor.occurrence : 1) as number;
        const match = anchor.match;
        const level = (Number.isInteger(match.level)
            && match.level! > 0 && match.level! < 7) ? match.level : undefined;

        return renderer.sections
            .map((s, index) => ({
                start: s.start.offset,
                end: s.end.offset,
                level: s.level,
                index,
            }))
            .filter(s => s.level < 7)  // Non headers are at level 7
            .map((s) => {
                s.text = renderer.text.slice(s.start + 1 + s.level, s.end);
                return s;
            })
            .filter(s => {
                const { text, startsWith, endsWith, includes, regex } = match;
                if (isString(text) && s.text !== text) return false;
                if (isString(startsWith) && !s.text.startsWith(startsWith)) return false;
                if (isString(endsWith) && !s.text.endsWith(endsWith)) return false;
                if (isString(includes) && !s.text.includes(includes)) return false;
                if (regex instanceof RegExp && !regex.test(s.text)) return false;
                if (level && s.level !== level) return false;
                return true;
            })
            ?.[occurrence - 1]?.index;
    }
    return undefined;
}