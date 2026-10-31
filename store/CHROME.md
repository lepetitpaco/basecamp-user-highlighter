# Chrome Web Store

Dashboard : https://chrome.google.com/webstore/devconsole. Pas encore soumise.

Ne pas lister de domaines ou de mots clés dans la fiche : Chrome a déjà rejeté Embed Link Copier pour ça.

## 1. Package

`packages/basecamp-user-highlighter-chrome.zip` (`scripts/package.sh`).

## 2. Fiche

**Catégorie** : Outils. **Langue** : anglais.

**Description** :
```
Who does what in Basecamp, at a glance.

Basecamp User Highlighter lights up your teammates' cards and to-dos in each person's color, so you can spot someone's work without reading every avatar.

★ ONE COLOR PER PERSON
• On card tables, to-do lists and My Tasks
• A shared task shows all its colors
• A ring on the avatar tells you who is who
• The tint goes under the text, which stays readable

★ ONE-CLICK ADD
• People you come across in Basecamp show up in the popup on their own, with a search
• Or right-click an avatar
• Each new person gets a free color

★ YOUR WAY
• Built-in color picker
• Adjustable intensity
• Dim everyone else's tasks to focus
• Border only, no color behind the text
• Pause anyone, or turn it all off

★ PRIVATE BY DESIGN
• No tracking, no analytics, no ads, no account
• Nothing changes on your Basecamp account, and your teammates see nothing
• Everything stays in your browser
• Open source

Basecamp User Highlighter is an independent project, not affiliated with or endorsed by Basecamp or 37signals.
```

| Champ | Fichier |
|---|---|
| Icône (128 x 128) | `store/chrome-store-icon-128.png` |
| Captures (1280 x 800, dans l'ordre) | `store/screenshots/1-*.png` à `5-*.png` |
| Petite image (440 x 280) | `store/promo-small-440x280.png` |
| Image en haut de page (1400 x 560) | `store/promo-marquee-1400x560.png` |

**Page d'accueil** : `https://lepetitpaco.github.io/basecamp-user-highlighter/`

**Assistance** : `https://github.com/lepetitpaco/basecamp-user-highlighter/issues`

## 3. Confidentialité

**Objectif unique** :
```
Highlight in Basecamp the cards and to-dos assigned to the chosen people, in each person's color.
```

**Justification de storage** :
```
Saves locally the highlighted people, those met in Basecamp for the quick add, and the settings. Nothing is sent anywhere.
```

**Justification de contextMenus** :
```
Adds to the right-click menu on avatars the entry that highlights this person or stops highlighting them.
```

**Justification de scripting** :
```
After an install or an update, loads the extension's own scripts into Basecamp tabs already open, so they don't need a reload. No remote code.
```

**Justification de l'accès à l'hôte** :
```
The extension only works on Basecamp: it finds who is assigned to each task and highlights those tasks. It runs on no other site.
```

**Code distant** : non.

**Consommation des données** : l'extension lit les noms et les avatars des pages Basecamp, sans rien transmettre. Cocher les trois certifications.

**Règles de confidentialité** : `https://lepetitpaco.github.io/basecamp-user-highlighter/privacy.html`

## 4. Distribution

Sans frais, public, toutes les régions.

## 5. Instructions de test

```
A Basecamp account is needed. In the "Making a Podcast" sample project, open the Card Table, open the extension popup and click someone under "Quick add": their cards get highlighted.
```

Compte de test si l'examen en demande un : **à créer et fournir par la personne**.
