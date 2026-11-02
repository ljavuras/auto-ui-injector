import { compareZone, Zone } from "./api/spec";
import { Embed } from "./embed/embed";

const ATTR_ORDER = "data-auto-ui-order";
const ATTR_ZONE = "data-auto-ui-zone";
const CLASS_EMBED = "auto-ui-embed";
export const CLASS_TOP_BOTTOM_BAR = `view-embed ${CLASS_EMBED}`;
export const CLASS_HEADER_FOOTER = CLASS_EMBED;
export const CLASS_BODY = CLASS_EMBED;

export function setElAttr(el: Element, spec: Embed) {
    el.setAttrs({
        [ATTR_ORDER]: spec.order,
        [ATTR_ZONE]: spec.zone,
    });
}

/**
 * @returns -1 if `a` should order before `b`, 0 if `a` and `b` are equal, and
 * 1 if `a` should order after `b`.
 */
export function compareEmbed(a: Element | Embed, b: Element | Embed): number {
    const i = a instanceof Element
        ? {
            zone: a.getAttr(ATTR_ZONE) as Zone,
            order: Number(a.getAttr(ATTR_ORDER))
        }
        : { zone: a.zone, order: a.order };
    const j = b instanceof Element
        ? {
            zone: b.getAttr(ATTR_ZONE) as Zone,
            order: Number(b.getAttr(ATTR_ORDER))
        }
        : { zone: b.zone, order: b.order };

    if (i.zone !== j.zone) {
        return compareZone(i.zone, j.zone);
    } else if (i.order === j.order) {
        return 0;
    } else {
        return i.order > j.order? 1 : -1;
    }
}

/**
 * Returns true if order of `a` is greater than `b` (`a` should appear after
 * `b` in document).
 */
function compareEmbedGT(a: Element | Embed, b: Element | Embed): boolean {
    return compareEmbed(a, b) > 0;
}

function isEmbedEl(el: Element) {
    return el.hasClass(CLASS_EMBED);
}

/**
 * Inserts `el` after `anchorEl`, finds correct position if there exists embeds
 * after `anchorEl` or `anchorEl` itself is an embed.
 * @param anchorEl - Insert after this element.
 * @param el - Element to be inserted
 */
export function insertLookAfter(anchorEl: Element, el: Element) {
    if (isEmbedEl(anchorEl) && compareEmbedGT(anchorEl, el)) {
        anchorEl.before(el);
        return;
    }
    let nextEl = anchorEl.nextElementSibling;
    while (nextEl && isEmbedEl(nextEl) && compareEmbedGT(el, nextEl)) {
        anchorEl = nextEl;
        nextEl = anchorEl.nextElementSibling;
    }
    anchorEl.after(el);
}

/**
 * Inserts `el` before `anchorEl`, finds correct position if there exists embeds
 * before `anchorEl` or `anchorEl` itself is an embed.
 * @param anchorEl - Insert before this element.
 * @param el - Element to be inserted
 * @returns 
 */
export function insertLookBefore(anchorEl: Element, el: Element) {
    if (isEmbedEl(anchorEl) && compareEmbedGT(el, anchorEl)) {
        anchorEl.after(el);
        return;
    }
    let nextEl = anchorEl.previousElementSibling;
    while (nextEl && isEmbedEl(nextEl) && compareEmbedGT(nextEl, el)) {
        anchorEl = nextEl;
        nextEl = anchorEl.previousElementSibling;
    }
    anchorEl.before(el);
}