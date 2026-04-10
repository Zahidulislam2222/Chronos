#!/bin/bash
#
# Chronos cPanel Git Deployment Script
# Called by .cpanel.yml after git pull on the server.
#

DEPLOYPATH="$HOME/chronosbackend.healthcodeanalysis.com/wp-content/plugins"

/bin/cp -R wordpress/wp-content/plugins/chronos-bridge "$DEPLOYPATH/"
/bin/cp -R wordpress/wp-content/plugins/chronos-blocks "$DEPLOYPATH/"
/bin/cp -R wordpress/wp-content/plugins/wp-graphql-cors-master "$DEPLOYPATH/"
