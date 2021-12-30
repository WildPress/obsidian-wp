import {App, Notice, PluginSettingTab, Setting} from "obsidian";
import {ObsidianWpSettings} from "./types";
import ObsidianWp from "./main";
import WpAuthModal from "./wp-view";
import WpAdapter from "./wp-adapter";
import { validateUrl } from "./helpers";

export const DEFAULT_SETTINGS: ObsidianWpSettings = {
    blogUrl: "",
    username: "",
    applicationPassword: "",
    restPath: "/wp-json"
}

export class ObsidianWpSettingTab extends PluginSettingTab {
    plugin: ObsidianWp

    constructor(app: App, plugin: ObsidianWp) {
        super(app, plugin)
        this.plugin = plugin
    }

    display(): void {
        const {containerEl} = this

        containerEl.empty()
        containerEl.createEl("h2", {text: "Obsidian WP Settings"})

        new Setting(containerEl)
            .setName("Blog URL")
            .setDesc("Enter your site's URL")
            .addText((text) => {
                text.setPlaceholder('https://example.com')
                    .setValue(this.plugin.settings.blogUrl)
                    .onChange(async (value) => {
                        this.plugin.settings.blogUrl = value
                        await this.plugin.saveSettings()
                    })
            })

        new Setting(containerEl)
            .setName("Authorize")
            .setDesc("Authorize Obsidian to access your WordPress website using an application password")
            .addButton((button) => {
                button.setButtonText("Generate Application Password")
                    .setCta()
                    .onClick(async () => {
                        try {
                            const url = validateUrl(this.plugin.settings.blogUrl)
                            const wp = new WpAdapter(this.app, this.plugin, url)
                            await wp.discover()
                            await wp.canAuthenticate()

                            const modal = new WpAuthModal(this.app, this.plugin, wp.authEndpoint)
                            modal.open()
                        } catch (e) {
                            new Notice(e.message)
                        }
                    })
            })

        new Setting(containerEl)
            .setName("Username")
            .setDesc("Enter your WordPress username (usually not your email address)")
            .addText((text) => {
                text.setPlaceholder('WordPress Username')
                    .setValue(this.plugin.settings.username)
                    .onChange(async (value) => {
                        this.plugin.settings.username = value
                        await this.plugin.saveSettings()
                    })
            })

        new Setting(containerEl)
            .setName("Application Password")
            .setDesc("Enter your application password (not your main WordPress password). Once you generate your application password you can copy it and paste it here.")
            .addText((text) => {
                text.setPlaceholder('Application Password')
                    .setValue(this.plugin.settings.applicationPassword)
                    .onChange(async (value) => {
                        this.plugin.settings.applicationPassword = value
                        await this.plugin.saveSettings()
                    })
            })

        new Setting(containerEl)
            .setName("Validate Settings")
            .setDesc("Once you have added your username and application password, click here to validate you are able to post to your WordPress website.")
            .addButton((button) => {
                button.setButtonText("Validate Settings")
                    .onClick(async (e) => {
                        try {
                            const url = validateUrl(this.plugin.settings.blogUrl)

                            if (this.plugin.settings.username.length === 0) {
                                throw new Error('Empty username')
                            }

                            if (this.plugin.settings.applicationPassword.length === 0) {
                                throw new Error('Empty application password')
                            }

                            const wp = new WpAdapter(this.app, this.plugin, url, this.plugin.settings.username, this.plugin.settings.applicationPassword)
                            await wp.discover()
                            await wp.currentUserInfo()
                            new Notice("Success! You can start posting 🥳 Use the 'Publish to WordPress' command to get started.")
                        } catch (e) {
                            new Notice(e.message)
                        }
                    })
            })

        new Setting(containerEl)
            .setName("REST Path")
            .setDesc("If you have pretty permalinks disabled, you may need to set this to /?rest_route=")
            .addText((text) => {
                text.setPlaceholder('/wp-json')
                    .setValue(this.plugin.settings.restPath)
                    .onChange(async (value) => {
                        this.plugin.settings.restPath = value
                        await this.plugin.saveSettings()
                    })
            })
    }
}