import {App, Modal} from "obsidian"
import ObsidianWp from "./main"

export default class WpAuthModal extends Modal {
    private frame: HTMLElement;
    private readonly url: string;

    constructor(app: App, plugin: ObsidianWp, url: string) {
        super(app)
        this.url = url
    }

    async onOpen() {
        this.modalEl.addClass('wp-obsidian-modal')
        this.frame = document.createElement('iframe')
        this.frame.setAttr('style', 'height: 100%; width: 100%;')
        this.frame.setAttr('src', this.url)
        this.frame.setAttr('tabindex', 0)
        this.containerEl.children[1].appendChild(this.frame)
    }
}