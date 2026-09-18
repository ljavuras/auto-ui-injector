import {
	MarkdownEditView,
	MarkdownView,
	Plugin,
} from 'obsidian';
import {
	DEFAULT_SETTINGS,
	Settings,
	SettingTab,
} from './settings';
import { AutoUIInjectorAPI } from './api/public';
import { embeds } from './embeds';
import { patchMarkdownSubViews } from './surface/markdown-sub-view';
import { Zone } from './api/spec';
import { ejectAllOfZone, injectAllOfZone } from './inject';

export default class AutoUIInjector extends Plugin {
	settings!: Settings;
	api!: AutoUIInjectorAPI;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));
		this.api = new AutoUIInjectorAPI(this.app);

		let markdownEditView = this.app.workspace
			.getActiveViewOfType(MarkdownView)?.editMode.constructor;
		if (markdownEditView) {
			this.register(patchMarkdownSubViews(
				markdownEditView as typeof MarkdownEditView
			));
		} else {
			const ref = this.app.workspace.on('file-open', () => {
				markdownEditView = this.app.workspace
					.getActiveViewOfType(MarkdownView)?.editMode.constructor;
				if (!markdownEditView) return;
				this.register(patchMarkdownSubViews(
					markdownEditView as typeof MarkdownEditView
				));
				this.app.workspace.offref(ref);
			})
		}

		this.app.vault.on("config-changed", this.onConfigChange.bind(this));
	}

	onunload() {
		embeds.clear();
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

	onConfigChange(configName: string) {
		if (configName === "propertiesInDocument") {
			if (this.app.vault.config.propertiesInDocument === "source") {
				ejectAllOfZone(Zone.Preface);
			} else {
				injectAllOfZone(app, Zone.Preface);
			}
		}
	}
}
