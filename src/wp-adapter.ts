import WPAPI from "wpapi"
import {App, MarkdownView, Notice} from "obsidian"
import fm from "front-matter"
import ObsidianWp from "./main"
import {WpCategory, WpPost, WpTag} from "./types";

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
                const {workspace} = this.app
        const activeView = workspace.getActiveViewOfType(MarkdownView)

        if (activeView) {
            const title = activeView.file.basename
            const content = await this.app.vault.read(activeView.file)
            const frontMatter = fm(content)

            console.log('Publishing Post...')
            new Notice(`Publishing Post: "${title}"`)

            // Strip front-matter and HTML comments
            const parsedContent = marked.parse(content
                .replace(/^---$.*^---$/ms, '')
                .replace(/^<!--.*-->$/ms, '')
            )

            let wpPost: WpPost;
            let postObject: WpPost = {
                title: title,
                content: parsedContent
            }


            // Parse front-matter attributes starting with 'wp_'
            for (const [key, value] of Object.entries(frontMatter.attributes)) {
                if (!key.startsWith('wp_')) {
                    continue
                }

                switch (key) {
                    case 'wp_tags':
                        let postTags: Array<number> = []
                        for (const tag of value) {
                            console.log(`Fetching data for "${tag}" tag...`)
                            let wp_tag: WpTag;
                            if (typeof tag === 'string') {
                                const wp_tags = await this.wp.tags().param('slug', tag)
                                if (!wp_tags.length) {
                                    new Notice(`Could not find matching tag: "${tag}"`)
                                    continue
                                }
                                wp_tag = wp_tags[0]
                            } else if (typeof tag === 'number') {
                                try {
                                    wp_tag = await this.wp.tags().id(tag)
                                } catch (e) {
                                    new Notice(`Could not find matching tag: "${tag}"`)
                                    continue
                                }
                            }

                            console.log(`Got tag data for "${tag}"`, wp_tag)
                            postTags.push(wp_tag.id)
                        }

                        if (postTags.length) {
                            postObject.tags = postTags
                        }
                        break
                    case 'wp_categories':
                        let postCategories: Array<number> = []
                        for (const categories of value) {
                            console.log(`Fetching data for "${categories}" category...`)
                            let wp_category: WpCategory;
                            if (typeof categories === 'string') {
                                const wp_categories = await this.wp.categories().param('slug', categories)
                                if (!wp_categories.length) {
                                    new Notice(`Could not find matching category: "${categories}"`)
                                    continue
                                }
                                wp_category = wp_categories[0]
                            } else if (typeof categories === 'number') {
                                try {
                                    wp_category = await this.wp.categories().id(categories)
                                } catch (e) {
                                    new Notice(`Could not find matching category: "${categories}"`)
                                    continue
                                }
                            }

                            console.log(`Got categories data for "${categories}"`, wp_category)
                            postCategories.push(wp_category.id)
                        }

                        if (postCategories.length) {
                            postObject.categories = postCategories
                        }
                        break;
                    default:
                        postObject[key.replace(/^wp_/, '')] = value
                }
            }

            if (postObject.slug && postObject.slug.length) {
                // Attempt to match an existing post by slug
                const post = await this.wp.posts().param('slug', postObject.slug)
                if (post.length) {
                    wpPost = post[0]
                }
            }

            if (!wpPost) {
                // Attempt to match an existing post by title
                const posts = await this.wp.posts().param('search', postObject.title)
                if (posts.length) {
                    for (const post of posts) {
                        if (post.title.rendered === postObject.title) {
                            wpPost = post
                            break
                        }
                    }
                }
            }

            if (wpPost) {
                console.log(`Found existing post "${wpPost.title.rendered}"...`)
                new Notice(`Updating Existing Post: "${wpPost.title.rendered}"`)
            } else {
                console.log(`Could not find existing post...`)
                new Notice(`Creating New Post: "${postObject.title}"`)
            }

            let result: WpPost;
            if (wpPost) {
                result = await this.wp.posts().id(wpPost.id).update(postObject)
                new Notice(`Post "${wpPost.title.rendered}" Updated Successfully 🥳`)
            } else {
                result = await this.wp.posts().create(postObject)
                new Notice(`Post "${postObject.title}" Created Successfully 🥳`)
            }

            console.log({result})
        }
    }
}