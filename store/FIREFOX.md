# Firefox Add-ons (AMO)

Page développeur : https://addons.mozilla.org/developers/addon/basecamp-user-highlighter/edit
Page publique (une fois approuvée) : https://addons.mozilla.org/firefox/addon/basecamp-user-highlighter/

**État** : passé en listé le 2026-10-31 avec la 1.1.1, puis 1.1.2 en anglais. La 1.1.0 reste une version « On your own », AMO ne réutilisant pas un numéro.

## Package

`packages/basecamp-user-highlighter-firefox.zip` (`scripts/package.sh`). Firefox bureau 140+, Firefox pour Android non coché : non testé. Lint : 0 erreur, 1 avertissement sur Firefox pour Android, ignoré.

L'identifiant reste `basecamp-highlight@addon.local`, celui de la 1.0.

## Fiche

**Nom** : `Basecamp User Highlighter`

**Résumé** :
```
Who does what in Basecamp, at a glance: cards and to-dos light up in each person's color. One-click add, no tracking.
```

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

**Catégorie** : « My add-on doesn't fit » (aucune ne convient). **Licence** : MIT. **Page d'accueil** : `https://lepetitpaco.github.io/basecamp-user-highlighter/`

**Confidentialité** : `https://lepetitpaco.github.io/basecamp-user-highlighter/privacy.html`

**Captures** : `store/screenshots/`, dans l'ordre.

**Notes pour les relecteurs** :
```
Needs a Basecamp account. In the "Making a Podcast" sample project, open the Card Table, open the popup and click someone under "Quick add": their cards get highlighted.
```
