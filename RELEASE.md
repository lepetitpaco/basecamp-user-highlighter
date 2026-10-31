# Livrer Basecamp User Highlighter

Recette suivie par `/test-app`, `/preprod`, `/version` et `/prod`. Lire aussi `README.md`.

## Flux

`/forge` → `/test-app` → commit → `/version` → `/prod` → **toi : Chrome Web Store**

## Test

Claude in Chrome sur un compte de test, extension chargée non empaquetée. Ne rien écrire dans Basecamp sans accord. Firefox : `npx web-ext lint` dans Docker.

## Preprod

Aucune.

## Version

1. Relire `README.md` et les textes des stores, en anglais : pas de listes de domaines ou de mots clés. Vraies captures seulement.
2. Numéro dans les trois manifests et `CHANGELOG.md`. `scripts/package.sh` ; zip dans `packages/`.

## Prod

Demander avant le premier envoi sur les stores.

**Réservé à la personne : Chrome Web Store**, Claude n'y a pas accès.
