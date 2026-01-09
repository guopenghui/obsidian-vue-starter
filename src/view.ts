import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createApp, type App as VueApp } from 'vue';
import App from './App.vue';
import type MyPlugin from './main';

export const VIEW_TYPE: string = 'my-view';

export class MyView extends ItemView {
    vueApp!: VueApp;
    plugin: MyPlugin;
    constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
        super(leaf);
        this.plugin = plugin;
    }
    getViewType(): string {
        return VIEW_TYPE;
    }
    getDisplayText(): string {
        return "Vue Stater";
    }
    getIcon(): string {
        return "dice";
    }
    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        let content = container.createEl("div", {
            cls: "my-plugin-view"
        });

        this.vueApp = createApp(App);
        this.vueApp.provide("name", this.plugin.settings.myName);
        this.vueApp.mount(content);
    }
    async onClose() {
        this.vueApp.unmount();
    }
}
