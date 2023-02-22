#!/usr/bin/env bash
npx tsc
mkdir -p static/js
cp node_modules/chessboardjs/www/css/chessboard.css static/chessboard.css
./node_modules/.bin/browserify src/index.js -o static/js/index.js
