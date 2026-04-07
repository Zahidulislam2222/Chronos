<?php
/**
 * Plugin Name: Chronos Custom Bridge
 * Description: A lightweight bridge to receive Contact Form submissions via GraphQL without crashing.
 * Version: 1.0
 * Author: Zahidul Islam
 * Author URI: https://github.com/Zahidulislam2222
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'graphql_register_types', function() {

    // Register the mutation 'submitChronosContact'
    register_graphql_mutation( 'submitChronosContact', [
        'inputFields' => [
            'name'    => [ 'type' => 'String' ],
            'email'   => [ 'type' => 'String' ],
            'subject' => [ 'type' => 'String' ],
            'message' => [ 'type' => 'String' ],
        ],
        'outputFields' => [
            'success' => [ 'type' => 'Boolean' ],
            'message' => [ 'type' => 'String' ],
        ],
        'mutateAndGetPayload' => function( $input ) {
            
            // 1. Get Data
            $name    = sanitize_text_field( $input['name'] );
            $email   = sanitize_email( $input['email'] );
            $subject = sanitize_text_field( $input['subject'] );
            $message = sanitize_textarea_field( $input['message'] );

            // 2. Prepare Email
            // This sends to the "Administration Email Address" set in Settings > General
            $to      = get_option( 'admin_email' ); 
            $headers = [ 'Content-Type: text/html; charset=UTF-8', 'Reply-To: ' . $name . ' <' . $email . '>' ];
            
            $email_subject = 'New Message from Chronos: ' . $subject;
            $email_body    = "<h3>New Contact Submission</h3>";
            $email_body   .= "<p><strong>Name:</strong> $name</p>";
            $email_body   .= "<p><strong>Email:</strong> $email</p>";
            $email_body   .= "<p><strong>Subject:</strong> $subject</p>";
            $email_body   .= "<p><strong>Message:</strong><br/>$message</p>";

            // 3. Send Email
            $sent = wp_mail( $to, $email_subject, $email_body, $headers );

            if ( $sent ) {
                return [ 
                    'success' => true,
                    'message' => 'Email sent successfully.'
                ];
            } else {
                return [ 
                    'success' => false,
                    'message' => 'Failed to send email. Check SMTP settings.'
                ];
            }
        }
    ] );
} );