import { ItemView, WorkspaceLeaf } from 'obsidian'
import { createApp } from 'vue'
import Outline from './App.vue'

export const VIEW_TYPE: string = 'hahaha'

export class OutlineView extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf)
    }
    getViewType(): string {
        return VIEW_TYPE
    } 
    getDisplayText(): string{
        return "Quiet Outline"
    }
    getIcon(): string{
        return "logo-crystal"
    }
    async onOpen(this:OutlineView) {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl("div", { 
            cls: "my-plugin-view"
        })
        setTimeout(()=> { createApp(Outline).mount('.my-plugin-view') }, 0)
    }
    async onClose() {
        
    }

}