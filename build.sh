#!/bin/sh

mkdir -p dist
cp -f src/index.html dist
npx esbuild src/main.ts --bundle --format=esm --outdir=dist --splitting
