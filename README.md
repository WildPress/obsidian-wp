# Obsidian WP Plugin
Post directly to your WordPress blog from Obsidian.

## Requirements
- WordPress 5.6 or greater (not WordPress.com)
- CORS support https://enable-cors.org/server.html

## Instructions
- Ensure CORS is set up correctly on your server
- From the plugin settings page, add your credentials
- Make sure your WordPress user has the ability to create posts
- Verify your settings are working from the plugin settings page
- Use the "Publish to WordPress" command to upload the current page to your WordPress website

## Plugin Options
- In the front matter you can specify various meta-data for your post:
  - https://developer.wordpress.org/rest-api/reference/posts/#create-a-post.
  - Categories and tags needs to use their IDs, not slugs.
  - Specify the "slug" if you want a specific URL for your post.
  - Specify the "status" to determine the WordPress publish status ("draft", "publish", [etc.](https://wordpress.org/support/article/post-status/)) default is "draft".

### Example Front Matter:
\---\
slug: 'hello-world'\
status: 'publish'\
excerpt: 'This is the post excerpt'\
categories: [13, 6]\
tags: [12, 8, 42]\
\---

### Commenting
Text surrounded by HTML comment tags (see below), will be ignored and not published to WordPress. Handy if there are bits you want to exclude from WordPress but keep in the same Obsidian markdown file.

\<!--\
This is a comment\
\-->