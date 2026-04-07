import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
	Spinner,
	Placeholder,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

export default function Edit( { attributes, setAttributes } ) {
	const { columns, perPage, brand, movement, orderby, order, showPrice, showBrand } =
		attributes;
	const [ watches, setWatches ] = useState( [] );
	const [ brands, setBrands ] = useState( [] );
	const [ movements, setMovements ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const blockProps = useBlockProps( {
		className: 'chronos-watch-grid',
	} );

	useEffect( () => {
		Promise.all( [
			apiFetch( { path: '/wp/v2/chronos_brand?per_page=100' } ).catch(
				() => []
			),
			apiFetch( { path: '/wp/v2/chronos_movement?per_page=100' } ).catch(
				() => []
			),
		] ).then( ( [ brandData, movementData ] ) => {
			setBrands( Array.isArray( brandData ) ? brandData : [] );
			setMovements( Array.isArray( movementData ) ? movementData : [] );
		} );
	}, [] );

	useEffect( () => {
		setLoading( true );
		const params = new URLSearchParams( {
			per_page: String( perPage ),
			orderby,
			order,
		} );
		if ( brand ) {
			params.set( 'brand', brand );
		}
		if ( movement ) {
			params.set( 'movement', movement );
		}

		apiFetch( { path: `/chronos/v1/watches?${ params }` } )
			.then( ( response ) => {
				setWatches( response.data?.items || [] );
				setLoading( false );
			} )
			.catch( () => {
				setWatches( [] );
				setLoading( false );
			} );
	}, [ perPage, brand, movement, orderby, order ] );

	const brandOptions = [
		{ label: __( 'All Brands', 'chronos-blocks' ), value: '' },
		...brands.map( ( b ) => ( { label: b.name, value: b.slug } ) ),
	];

	const movementOptions = [
		{ label: __( 'All Movements', 'chronos-blocks' ), value: '' },
		...movements.map( ( m ) => ( { label: m.name, value: m.slug } ) ),
	];

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Grid Settings', 'chronos-blocks' ) }
				>
					<RangeControl
						label={ __( 'Columns', 'chronos-blocks' ) }
						value={ columns }
						onChange={ ( val ) =>
							setAttributes( { columns: val } )
						}
						min={ 1 }
						max={ 6 }
					/>
					<RangeControl
						label={ __( 'Number of Watches', 'chronos-blocks' ) }
						value={ perPage }
						onChange={ ( val ) =>
							setAttributes( { perPage: val } )
						}
						min={ 1 }
						max={ 24 }
					/>
					<ToggleControl
						label={ __( 'Show Price', 'chronos-blocks' ) }
						checked={ showPrice }
						onChange={ ( val ) =>
							setAttributes( { showPrice: val } )
						}
					/>
					<ToggleControl
						label={ __( 'Show Brand', 'chronos-blocks' ) }
						checked={ showBrand }
						onChange={ ( val ) =>
							setAttributes( { showBrand: val } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Filtering & Sorting', 'chronos-blocks' ) }
				>
					<SelectControl
						label={ __( 'Brand', 'chronos-blocks' ) }
						value={ brand }
						options={ brandOptions }
						onChange={ ( val ) =>
							setAttributes( { brand: val } )
						}
					/>
					<SelectControl
						label={ __( 'Movement', 'chronos-blocks' ) }
						value={ movement }
						options={ movementOptions }
						onChange={ ( val ) =>
							setAttributes( { movement: val } )
						}
					/>
					<SelectControl
						label={ __( 'Order By', 'chronos-blocks' ) }
						value={ orderby }
						options={ [
							{
								label: __( 'Date', 'chronos-blocks' ),
								value: 'date',
							},
							{
								label: __( 'Title', 'chronos-blocks' ),
								value: 'title',
							},
							{
								label: __( 'Price', 'chronos-blocks' ),
								value: 'price',
							},
						] }
						onChange={ ( val ) =>
							setAttributes( { orderby: val } )
						}
					/>
					<SelectControl
						label={ __( 'Order', 'chronos-blocks' ) }
						value={ order }
						options={ [
							{
								label: __(
									'Descending',
									'chronos-blocks'
								),
								value: 'DESC',
							},
							{
								label: __(
									'Ascending',
									'chronos-blocks'
								),
								value: 'ASC',
							},
						] }
						onChange={ ( val ) =>
							setAttributes( { order: val } )
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				{ loading && <Spinner /> }

				{ ! loading && watches.length === 0 && (
					<Placeholder
						icon="grid-view"
						label={ __(
							'Watch Collection Grid',
							'chronos-blocks'
						) }
						instructions={ __(
							'No watches found. Add watches via the Chronos Watch post type.',
							'chronos-blocks'
						) }
					/>
				) }

				{ ! loading && watches.length > 0 && (
					<div
						className="chronos-watch-grid__items"
						style={ {
							gridTemplateColumns: `repeat(${ columns }, 1fr)`,
						} }
					>
						{ watches.map( ( watch ) => (
							<div
								key={ watch.id }
								className="chronos-watch-grid__item"
							>
								<div className="chronos-watch-grid__image">
									{ watch.image ? (
										<img
											src={ watch.image }
											alt={ watch.title }
										/>
									) : (
										<div className="chronos-watch-grid__placeholder">
											<span className="dashicons dashicons-format-image" />
										</div>
									) }
								</div>
								<div className="chronos-watch-grid__info">
									{ showBrand &&
										watch.brands?.length > 0 && (
											<span className="chronos-watch-grid__brand">
												{ watch.brands[ 0 ] }
											</span>
										) }
									<h4 className="chronos-watch-grid__title">
										{ watch.title }
									</h4>
									{ showPrice && watch.price > 0 && (
										<span className="chronos-watch-grid__price">
											$
											{ watch.price.toLocaleString() }
										</span>
									) }
								</div>
							</div>
						) ) }
					</div>
				) }
			</div>
		</>
	);
}
