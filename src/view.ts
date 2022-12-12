import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createApp, App as VueApp } from 'vue';
import App from './App.vue';

export const VIEW_TYPE: string = 'my-view';

export class MyView extends ItemView {
    vueapp: VueApp;
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
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
        container.createEl("div", {
            cls: "my-plugin-view"
        });
        this.vueapp = createApp(App);
        this.vueapp.mount('.my-plugin-view');
    }
    async onClose() {
        this.vueapp.unmount();
    }

}