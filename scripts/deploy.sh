#!/bin/bash
#
# RETIRED — CURRENTLY OFF. Kept for reference only. Worked in production on
# cPanel shared hosting until that hosting expired in May 2026; the project
# now runs on VPS hosting (see docs/DEPLOYMENT.md).
#
# Chronos cPanel Git Deployment Script
# Called by .cpanel.yml after git pull on the server.
#

DEPLOYPATH="$HOME/chronosbackend.healthcodeanalysis.com/wp-content/plugins"

/bin/cp -R wordpress/wp-content/plugins/chronos-bridge "$DEPLOYPATH/"
/bin/cp -R wordpress/wp-content/plugins/chronos-blocks "$DEPLOYPATH/"
/bin/cp -R wordpress/wp-content/plugins/wp-graphql-cors-master "$DEPLOYPATH/"
