#!/bin/sh

set -eu

# Change to the directory the script is in
cd "$(dirname "$(readlink -f "$0")")"

npm install
npm run build
