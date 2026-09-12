import {
	Plugin,
} from 'obsidian';
import {
	DEFAULT_SETTINGS,
	Settings,
	SettingTab,
} from './settings';
import { AutoUIInjectorAPI } from './api/public';
import { embeds } from './embeds';

export default class AutoUIInjector extends Plugin {
	settings!: Settings;
	api!: AutoUIInjectorAPI;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));
		this.api = new AutoUIInjectorAPI(this.app);
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
}
