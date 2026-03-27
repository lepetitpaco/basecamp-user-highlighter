## Basecamp User Highlighter

Extension WebExtension MV3 pour surligner les cartes/todos Basecamp selon des IDs personnes configurés.

## Config navigateurs

- `manifest.json` : version Firefox (inclut `browser_specific_settings` Gecko).
- `manifest.chrome.json` : version Chrome/Chromium.

## Installation Firefox (temporaire dev)

- Ouvrir `about:debugging#/runtime/this-firefox`
- Cliquer `Charger un module complémentaire temporaire`
- Sélectionner `manifest.json`
- Sur `basecamp.com`, autoriser l'extension en `Toujours autoriser sur ce site`

## Installation Chrome/Edge/Brave (dev)

- Créer une copie de `manifest.chrome.json` nommée `manifest.json` dans un dossier de build
- Ouvrir `chrome://extensions` (ou `edge://extensions`)
- Activer `Mode développeur`
- Cliquer `Charger l'extension non empaquetée`
- Choisir le dossier contenant le `manifest.json` Chrome
- Sur `basecamp.com`, vérifier que l'accès au site est `On all sites` / `Toujours autorisé`

