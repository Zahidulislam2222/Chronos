/**
 * Tests for the Watch Collection Grid block.
 */
import {
	registerBlockType,
	getBlockType,
	unregisterBlockType,
	setCategories,
} from '@wordpress/blocks';
import metadata from '../src/watch-collection-grid/block.json';

describe( 'Watch Collection Grid Block', () => {
	beforeAll( () => {
		setCategories( [
			{ slug: 'chronos', title: 'Chronos', icon: 'clock' },
		] );
		registerBlockType( metadata.name, {
			...metadata,
			edit: () => null,
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( metadata.name );
	} );

	it( 'should be registered', () => {
		const block = getBlockType( metadata.name );
		expect( block ).toBeDefined();
		expect( block.name ).toBe( 'chronos/watch-collection-grid' );
	} );

	it( 'should have correct title', () => {
		const block = getBlockType( metadata.name );
		expect( block.title ).toBe( 'Watch Collection Grid' );
	} );

	it( 'should be in chronos category', () => {
		const block = getBlockType( metadata.name );
		expect( block.category ).toBe( 'chronos' );
	} );

	it( 'should have grid default attributes', () => {
		const block = getBlockType( metadata.name );
		expect( block.attributes.columns.default ).toBe( 3 );
		expect( block.attributes.perPage.default ).toBe( 6 );
		expect( block.attributes.orderby.default ).toBe( 'date' );
		expect( block.attributes.order.default ).toBe( 'DESC' );
		expect( block.attributes.showPrice.default ).toBe( true );
		expect( block.attributes.showBrand.default ).toBe( true );
	} );

	it( 'should have filter attributes', () => {
		const block = getBlockType( metadata.name );
		expect( block.attributes.brand ).toBeDefined();
		expect( block.attributes.brand.default ).toBe( '' );
		expect( block.attributes.movement ).toBeDefined();
		expect( block.attributes.movement.default ).toBe( '' );
	} );

	it( 'should support wide and full alignment', () => {
		const block = getBlockType( metadata.name );
		expect( block.supports.align ).toContain( 'wide' );
		expect( block.supports.align ).toContain( 'full' );
	} );
} );
