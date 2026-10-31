#!/bin/bash
# Rend les icônes et les visuels des stores à partir de store/captures (Chromium dans Docker).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
docker run --rm -v "$ROOT":/ext -w /tmp mcr.microsoft.com/playwright:v1.50.0-noble sh -c '
  npm i -s playwright@1.50.0 >/dev/null 2>&1 || exit 1
  cp /ext/store/render.mjs /tmp/render.mjs
  sed -i "s#^const STORE = .*#const STORE = \"/ext/store\";#" /tmp/render.mjs
  node /tmp/render.mjs
'
