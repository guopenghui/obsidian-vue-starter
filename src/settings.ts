import { PluginSettingTab, Setting } from 'obsidian';
import type MyPlugin from './main';

export interface MyPluginSettings {
    myName: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
    myName: 'World'
};

export class MyPluginSettingsTab extends PluginSettingTab {
    plugin: MyPlugin;

    constructor(plugin: MyPlugin) {
        super(plugin.app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('My Name')
            .setDesc('This is a name setting')
            .addText((text) =>
                text
                    .setPlaceholder('Enter your name')
                    .setValue(this.plugin.settings.myName)
                    .onChange(async (value) => {
                        this.plugin.settings.myName = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
