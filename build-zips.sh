#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$ROOT_DIR/zips"
TMP_DIR="$ROOT_DIR/.tmp-build-zips"
SCRIPT_NAME="$(basename "$0")"

if ! command -v zip >/dev/null 2>&1; then
  echo "Erreur: la commande 'zip' est introuvable."
  echo "Installe zip puis relance le script."
  exit 1
fi

mkdir -p "$OUT_DIR"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

copy_project_files() {
  local destination="$1"
  mkdir -p "$destination"

  shopt -s dotglob nullglob
  for path in "$ROOT_DIR"/*; do
    local name
    name="$(basename "$path")"

    case "$name" in
      .git|.tmp-build-zips|zips|manifest.json|manifest.chrome.json|manifest.firefox.json|"$SCRIPT_NAME")
        continue
        ;;
    esac

    cp -R "$path" "$destination/"
  done
  shopt -u dotglob nullglob
}

build_zip() {
  local browser="$1"
  local source_manifest="$2"
  local build_dir="$TMP_DIR/$browser"
  local zip_file="$OUT_DIR/basecamp-user-highlighter-$browser.zip"

  if [[ ! -f "$source_manifest" ]]; then
    echo "Erreur: manifest introuvable: $source_manifest"
    exit 1
  fi

  rm -rf "$build_dir"
  mkdir -p "$build_dir"

  copy_project_files "$build_dir"
  cp "$source_manifest" "$build_dir/manifest.json"

  rm -f "$zip_file"
  (
    cd "$build_dir"
    zip -r "$zip_file" . >/dev/null
  )

  echo "OK: $zip_file"
}

build_zip "chrome" "$ROOT_DIR/manifest.chrome.json"
build_zip "firefox" "$ROOT_DIR/manifest.firefox.json"

rm -rf "$TMP_DIR"
echo "Terminé. Les archives sont dans: $OUT_DIR"
