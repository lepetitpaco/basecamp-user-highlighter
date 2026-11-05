# CLAUDE.md — Basecamp User Highlighter

Extension Chrome/Firefox qui colore les cartes et to-dos de Basecamp selon la personne assignée. Fonctionnement, structure et commandes : voir `README.md`. Livraison : `RELEASE.md`.

## Règles

- **Tout en anglais** depuis la 1.1.2 (interface, code, site, fiches des stores), choix de Paco après un passage en français.
- Surlignage **seulement dans les listes** (cartes, to-dos, My Tasks), jamais sur la page d'une tâche. La teinte passe sous le contenu pour garder le contraste.
- Identité visuelle propre (icône surligneur, `store/icon.svg`) : ne pas copier celle des autres extensions de Paco.
- Commits : jamais de ligne `Co-Authored-By` ni de mention d'un assistant IA dans les commits, PR ou tags.

## DOM de Basecamp

- Basecamp 5 sert `app.basecamp.com` ; les anciens comptes sont sur `3.basecamp.com`. L'extension tourne sur les deux.
- Assignés : avatars dans `.kanban-card__assignee` et `.task-details__assignee`. `data-avatar-for-person-id` existe aussi sur « Added by » et sur les abonnés : ne jamais s'y fier seul.
- Sur My Tasks, une to-do est un seul `li.assignment.todo`, sans imbrication.
- Turbo remplace le contenu et des frames chargent les assignés plus tard : un seul `MutationObserver`, traitement une fois par frame.

## Tester

- Sur un compte Basecamp de test, jamais sur un vrai compte. Ne rien écrire dans Basecamp sans accord.
- Builds non empaquetés, depuis un onglet Basecamp : `basecamp-user-highlighter:dev-reload` recharge l'extension, `basecamp-user-highlighter:dev-storage` règle son storage à partir de `<html data-bh-dev-storage>` (voir `background.js`).
- Un agent qui pilote Chrome ne peut ouvrir ni `chrome://` ni `chrome-extension://`. Le popup se ferme au moindre clic ailleurs : l'ouvrir et le photographier avec un outil de pilotage du bureau.
- La connexion à Basecamp ne se scripte pas : les captures de `store/captures` sont prises à la main, sur le projet d'exemple de Basecamp.

## État

- 1.1.2 : release GitHub `v1.1.2` avec les zips, publique sur Firefox Add-ons (slug `basecamp-user-highlighter`, fiche en anglais et en français).
- Chrome Web Store : pas encore soumise, Paco s'en charge.
- L'identifiant Firefox reste `basecamp-highlight@addon.local`, celui de la 1.0. Ne pas le changer : les utilisateurs perdraient les mises à jour.
