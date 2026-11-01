import {
	FileView,
	MarkdownEditView,
	MarkdownView,
	Plugin,
	TFile,
} from 'obsidian';
import {
	DEFAULT_SETTINGS,
	Settings,
	SettingTab,
} from './settings';
import { AutoUIInjectorAPI } from './api/public';
import { embedRegister } from './embed-register';
import { patchMarkdownSubViews } from './surface/markdown-sub-view';
import { patchMarkdownPreviewRenderer } from './surface/markdown-preview-renderer';
import { Zone } from './api/spec';
import { ejectAllOfZone, injectAllOfZone, refresh } from './inject';
import { autoUIField, autoUIUpdateEffect } from './surface/codemirror';

export default class AutoUIInjector extends Plugin {
	settings!: Settings;
	api!: AutoUIInjectorAPI;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));
		this.api = new AutoUIInjectorAPI(this.app);

		// Monkey patch MarkdownEditView
		let markdownEditView = this.app.workspace
			.getActiveViewOfType(MarkdownView)?.editMode.constructor;
		if (markdownEditView) {
			this.register(patchMarkdownSubViews(
				markdownEditView as typeof MarkdownEditView
			));
		} else {
			const ref = this.app.workspace.on("file-open", () => {
				markdownEditView = this.app.workspace
					.getActiveViewOfType(MarkdownView)?.editMode.constructor;
				if (!markdownEditView) return;
				this.register(patchMarkdownSubViews(
					markdownEditView as typeof MarkdownEditView
				));
				this.app.workspace.offref(ref);
			})
		}

		this.register(patchMarkdownPreviewRenderer(this.app));

		// Register event handlers
		this.registerEvent(
			this.app.vault.on("config-changed", this.onConfigChange.bind(this))
		);
		this.registerEvent(
			this.app.workspace.on("file-open", this.onFileOpen.bind(this))
		);

		this.registerEditorExtension(autoUIField);
	}

	onunload() {
		embedRegister.clear();
		this.app.workspace.getLeavesOfType('markdown').forEach(leaf => {
			(leaf.view as MarkdownView).editMode?.editor?.cm.dispatch({
				effects: autoUIUpdateEffect.of(null)
			});
		});
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<Settings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Refresh existing views, so they react to file change.
	 * @param file - Newly opened file.
	 */
	onFileOpen(file: TFile) {
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view instanceof FileView && leaf.view.file === file) {
				refresh(leaf.view);
			}
		});
	}

	onConfigChange(configName: string) {
		/**
		 * Settings -> Editor -> Properties in document
		 * Inject into `MarkdownSubView` when set to `Visible` or `Hidden`
		 * Inject via CodeMirror API when set to `Source`
		 */
		if (configName === "propertiesInDocument") {
			if (this.app.vault.config.propertiesInDocument === "source") {
				ejectAllOfZone(Zone.Preface);
			} else {
				injectAllOfZone(Zone.Preface);
			}
			this.app.workspace.getLeavesOfType('markdown').forEach(leaf => {
				(leaf.view as MarkdownView).editMode?.editor?.cm.dispatch({
					effects: autoUIUpdateEffect.of(null)
				});
			});
		}
	}
}
