import {
	FileView,
	MarkdownEditView,
	MarkdownView,
	Plugin,
	TFile,
} from 'obsidian';
import { AutoUIInjectorAPI } from './api/public';
import { embedRegister } from './embed-register';
import { patchMarkdownSubViews } from './surface/markdown-sub-view';
import { patchMarkdownPreviewRenderer } from './surface/markdown-preview-renderer';
import { Zone } from './api/spec';
import { ejectAllOfZone, injectAllOfZone, refresh } from './inject';
import { autoUIField, autoUIUpdateEffect } from './surface/codemirror';

export default class AutoUIInjector extends Plugin {
	api!: AutoUIInjectorAPI;

	async onload() {
		await this.loadSettings();
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
			this.app.workspace.on("file-open", this.onFilePathChange.bind(this))
		);
		this.registerEvent(
			this.app.vault.on("rename", (file) => {
				if (file instanceof TFile)
					this.onFilePathChange(file);
			})
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
			// DEFAULT_SETTINGS,
			// (await this.loadData()) as Partial<Settings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Refresh existing views, so they react to file change.
	 * @param file - Newly opened file.
	 */
	onFilePathChange(file: TFile | null) {
		this.app.workspace.iterateAllLeaves((leaf) => {
			if ((leaf.view as FileView)?.file === file) {
				if (leaf.view instanceof FileView) refresh(leaf.view);
				if (leaf.view instanceof MarkdownView) {
					leaf.view.editMode?.editor?.cm.dispatch({
						effects: autoUIUpdateEffect.of(null)
					});
				}
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
				injectAllOfZone(Zone.Preface, this.app);
			}
			this.app.workspace.getLeavesOfType('markdown').forEach(leaf => {
				(leaf.view as MarkdownView).editMode?.editor?.cm.dispatch({
					effects: autoUIUpdateEffect.of(null)
				});
			});
		}
	}
}
