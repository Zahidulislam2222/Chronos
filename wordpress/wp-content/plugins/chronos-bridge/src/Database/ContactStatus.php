<?php
/**
 * Contact submission status enum.
 *
 * @package ChronosBridge\Database
 */

declare(strict_types=1);

namespace ChronosBridge\Database;

/**
 * Backed enum representing contact submission statuses.
 */
enum ContactStatus: string {
	case New     = 'new';
	case Read    = 'read';
	case Replied = 'replied';
}
