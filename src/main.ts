import { Plugin } from "obsidian";

import { type MyPluginSettings, DEFAULT_SETTINGS, MyPluginSettingsTab } from "./settings";
import { MyView, VIEW_TYPE } from "./view";
import "./main.css";

export default class MyPlugin extends Plugin {
    settings!: MyPluginSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new MyPluginSettingsTab(this));

        this.registerView(
            VIEW_TYPE,
            (leaf) => new MyView(leaf, this)
        );

        this.addRibbonIcon('dice', 'Open my view', () => {
            this.activateView();
        });

    }

    onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
    async activateView() {
        if (this.app.workspace.getLeavesOfType(VIEW_TYPE).length === 0) {
            await this.app.workspace.getRightLeaf(false)?.setViewState({
                type: VIEW_TYPE,
                active: true,
            });
        }

        this.app.workspace.revealLeaf(
            this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]
        );
    }
}
