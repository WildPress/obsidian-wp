<?php
/**
* Plugin Name:       Obsidian WP Helper
* Plugin URI:        https://wildpress.co/obsidian-wp
* Description:       Supporting WordPress plugin for the Obsidian WP Plugin. Publish directly from Obsidian to WordPress!
* Version:           1.0
* Requires at least: 5.6
* Requires PHP:      7.2
* Author:            WildPress
* Author URI:        https://wildpress.co/
* License:           MIT
* License URI:       https://opensource.org/licenses/MIT
* Update URI:        https://wildpress.co/obsidian-wp/
* Text Domain:       obsidian-wp
* Domain Path:       /languages
*/

if (!defined('ABSPATH')) {
    exit();
}

add_action('init', function () {
    $origin = get_http_origin();
    if ($origin === "app://obsidian.md") {
        header("Access-Control-Allow-Origin: {$origin}");
        header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Allow-Headers: Origin, X-Requested-With");
    }
});