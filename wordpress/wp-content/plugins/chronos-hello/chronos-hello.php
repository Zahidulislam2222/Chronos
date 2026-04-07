<?php
/**
 * Plugin Name: Chronos Hello
 * Description: A simple test plugin to verify VS Code editing works
 * Version: 1.0
 * Author: Zahidul Islam
 */

// Adds a message at the top of wp-admin
add_action('admin_notices', function () {
    echo '<div class="notice notice-success"><p>Hello from VS Code! This plugin was created in your editor.</p></div>';
});
