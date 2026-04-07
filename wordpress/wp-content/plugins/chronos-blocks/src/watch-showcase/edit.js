import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	TextControl,
	Spinner,
	Placeholder,
	ButtonGroup,
	Button,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

export default function Edit( { attributes, setAttributes } ) {
	const { watchId, showPrice, showExcerpt, ctaText, ctaUrl, layout } =
		attributes;
	const [ watches, setWatches ] = useState( [] );
	const [ selectedWatch, setSelectedWatch ] = useState( null );
	const [ loading, setLoading ] = useState( true );
	const blockProps = useBlockProps( {
		className: `chronos-watch-showcase layout-${ layout }`,
	} );

	useEffect( () => {
		apiFetch( { path: '/chronos/v1/watches?per_page=100' } )
			.then( ( response ) => {
				setWatches( response.data?.items || [] );
				setLoading( false );
			} )
			.catch( () => setLoading( false ) );
	}, [] );

	useEffect( () => {
		if ( watchId && watches.length > 0 ) {
			const found = watches.find( ( w ) => w.id === watchId );
			setSelectedWatch( found || null );
		} else {
			setSelectedWatch( null );
		}
	}, [ watchId, watches ] );

	const watchOptions = [
		{ label: __( '— Select a watch —', 'chronos-blocks' ), value: 0 },
		...watches.map( ( w ) => ( {
			label: w.title,
			value: w.id,
		} ) ),
	];

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Watch Settings', 'chronos-blocks' ) }
				>
					<SelectControl
						label={ __( 'Select Watch', 'chronos-blocks' ) }
						value={ watchId }
						options={ watchOptions }
						onChange={ ( val ) =>
							setAttributes( { watchId: Number( val ) } )
						}
					/>
					<ToggleControl
						label={ __( 'Show Price', 'chronos-blocks' ) }
						checked={ showPrice }
						onChange={ ( val ) =>
							setAttributes( { showPrice: val } )
						}
					/>
					<ToggleControl
						label={ __( 'Show Excerpt', 'chronos-blocks' ) }
						checked={ showExcerpt }
						onChange={ ( val ) =>
							setAttributes( { showExcerpt: val } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Layout & CTA', 'chronos-blocks' ) }
				>
					<ButtonGroup>
						<Button
							variant={
								layout === 'horizontal'
									? 'primary'
									: 'secondary'
							}
							onClick={ () =>
								setAttributes( { layout: 'horizontal' } )
							}
						>
							{ __( 'Horizontal', 'chronos-blocks' ) }
						</Button>
						<Button
							variant={
								layout === 'vertical'
									? 'primary'
									: 'secondary'
							}
							onClick={ () =>
								setAttributes( { layout: 'vertical' } )
							}
						>
							{ __( 'Vertical', 'chronos-blocks' ) }
						</Button>
					</ButtonGroup>
					<TextControl
						label={ __( 'Button Text', 'chronos-blocks' ) }
						value={ ctaText }
						onChange={ ( val ) =>
							setAttributes( { ctaText: val } )
						}
					/>
					<TextControl
						label={ __( 'Button URL', 'chronos-blocks' ) }
						value={ ctaUrl }
						onChange={ ( val ) =>
							setAttributes( { ctaUrl: val } )
						}
						help={ __(
							'Leave empty to link to the watch page.',
							'chronos-blocks'
						) }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				{ loading && <Spinner /> }

				{ ! loading && ! watchId && (
					<Placeholder
						icon="clock"
						label={ __(
							'Watch Showcase',
							'chronos-blocks'
						) }
						instructions={ __(
							'Select a watch from the sidebar settings to display.',
							'chronos-blocks'
						) }
					/>
				) }

				{ ! loading && watchId > 0 && ! selectedWatch && (
					<Placeholder
						icon="warning"
						label={ __(
							'Watch Not Found',
							'chronos-blocks'
						) }
						instructions={ __(
							'The selected watch could not be found. It may have been deleted.',
							'chronos-blocks'
						) }
					/>
				) }

				{ selectedWatch && (
					<div className="chronos-watch-showcase__inner">
						<div className="chronos-watch-showcase__image">
							{ selectedWatch.image ? (
								<img
									src={ selectedWatch.image }
									alt={ selectedWatch.title }
								/>
							) : (
								<div className="chronos-watch-showcase__placeholder-image">
									<span className="dashicons dashicons-format-image" />
								</div>
							) }
						</div>
						<div className="chronos-watch-showcase__content">
							<h3 className="chronos-watch-showcase__title">
								{ selectedWatch.title }
							</h3>
							{ selectedWatch.brands?.length > 0 && (
								<p className="chronos-watch-showcase__brand">
									{ selectedWatch.brands.join( ', ' ) }
								</p>
							) }
							{ showPrice && selectedWatch.price > 0 && (
								<p className="chronos-watch-showcase__price">
									${ selectedWatch.price.toLocaleString() }
								</p>
							) }
							{ showExcerpt && selectedWatch.excerpt && (
								<p className="chronos-watch-showcase__excerpt">
									{ selectedWatch.excerpt }
								</p>
							) }
							<span className="chronos-watch-showcase__cta">
								{ ctaText }
							</span>
						</div>
					</div>
				) }
			</div>
		</>
	);
}
