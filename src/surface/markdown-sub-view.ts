import { App, MarkdownEditView, MarkdownPreviewView } from "obsidian";
import { Embed } from "../embed";
import { Zone } from "../api/spec";
import { insertLookAfter, insertLookBefore } from "../element";
import { embeds } from "../embeds";
import { around } from "monkey-around"
import { ejectAllOfView, injectZonesOfView } from "../inject";

const { RunningHead, Eyebrow, RunningFoot } = Zone;
const { Kicker, Byline, Preface, Postscript, EndMatter } = Zone;

export function injectMarkdownSubView(
    app: App,
    subView: MarkdownEditView | MarkdownPreviewView,
    embed: Embed
) {
    if ((subView as MarkdownEditView)?.sourceMode) return;

    const view = subView.view;
    const anchorEl = ({
        [Kicker]: view.inlineTitleEl,
        [Byline]: view.metadataEditor.containerEl,
        [Preface]: view.metadataEditor.containerEl,
        [Postscript]: view.backlinksEl,
        [EndMatter]: view.backlinksEl,
    } as Record<Zone, HTMLElement | undefined>)[embed.zone];

    if (!anchorEl) return;

    // Leave preface embeds to CodeMirror extension if property display is set
    // to source (not hidden or visible)
    if (embed.zone === Preface
        && app.vault.config.propertiesInDocument === "source"
    ) {
        return;
    }

    const el = embed.render(subView.view);

    switch (embed.zone) {
        case Kicker:
        case Byline:
        case Postscript:
            insertLookBefore(anchorEl, el);
            break;
        case Preface:
        case EndMatter:
            insertLookAfter(anchorEl, el);
            break;
    }
}

function show(this: MarkdownEditView | MarkdownPreviewView) {
    const e = embeds.values()
        .filter(e => [Kicker, Byline, Preface, Postscript, EndMatter].contains(e.zone))
        .sort((a, b) => a.compare(b));

    e.filter(e => e.zone === Kicker).forEach(e => {
        this.view.inlineTitleEl.before(e.render(this.view));
    });
    e.filter(e => e.zone === Byline).forEach(e => {
        this.view.metadataEditor.containerEl.before(e.render(this.view));
    });
    e.filter(e => e.zone === Preface).reverse().forEach(e => {
        this.view.metadataEditor.containerEl.after(e.render(this.view));
    });
    e.filter(e => e.zone === Postscript).forEach(e => {
        this.view.backlinksEl.before(e.render(this.view));
    });
    e.filter(e => e.zone === EndMatter).reverse().forEach(e => {
        this.view.backlinksEl.after(e.render(this.view));
    });
}

export function patchMarkdownSubViews(markdownEditView: typeof MarkdownEditView) {
    const topBottomBarZones = [RunningHead, Eyebrow, RunningFoot];
    let unwrapMarkdownEditView = around(markdownEditView.prototype, {
        show(original) {
            return function(this: MarkdownEditView) {
                original.apply(this);
                if (this.sourceMode) {
                    ejectAllOfView(this.view);
                    return;
                }
                show.call(this);
                injectZonesOfView(this.app, this.view, topBottomBarZones);
            }
        },
        toggleSource(original) {
            return function(this: MarkdownEditView) {
                original.apply(this);
                if (this.sourceMode) {
                    ejectAllOfView(this.view);
                } else {
                    injectZonesOfView(this.app, this.view);
                }
            }
        },
    });
    let unwrapMarkdownPreviewView = around(MarkdownPreviewView.prototype, {
        show(original) {
            return function(this: MarkdownPreviewView) {
                original.apply(this);
                show.call(this);
                injectZonesOfView(this.app, this.view, topBottomBarZones);
            }
        }
    });
    return () => {
        unwrapMarkdownEditView();
        unwrapMarkdownPreviewView();
    }
}
