<?php
/**
 * AI-powered product description generator using WP 7.0 AI Client.
 *
 * Generates marketing copy for watch listings based on watch specifications.
 * Requires WordPress 7.0+ with an AI provider plugin installed and configured.
 *
 * @package ChronosBridge\AI
 */

declare(strict_types=1);

namespace ChronosBridge\AI;

/**
 * Generates watch descriptions via the WP 7.0 AI Client API.
 */
final class DescriptionGenerator {

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		// Admin meta box for "Generate Description" button.
		add_action( 'add_meta_boxes', array( self::class, 'add_meta_box' ) );

		// REST API endpoint.
		add_action( 'rest_api_init', array( self::class, 'register_rest_routes' ) );

		// Register as a WordPress Ability (WP 6.9+).
		add_action( 'wp_abilities_api_categories_init', array( self::class, 'register_ability_category' ) );
		add_action( 'wp_abilities_api_init', array( self::class, 'register_ability' ) );
	}

	/**
	 * Check if AI features are available.
	 */
	public static function is_available(): bool {
		// Check WP 7.0 AI Client exists.
		if ( ! function_exists( 'wp_ai_client_prompt' ) || ! function_exists( 'wp_supports_ai' ) ) {
			return false;
		}

		// Check AI is enabled site-wide.
		if ( ! wp_supports_ai() ) {
			return false;
		}

		// Check text generation is supported (provider configured).
		return wp_ai_client_prompt( '' )->is_supported_for_text_generation();
	}

	/**
	 * Add meta box to the watch edit screen.
	 */
	public static function add_meta_box(): void {
		add_meta_box(
			'chronos_ai_description',
			__( 'AI Description Generator', 'chronos-bridge' ),
			array( self::class, 'render_meta_box' ),
			'chronos_watch',
			'side',
			'default'
		);
	}

	/**
	 * Render the meta box content.
	 *
	 * @param \WP_Post $post The current post.
	 */
	public static function render_meta_box( \WP_Post $post ): void {
		$available = self::is_available();
		$nonce     = wp_create_nonce( 'chronos_ai_generate' );
		?>
		<div id="chronos-ai-generator">
			<?php if ( $available ) : ?>
				<p class="description">
					<?php esc_html_e( 'Generate a marketing description based on this watch\'s specifications.', 'chronos-bridge' ); ?>
				</p>
				<button type="button"
					id="chronos-ai-generate-btn"
					class="button button-primary"
					data-post-id="<?php echo esc_attr( (string) $post->ID ); ?>"
					data-nonce="<?php echo esc_attr( $nonce ); ?>"
					style="margin-top: 8px; width: 100%;">
					<?php esc_html_e( 'Generate Description', 'chronos-bridge' ); ?>
				</button>
				<div id="chronos-ai-status" style="margin-top: 8px; display: none;"></div>
				<script>
				(function() {
					var btn = document.getElementById('chronos-ai-generate-btn');
					var status = document.getElementById('chronos-ai-status');
					if (!btn) return;

					btn.addEventListener('click', function() {
						btn.disabled = true;
						btn.textContent = '<?php echo esc_js( __( 'Generating...', 'chronos-bridge' ) ); ?>';
						status.style.display = 'block';
						status.textContent = '';
						status.className = '';

						fetch('<?php echo esc_url( rest_url( 'chronos/v1/ai/generate-description' ) ); ?>', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'X-WP-Nonce': '<?php echo esc_js( wp_create_nonce( 'wp_rest' ) ); ?>'
							},
							body: JSON.stringify({ postId: <?php echo (int) $post->ID; ?> })
						})
						.then(function(res) { return res.json(); })
						.then(function(data) {
							if (data.success && data.data.description) {
								/* Try to insert into the block editor or classic editor. */
								if (window.wp && window.wp.data) {
									var editor = window.wp.data.dispatch('core/editor');
									if (editor && editor.editPost) {
										editor.editPost({ content: data.data.description });
										status.textContent = '<?php echo esc_js( __( 'Description inserted into editor!', 'chronos-bridge' ) ); ?>';
										status.style.color = '#00a32a';
									}
								} else if (document.getElementById('content')) {
									document.getElementById('content').value = data.data.description;
									status.textContent = '<?php echo esc_js( __( 'Description inserted!', 'chronos-bridge' ) ); ?>';
									status.style.color = '#00a32a';
								}

								if (data.data.excerpt) {
									var excerptField = document.getElementById('excerpt');
									if (excerptField) excerptField.value = data.data.excerpt;
								}
							} else {
								status.textContent = data.message || '<?php echo esc_js( __( 'Generation failed.', 'chronos-bridge' ) ); ?>';
								status.style.color = '#d63638';
							}
						})
						.catch(function() {
							status.textContent = '<?php echo esc_js( __( 'Network error.', 'chronos-bridge' ) ); ?>';
							status.style.color = '#d63638';
						})
						.finally(function() {
							btn.disabled = false;
							btn.textContent = '<?php echo esc_js( __( 'Generate Description', 'chronos-bridge' ) ); ?>';
						});
					});
				})();
				</script>
			<?php else : ?>
				<p class="description" style="color: #996800;">
					<?php
					printf(
						/* translators: %s: Settings page URL */
						esc_html__( 'AI features require WordPress 7.0+ with an AI provider configured. Visit %s to set up a connector.', 'chronos-bridge' ),
						'<a href="' . esc_url( admin_url( 'options-general.php?page=connectors' ) ) . '">' . esc_html__( 'Settings > Connectors', 'chronos-bridge' ) . '</a>'
					);
					?>
				</p>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * Generate a description for a watch post.
	 *
	 * @param int $post_id The watch post ID.
	 * @return array{description: string, excerpt: string}|\WP_Error
	 */
	public static function generate( int $post_id ): array|\WP_Error {
		if ( ! self::is_available() ) {
			return new \WP_Error(
				'ai_not_available',
				__( 'AI features are not available. Install an AI provider plugin and configure it in Settings > Connectors.', 'chronos-bridge' ),
				array( 'status' => 503 )
			);
		}

		$post = get_post( $post_id );
		if ( ! $post || 'chronos_watch' !== $post->post_type ) {
			return new \WP_Error( 'invalid_post', __( 'Watch not found.', 'chronos-bridge' ), array( 'status' => 404 ) );
		}

		// Gather watch specifications.
		$title      = get_the_title( $post );
		$brands     = wp_get_post_terms( $post_id, 'chronos_brand', array( 'fields' => 'names' ) );
		$movements  = wp_get_post_terms( $post_id, 'chronos_movement', array( 'fields' => 'names' ) );
		$price      = (int) get_post_meta( $post_id, '_chronos_price', true );
		$reference  = get_post_meta( $post_id, '_chronos_reference', true );
		$diameter   = (int) get_post_meta( $post_id, '_chronos_case_diameter', true );
		$material   = get_post_meta( $post_id, '_chronos_case_material', true );
		$resistance = (int) get_post_meta( $post_id, '_chronos_water_resistance', true );
		$condition  = get_post_meta( $post_id, '_chronos_condition', true );

		$brand_name    = is_array( $brands ) && ! empty( $brands ) ? $brands[0] : 'Unknown';
		$movement_type = is_array( $movements ) && ! empty( $movements ) ? $movements[0] : 'Unknown';

		$specs = sprintf(
			"Watch: %s\nBrand: %s\nMovement: %s\nPrice: $%s\nReference: %s\nCase Diameter: %dmm\nCase Material: %s\nWater Resistance: %dm\nCondition: %s",
			$title,
			$brand_name,
			$movement_type,
			number_format( $price ),
			! empty( $reference ) ? $reference : 'N/A',
			$diameter,
			! empty( $material ) ? $material : 'N/A',
			$resistance,
			! empty( $condition ) ? $condition : 'New'
		);

		$schema = array(
			'type'       => 'object',
			'properties' => array(
				'description' => array(
					'type'        => 'string',
					'description' => 'A compelling 2-3 paragraph marketing description for the product page.',
				),
				'excerpt'     => array(
					'type'        => 'string',
					'description' => 'A one-sentence summary for product cards and listings.',
				),
				'highlights'  => array(
					'type'        => 'array',
					'items'       => array( 'type' => 'string' ),
					'description' => '3-5 key selling points as bullet points.',
				),
			),
			'required'   => array( 'description', 'excerpt', 'highlights' ),
		);

		$result = wp_ai_client_prompt(
			"Generate a luxury watch product description based on these specifications:\n\n{$specs}"
		)
			->using_system_instruction(
				'You are an expert luxury watch copywriter for Chronos, a premium timepiece retailer. '
				. 'Write sophisticated, aspirational marketing copy that appeals to watch enthusiasts and collectors. '
				. 'Emphasize craftsmanship, heritage, and exclusivity. Do not invent specifications not provided.'
			)
			->using_temperature( 0.7 )
			->as_json_response( $schema )
			->generate_text();

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$parsed = json_decode( $result, true );

		if ( ! is_array( $parsed ) || empty( $parsed['description'] ) ) {
			return new \WP_Error( 'parse_error', __( 'Failed to parse AI response.', 'chronos-bridge' ), array( 'status' => 500 ) );
		}

		return array(
			'description' => wp_kses_post( $parsed['description'] ),
			'excerpt'     => sanitize_text_field( $parsed['excerpt'] ?? '' ),
			'highlights'  => array_map( 'sanitize_text_field', $parsed['highlights'] ?? array() ),
		);
	}

	/**
	 * Register REST API routes.
	 */
	public static function register_rest_routes(): void {
		register_rest_route(
			'chronos/v1',
			'/ai/generate-description',
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( self::class, 'rest_generate' ),
					'permission_callback' => static function (): bool {
						return current_user_can( 'edit_posts' );
					},
					'args'                => array(
						'postId' => array(
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						),
					),
				),
			)
		);
	}

	/**
	 * REST callback: Generate description.
	 *
	 * @param \WP_REST_Request $request The request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function rest_generate( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$post_id = (int) $request->get_param( 'postId' );
		$result  = self::generate( $post_id );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new \WP_REST_Response(
			array(
				'success' => true,
				'data'    => $result,
			),
			200
		);
	}

	/**
	 * Register as a WordPress Ability.
	 */
	/**
	 * Register the "content" ability category.
	 */
	public static function register_ability_category(): void {
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}
		if ( ! wp_has_ability_category( 'content' ) ) {
			wp_register_ability_category(
				'content',
				array(
					'label'       => __( 'Content', 'chronos-bridge' ),
					'description' => __( 'Content generation and management abilities.', 'chronos-bridge' ),
				)
			);
		}
	}

	/**
	 * Register as a WordPress Ability.
	 */
	public static function register_ability(): void {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		wp_register_ability(
			'chronos/generate-watch-description',
			array(
				'label'               => __( 'Generate Watch Description', 'chronos-bridge' ),
				'description'         => __( 'Generate a marketing description for a luxury watch based on its specifications.', 'chronos-bridge' ),
				'category'            => 'content',
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'postId' => array(
							'type'        => 'integer',
							'description' => __( 'The watch post ID.', 'chronos-bridge' ),
						),
					),
					'required'   => array( 'postId' ),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'description' => array( 'type' => 'string' ),
						'excerpt'     => array( 'type' => 'string' ),
						'highlights'  => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
					),
				),
				'execute_callback'    => array( self::class, 'generate' ),
				'permission_callback' => static function (): bool {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}
}
