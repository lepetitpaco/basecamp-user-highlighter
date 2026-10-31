#!/bin/bash
# Active le manifest d'un navigateur pour le chargement non empaqueté : scripts/use.sh chrome|firefox
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
cp "manifest-${1:?chrome ou firefox}.json" manifest.json
echo "manifest.json -> $1"
