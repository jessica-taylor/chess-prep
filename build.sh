#!/usr/bin/env bash
npx tsc
./node_modules/.bin/browserify src/index.js -o bundle.js
