# Firefox Add-ons (AMO)

Page développeur : https://addons.mozilla.org/developers/addon/basecamp-user-highlighter/edit
Page publique (une fois approuvée) : https://addons.mozilla.org/firefox/addon/basecamp-user-highlighter/

**État** : passé en listé le 2026-10-31 avec la 1.1.1, en attente d'examen. La 1.1.0 reste une version « On your own », AMO ne réutilisant pas un numéro.

## Package

`packages/basecamp-user-highlighter-firefox.zip` (`scripts/package.sh`). Firefox bureau 140+, Firefox pour Android non coché : non testé. Lint : 0 erreur, 1 avertissement sur Firefox pour Android, ignoré.

L'identifiant reste `basecamp-highlight@addon.local`, celui de la 1.0.

## Fiche

**Nom** : `Basecamp User Highlighter`

**Résumé** :
```
Qui fait quoi dans Basecamp, d'un coup d'œil : les cartes et les to-dos s'allument dans la couleur de chaque personne. Ajout en un clic, sans pistage.
```

**Description** :
```
Qui fait quoi dans Basecamp, d'un coup d'œil.

Basecamp User Highlighter allume les cartes et les to-dos de vos collègues dans la couleur de chacun, pour repérer le travail de quelqu'un sans lire chaque avatar.

★ UNE COULEUR PAR PERSONNE
• Sur les tableaux de cartes, les listes de to-dos et Mes tâches
• Une tâche partagée affiche toutes ses couleurs
• Un anneau sur l'avatar indique de qui il s'agit
• La teinte passe sous le texte, qui reste lisible

★ AJOUT EN UN CLIC
• Les gens croisés dans Basecamp apparaissent tout seuls dans le popup, avec une recherche
• Ou clic droit sur un avatar
• Chaque nouvelle personne reçoit une couleur libre

★ À VOTRE GOÛT
• Sélecteur de couleur intégré
• Intensité réglable
• Griser les tâches des autres pour vous concentrer
• Bordure seule, sans couleur sur le texte
• Une pause par personne, et un interrupteur général

★ RESPECT DE LA VIE PRIVÉE
• Aucun pistage, aucune statistique, aucune pub, aucun compte
• Rien n'est modifié sur votre compte Basecamp, et vos collègues ne voient rien
• Tout reste dans votre navigateur
• Open source

Basecamp User Highlighter est un projet indépendant, sans lien avec Basecamp ni 37signals, et non approuvé par eux.
```

**Catégorie** : « My add-on doesn't fit » (aucune ne convient). **Licence** : MIT. **Page d'accueil** : `https://lepetitpaco.github.io/basecamp-user-highlighter/`

**Confidentialité** : `https://lepetitpaco.github.io/basecamp-user-highlighter/privacy.html`

**Captures** : `store/screenshots/`, dans l'ordre.

**Notes pour les relecteurs** :
```
Needs a Basecamp account. In the "Making a Podcast" sample project, open the Card Table, open the popup and click someone under "Ajout rapide": their cards get highlighted.
```
