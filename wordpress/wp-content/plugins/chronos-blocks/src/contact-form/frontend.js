/**
 * Frontend JavaScript for the Chronos Contact Form block.
 * Handles client-side validation and AJAX form submission.
 */
document.addEventListener( 'DOMContentLoaded', () => {
	const forms = document.querySelectorAll( '.chronos-contact-form__form' );

	forms.forEach( ( form ) => {
		form.addEventListener( 'submit', async ( event ) => {
			event.preventDefault();

			const statusEl = form.querySelector(
				'.chronos-contact-form__status'
			);
			const submitBtn = form.querySelector(
				'.chronos-contact-form__submit'
			);
			const successMessage =
				form.dataset.successMessage || 'Thank you for your message.';

			// Clear previous status.
			statusEl.hidden = true;
			statusEl.className = 'chronos-contact-form__status';
			statusEl.textContent = '';

			// Gather fields.
			const name = form.querySelector( '[name="name"]' );
			const email = form.querySelector( '[name="email"]' );
			const subject = form.querySelector( '[name="subject"]' );
			const message = form.querySelector( '[name="message"]' );

			// Client-side validation.
			const errors = [];

			if ( ! name?.value.trim() ) {
				errors.push( 'Name is required.' );
				name?.classList.add( 'has-error' );
			} else {
				name?.classList.remove( 'has-error' );
			}

			if ( ! email?.value.trim() || ! isValidEmail( email.value ) ) {
				errors.push( 'A valid email is required.' );
				email?.classList.add( 'has-error' );
			} else {
				email?.classList.remove( 'has-error' );
			}

			if ( ! message?.value.trim() ) {
				errors.push( 'Message is required.' );
				message?.classList.add( 'has-error' );
			} else {
				message?.classList.remove( 'has-error' );
			}

			if ( errors.length > 0 ) {
				showStatus( statusEl, errors.join( ' ' ), 'error' );
				return;
			}

			// Disable button during submission.
			submitBtn.disabled = true;
			submitBtn.textContent = 'Sending...';

			const body = {
				name: name.value.trim(),
				email: email.value.trim(),
				subject: subject?.value.trim() || '',
				message: message.value.trim(),
			};

			try {
				/* global chronosContactForm */
				const apiUrl =
					typeof chronosContactForm !== 'undefined'
						? chronosContactForm.apiUrl
						: '/wp-json/chronos/v1/contact';
				const nonce =
					typeof chronosContactForm !== 'undefined'
						? chronosContactForm.nonce
						: '';

				const headers = {
					'Content-Type': 'application/json',
				};
				if ( nonce ) {
					headers[ 'X-WP-Nonce' ] = nonce;
				}

				const response = await fetch( apiUrl, {
					method: 'POST',
					headers,
					body: JSON.stringify( body ),
				} );

				const data = await response.json();

				if ( response.ok && data.success ) {
					showStatus( statusEl, successMessage, 'success' );
					form.reset();
				} else {
					showStatus(
						statusEl,
						data.message ||
							'Something went wrong. Please try again.',
						'error'
					);
				}
			} catch {
				showStatus(
					statusEl,
					'Network error. Please check your connection and try again.',
					'error'
				);
			} finally {
				submitBtn.disabled = false;
				submitBtn.textContent =
					form
						.closest( '.chronos-contact-form' )
						?.querySelector( '.chronos-contact-form__submit' )
						?.dataset.originalText || 'Send Message';
			}
		} );
	} );

	function isValidEmail( email ) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( email );
	}

	function showStatus( el, message, type ) {
		el.textContent = message;
		el.className = `chronos-contact-form__status chronos-contact-form__status--${ type }`;
		el.hidden = false;
	}
} );
