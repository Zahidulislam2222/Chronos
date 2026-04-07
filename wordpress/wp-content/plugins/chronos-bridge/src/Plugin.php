<?php
/**
 * Main plugin class — singleton that bootstraps all modules.
 *
 * @package ChronosBridge
 */

declare(strict_types=1);

namespace ChronosBridge;

use ChronosBridge\Admin\AdminMenu;
use ChronosBridge\Admin\Settings;
use ChronosBridge\Api\ContactEndpoint;
use ChronosBridge\Api\WatchEndpoint;
use ChronosBridge\Cache\TransientCache;
use ChronosBridge\Cron\CleanupJob;
use ChronosBridge\Database\Migrator;
use ChronosBridge\GraphQL\ContactMutation;
use ChronosBridge\I18n\Loader as I18nLoader;
use ChronosBridge\Payment\CheckoutEndpoint;
use ChronosBridge\Payment\WebhookHandler;
use ChronosBridge\PostTypes\Taxonomy;
use ChronosBridge\PostTypes\WatchCollection;
use ChronosBridge\AI\ContactResponder;
use ChronosBridge\AI\DescriptionGenerator;
use ChronosBridge\Analytics\Tracker;
use ChronosBridge\SEO\StructuredData;
use ChronosBridge\WooCommerce\CheckoutFields;

/**
 * Main plugin singleton class.
 */
final class Plugin {

	/**
	 * The single instance of this class.
	 *
	 * @var self|null
	 */
	private static ?self $instance = null;

	/**
	 * Prevent direct instantiation.
	 */
	private function __construct() {
		// Singleton — use ::init().
	}

	/**
	 * Initialize the plugin (singleton entry point).
	 */
	public static function init(): void {
		if ( null !== self::$instance ) {
			return;
		}

		self::$instance = new self();
		self::$instance->boot();
	}

	/**
	 * Get the singleton instance.
	 */
	public static function instance(): self {
		if ( null === self::$instance ) {
			self::init();
		}

		return self::$instance;
	}

	/**
	 * Boot all plugin modules.
	 */
	private function boot(): void {
		// i18n — load text domain.
		I18nLoader::register();

		// Database — check for upgrades on admin_init.
		add_action( 'admin_init', array( Migrator::class, 'maybe_upgrade' ) );

		// Post types and taxonomies.
		WatchCollection::register();
		Taxonomy::register();

		// GraphQL mutations.
		ContactMutation::register();

		// REST API endpoints.
		add_action(
			'rest_api_init',
			function (): void {
				( new ContactEndpoint() )->register_routes();
				( new WatchEndpoint() )->register_routes();
				( new CheckoutEndpoint() )->register_routes();
				( new WebhookHandler() )->register_routes();
			}
		);

		// WooCommerce custom checkout fields.
		CheckoutFields::register();

		// AI features (WP 7.0+).
		DescriptionGenerator::register();
		ContactResponder::register();

		// SEO structured data (JSON-LD).
		StructuredData::register();

		// Analytics tracking (GA4/GTM).
		Tracker::register();

		// Admin pages and settings (only in admin context).
		if ( is_admin() ) {
			AdminMenu::register();
			Settings::register();
		}

		// Cache invalidation hooks.
		TransientCache::register_invalidation_hooks();

		// Cron job handlers.
		CleanupJob::register();

		// Add settings link on plugins page.
		add_filter( 'plugin_action_links_' . CHRONOS_BRIDGE_BASENAME, array( $this, 'add_settings_link' ) );
	}

	/**
	 * Plugin activation callback.
	 */
	public static function activate(): void {
		// Run database migrations.
		Migrator::run();

		// Schedule cron events.
		CleanupJob::schedule();

		// Register CPTs/taxonomies before flushing rewrite rules.
		WatchCollection::register_post_type();
		Taxonomy::register_taxonomies();
		flush_rewrite_rules();
	}

	/**
	 * Plugin deactivation callback.
	 */
	public static function deactivate(): void {
		// Unschedule cron events.
		CleanupJob::unschedule();

		flush_rewrite_rules();
	}

	/**
	 * Add a "Settings" link on the Plugins page.
	 *
	 * @param array<string> $links Existing plugin action links.
	 * @return array<string>
	 */
	public function add_settings_link( array $links ): array {
		$settings_link = sprintf(
			'<a href="%s">%s</a>',
			esc_url( admin_url( 'admin.php?page=chronos-settings' ) ),
			esc_html__( 'Settings', 'chronos-bridge' )
		);

		array_unshift( $links, $settings_link );
		return $links;
	}
}
