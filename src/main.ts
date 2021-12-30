import {Notice, Plugin} from "obsidian"
import {DEFAULT_SETTINGS, ObsidianWpSettingTab} from "./settings";
import {ObsidianWpSettings} from "./types";
import WpAdapter from "./wp-adapter";
import {validateUrl} from "./helpers";

export default class ObsidianWp extends Plugin {
    settings: ObsidianWpSettings

    async onload() {
        console.log("Loading Obsidian WP Plugin")
        await this.loadSettings()

        this.addCommand({
            id: "obsidian-wp-publish",
            name: "Publish to WordPress",
            callback: async () => {
                try {
                    const url = validateUrl(this.settings.blogUrl)
                    const wp = new WpAdapter(this.app, this, url, this.settings.username, this.settings.applicationPassword)
                    await wp.discover()
                    await wp.insertPost()
                }
                catch (e) {
                    new Notice(e.message)
                }
            }
        })

        this.addSettingTab(new ObsidianWpSettingTab(this.app, this))
    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
    }

    async saveSettings() {
        await this.saveData(this.settings)
    }
}
