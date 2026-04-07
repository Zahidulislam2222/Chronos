<?php
/**
 * Google Analytics / GTM integration.
 *
 * Outputs tracking code in wp_head based on the admin setting.
 *
 * @package ChronosBridge\Analytics
 */

declare(strict_types=1);

namespace ChronosBridge\Analytics;

/**
 * Outputs Google Analytics or GTM tracking code.
 */
final class Tracker {

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_action( 'wp_head', array( self::class, 'output_tracking_code' ), 1 );

		// REST endpoint for headless frontend.
		add_action( 'rest_api_init', array( self::class, 'register_rest_routes' ) );
	}

	/**
	 * Output the GA4 or GTM tracking code in wp_head.
	 */
	public static function output_tracking_code(): void {
		$tracking_id = self::get_tracking_id();

		if ( empty( $tracking_id ) ) {
			return;
		}

		// Detect GA4 vs GTM vs Universal Analytics.
		if ( str_starts_with( $tracking_id, 'GTM-' ) ) {
			self::output_gtm( $tracking_id );
		} elseif ( str_starts_with( $tracking_id, 'G-' ) ) {
			self::output_ga4( $tracking_id );
		} elseif ( str_starts_with( $tracking_id, 'UA-' ) ) {
			self::output_ga4( $tracking_id );
		}
	}

	/**
	 * Get the tracking ID from settings.
	 */
	public static function get_tracking_id(): string {
		return (string) get_option( 'chronos_ga_tracking_id', '' );
	}

	/**
	 * Output GA4 tracking code.
	 *
	 * @param string $measurement_id The GA4 measurement ID.
	 */
	private static function output_ga4( string $measurement_id ): void {
		$measurement_id = esc_attr( $measurement_id );
		// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript,WordPress.Security.EscapeOutput.OutputNotEscaped -- GA4 requires inline script per Google docs. Value is already escaped via esc_attr above.
		printf(
			'<script async src="https://www.googletagmanager.com/gtag/js?id=%1$s"></script>' . "\n" .
			'<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}' .
			'gtag("js",new Date());gtag("config","%1$s");</script>' . "\n",
			$measurement_id
		);
		// phpcs:enable
	}

	/**
	 * Output GTM container code.
	 *
	 * @param string $container_id The GTM container ID.
	 */
	private static function output_gtm( string $container_id ): void {
		$container_id = esc_attr( $container_id );
		// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript,WordPress.Security.EscapeOutput.OutputNotEscaped -- GTM requires inline script per Google docs. Value is already escaped via esc_attr above.
		printf(
			'<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({"gtm.start":new Date().getTime(),event:"gtm.js"});' .
			'var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!="dataLayer"?"&l="+l:"";' .
			'j.async=true;j.src="https://www.googletagmanager.com/gtm.js?id="+i+dl;f.parentNode.insertBefore(j,f);' .
			'})(window,document,"script","dataLayer","%s");</script>' . "\n",
			$container_id
		);
		// phpcs:enable
	}

	/**
	 * Register REST routes for headless analytics config.
	 */
	public static function register_rest_routes(): void {
		register_rest_route(
			'chronos/v1',
			'/analytics/config',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( self::class, 'rest_get_config' ),
					'permission_callback' => '__return_true',
				),
			)
		);
	}

	/**
	 * REST callback: return analytics config for headless frontend.
	 *
	 * @param \WP_REST_Request $request The request.
	 * @return \WP_REST_Response
	 */
	public static function rest_get_config( \WP_REST_Request $request ): \WP_REST_Response { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found -- Required by REST API.
		$tracking_id = self::get_tracking_id();

		$type = '';
		if ( str_starts_with( $tracking_id, 'GTM-' ) ) {
			$type = 'gtm';
		} elseif ( str_starts_with( $tracking_id, 'G-' ) ) {
			$type = 'ga4';
		} elseif ( str_starts_with( $tracking_id, 'UA-' ) ) {
			$type = 'ua';
		}

		return new \WP_REST_Response(
			array(
				'trackingId' => $tracking_id,
				'type'       => $type,
				'enabled'    => ! empty( $tracking_id ),
			),
			200
		);
	}
}
