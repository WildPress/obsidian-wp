import WPAPI from "wpapi"
import {App, MarkdownView, Notice} from "obsidian"
import fm from "front-matter"
import ObsidianWp from "./main"
import {WpPost} from "./types";

const marked = require("marked")

export default class WpAdapter {
    private wp: WPAPI;
    public authEndpoint: string;

    constructor(
        private readonly app: App,
        private readonly plugin: ObsidianWp,
        private readonly blogUrl: string,
        private readonly username?: string,
        private readonly password?: string,
    ) {
    }

    async discover() {
        try {
            console.log('Attempting Auto Discovery...')
            this.wp = await WPAPI.discover(this.blogUrl)
        } catch (e) {
            console.log(e)
            this.wp = await this.manualDiscovery()
        }

        // Attempt authentication
        if (this.username && this.password) {
            console.log('Registering Auth Credentials...')
            this.wp.auth({
                username: this.username,
                password: this.password
            })
        }
    }

    async manualDiscovery() {
        try {
            console.log('Attempting Manual Discovery...')
            return new WPAPI({
                endpoint: `${this.blogUrl}${this.plugin.settings.restPath}`,
            })
        } catch (e) {
            console.log(e)
        }
    }

    async canAuthenticate(): Promise<boolean> {
        try {
            console.log('Verifying with can use application passwords...')
            await this.wp.root().get((e: Error, data: any) => {
                if (e) {
                    throw e
                }

                const authEndpoint = data?.['authentication']?.['application-passwords']?.['endpoints']?.['authorization']
                if (authEndpoint == null) {
                    throw "Unable to authenticate, are you using WordPress 5.6 or higher?"
                }

                this.authEndpoint = authEndpoint
            })

            return true
        } catch (e) {
            console.log(e)
            return false
        }
    }

    async currentUserInfo() {
        console.log('Fetching User Info...')
        const user = await this.wp.users().me().param('context', 'edit')

        if (!user.capabilities?.edit_posts) {
            throw new Error("You don't have permission to edit blog posts.")
        }
    }

    async insertPost() {
        console.log('Inserting Post...')
        const {workspace} = this.app
        const activeView = workspace.getActiveViewOfType(MarkdownView)

        if (activeView) {
            const title = activeView.file.basename
            const content = await this.app.vault.read(activeView.file)
            const frontMatter = fm(content)
            const parsedContent = marked.parse(content
                .replace(/^---$.*^---$/ms, '')
                .replace(/^<!--$.*^-->$/ms, '')
            )

            let postId: number;
            let postObject: WpPost = {
                title: title,
                content: parsedContent
            }

            for (const [key, value] of Object.entries(frontMatter.attributes)) {
                postObject[key] = value
            }

            await this.wp.posts()
                .param('status', 'any')
                .param('posts_per_page', '-1')
                .get((error, data: Array<WpPost>) => {
                for (const post of data) {
                    // Set the post ID if the slugs match
                    if (postObject.slug && postObject.slug === post.slug) {
                        console.log(`Matched slug: ${postObject.slug}`)
                        postId = post.id
                        return
                    }

                    // Set the post ID if the titles match
                    if (postObject.title === post.title?.rendered) {
                        console.log(`Matched title: ${postObject.title}`)
                        postId = post.id
                        return
                    }
                }
            })

            let result: WpPost;
            if (postId) {
                result = await this.wp.posts().id(postId).update(postObject)
                new Notice("Post updated successfully 🥳")
            } else {
                result = await this.wp.posts().create(postObject)
                new Notice("Post created successfully 🥳")
            }

            console.log({result})
        }
    }
}