#!/bin/bash
# Génère packages/basecamp-user-highlighter-chrome.zip et packages/basecamp-user-highlighter-firefox.zip
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

mkdir -p packages
for browser in chrome firefox; do
  tmp="$(mktemp -d)"
  cp "manifest-$browser.json" "$tmp/manifest.json"
  cp -r src icons popup.html popup.js background.js "$tmp/"
  rm -f "packages/basecamp-user-highlighter-$browser.zip"
  (cd "$tmp" && zip -qr - .) > "packages/basecamp-user-highlighter-$browser.zip"
  rm -rf "$tmp"
  echo "packages/basecamp-user-highlighter-$browser.zip"
done
