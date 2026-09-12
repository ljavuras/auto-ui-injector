import { App, PluginSettingTab, Setting } from 'obsidian';
import AutoUIInjector from './main';

export interface Settings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: Settings = {
	mySetting: 'default',
};

export class SettingTab extends PluginSettingTab {
	plugin: AutoUIInjector;

	constructor(app: App, plugin: AutoUIInjector) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Settings #1')
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder('Enter your secret')
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
