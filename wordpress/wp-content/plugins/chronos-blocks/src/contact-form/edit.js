import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';

export default function Edit( { attributes, setAttributes } ) {
	const { heading, description, submitText, successMessage, showSubject } =
		attributes;
	const blockProps = useBlockProps( {
		className: 'chronos-contact-form',
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Form Settings', 'chronos-blocks' ) }
				>
					<TextControl
						label={ __( 'Heading', 'chronos-blocks' ) }
						value={ heading }
						onChange={ ( val ) =>
							setAttributes( { heading: val } )
						}
					/>
					<TextareaControl
						label={ __( 'Description', 'chronos-blocks' ) }
						value={ description }
						onChange={ ( val ) =>
							setAttributes( { description: val } )
						}
					/>
					<ToggleControl
						label={ __(
							'Show Subject Field',
							'chronos-blocks'
						) }
						checked={ showSubject }
						onChange={ ( val ) =>
							setAttributes( { showSubject: val } )
						}
					/>
					<TextControl
						label={ __(
							'Submit Button Text',
							'chronos-blocks'
						) }
						value={ submitText }
						onChange={ ( val ) =>
							setAttributes( { submitText: val } )
						}
					/>
					<TextareaControl
						label={ __(
							'Success Message',
							'chronos-blocks'
						) }
						value={ successMessage }
						onChange={ ( val ) =>
							setAttributes( { successMessage: val } )
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				{ heading && (
					<h2 className="chronos-contact-form__heading">
						{ heading }
					</h2>
				) }
				{ description && (
					<p className="chronos-contact-form__description">
						{ description }
					</p>
				) }
				<div className="chronos-contact-form__fields">
					<div className="chronos-contact-form__row">
						<div className="chronos-contact-form__field">
							<label>
								{ __( 'Name', 'chronos-blocks' ) }
							</label>
							<input type="text" disabled />
						</div>
						<div className="chronos-contact-form__field">
							<label>
								{ __( 'Email', 'chronos-blocks' ) }
							</label>
							<input type="email" disabled />
						</div>
					</div>
					{ showSubject && (
						<div className="chronos-contact-form__field">
							<label>
								{ __( 'Subject', 'chronos-blocks' ) }
							</label>
							<input type="text" disabled />
						</div>
					) }
					<div className="chronos-contact-form__field">
						<label>
							{ __( 'Message', 'chronos-blocks' ) }
						</label>
						<textarea rows="5" disabled />
					</div>
					<button
						type="button"
						className="chronos-contact-form__submit"
						disabled
					>
						{ submitText }
					</button>
				</div>
			</div>
		</>
	);
}
