import { App, MarkdownEditView, MarkdownPreviewView, MarkdownView } from "obsidian";
import { Embed } from "../embed";
import { Zone } from "../api/spec";
import { insertLookAfter, insertLookBefore } from "../element";
import { embedRegister } from "../embed-register";
import { around } from "monkey-around"
import { ejectAllOfView, injectZonesOfView } from "../inject";

const { RunningHead, Eyebrow, RunningFoot } = Zone;
const { Kicker, Byline, Preface, Postscript, EndMatter } = Zone;
const zones = [Kicker, Byline, Preface, Postscript, EndMatter];

function propertiesIsSource(app: App) {
    return app.vault.config.propertiesInDocument === "source";
}

function injectEl(view: MarkdownView, zone: Zone, el: HTMLElement) {
    const anchorEl = ({
        [Kicker]: view.inlineTitleEl,
        [Byline]: view.metadataEditor.containerEl,
        [Preface]: view.metadataEditor.containerEl,
        [Postscript]: view.backlinksEl,
        [EndMatter]: view.backlinksEl,
    } as Record<Zone, HTMLElement | undefined>)[zone];
    if (!anchorEl) return;

    switch (zone) {
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

export function injectMarkdownSubView(
    subView: MarkdownEditView | MarkdownPreviewView,
    embed: Embed,
) {
    if (subView.type === "source" && isSourceMode(subView)) return;

    // Leave preface embeds to CodeMirror extension if property display is set
    // to source (not hidden or visible)
    if (embed.zone === Preface && propertiesIsSource(subView.app)) return;

    if (!zones.contains(embed.zone)) return;

    const view = subView.view;
    const el = embed.render(view);
    injectEl(view, embed.zone, el);
}

export function refreshMarkdownSubView(subView: MarkdownEditView | MarkdownPreviewView) {
    if (subView.type === "source" && isSourceMode(subView)) return;

    const view = subView.view;
    embedRegister.values()
        .filter(e => zones.contains(e.zone))
        .filter(e => !propertiesIsSource(subView.app) || e.zone !== Preface)
        .filter(e => e.shouldInject(subView.view))
        .forEach(embed => {
            const el = embed.rerender(view);
            if (el) injectEl(view, embed.zone, el);
        });
}

function show(this: MarkdownEditView | MarkdownPreviewView) {
    const embeds = embedRegister.values()
        .filter(e => zones.contains(e.zone))
        .filter(e => !propertiesIsSource(this.app) || e.zone !== Preface)
        .filter(e => e.shouldInject(this.view))
        .sort((a, b) => a.compare(b));
    const view = this.view;

    embeds.filter(e => e.zone === Kicker).forEach(e => {
        view.inlineTitleEl.before(e.render(this.view));
    });
    embeds.filter(e => e.zone === Byline).forEach(e => {
        view.metadataEditor.containerEl.before(e.render(this.view));
    });
    embeds.filter(e => e.zone === Preface).reverse().forEach(e => {
        view.metadataEditor.containerEl.after(e.render(this.view));
    });
    embeds.filter(e => e.zone === Postscript).forEach(e => {
        view.backlinksEl.before(e.render(this.view));
    });
    embeds.filter(e => e.zone === EndMatter).reverse().forEach(e => {
        view.backlinksEl.after(e.render(this.view));
    });
}

function isSourceMode(subView: MarkdownEditView | MarkdownPreviewView) {
    return subView.view.getState().source;
}

export function patchMarkdownSubViews(markdownEditView: typeof MarkdownEditView) {
    const topBottomBarZones = [RunningHead, Eyebrow, RunningFoot];
    const unwrapMarkdownEditView = around(markdownEditView.prototype, {
        show(original) {
            return function(this: MarkdownEditView) {
                original.apply(this);
                if (isSourceMode(this)) {
                    ejectAllOfView(this.view);
                } else {
                    show.call(this);
                }
            }
        },
        toggleSource(original) {
            return function(this: MarkdownEditView) {
                original.apply(this);
                if (isSourceMode(this)) {
                    ejectAllOfView(this.view);
                } else {
                    injectZonesOfView(this.view);
                }
            }
        },
    });
    const unwrapMarkdownPreviewView = around(MarkdownPreviewView.prototype, {
        show(original) {
            return function(this: MarkdownPreviewView) {
                original.apply(this);
                if (isSourceMode(this)) {
                    injectZonesOfView(this.view, topBottomBarZones);
                } 
                show.call(this);
            }
        }
    });
    return () => {
        unwrapMarkdownEditView();
        unwrapMarkdownPreviewView();
    }
}