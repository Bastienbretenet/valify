#!/bin/sh
set -e

# Sync node_modules si package.json changé
npm install

exec "$@"
