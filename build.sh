#!/bin/sh

mkdir -p dist
cp -f src/index.html dist
cp -f src/styles.css dist
cp -fr assets dist

npx tsc -noemit
npx esbuild src/main.ts --bundle --format=esm --outdir=dist --splitting
