#!/usr/bin/env bash
npx tsc
mkdir -p static/js
./node_modules/.bin/browserify src/index.js -o static/js/index.js
