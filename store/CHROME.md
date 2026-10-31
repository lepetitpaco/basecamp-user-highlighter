# Chrome Web Store

Dashboard : https://chrome.google.com/webstore/devconsole. Pas encore soumise.

Ne pas lister de domaines ou de mots clés dans la fiche : Chrome a déjà rejeté Embed Link Copier pour ça.

## 1. Package

`packages/basecamp-user-highlighter-chrome.zip` (`scripts/package.sh`).

## 2. Fiche

**Catégorie** : Outils. **Langue** : français.

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
Surligner dans Basecamp les cartes et les to-dos assignés aux personnes choisies, dans la couleur de chacune.
```

**Justification de storage** :
```
Enregistre localement les personnes surlignées, celles croisées dans Basecamp pour l'ajout rapide, et les réglages. Rien n'est envoyé ailleurs.
```

**Justification de contextMenus** :
```
Ajoute au clic droit sur un avatar l'entrée qui surligne cette personne ou arrête de la surligner.
```

**Justification de scripting** :
```
Après une installation ou une mise à jour, charge les scripts de l'extension dans les onglets Basecamp déjà ouverts, pour éviter de devoir les recharger. Aucun code distant.
```

**Justification de l'accès à l'hôte** :
```
L'extension ne fonctionne que sur Basecamp : elle y repère les personnes assignées aux tâches et surligne ces tâches. Elle ne tourne sur aucun autre site.
```

**Code distant** : non.

**Consommation des données** : l'extension lit les noms et les avatars des pages Basecamp, sans rien transmettre. Cocher les trois certifications.

**Règles de confidentialité** : `https://lepetitpaco.github.io/basecamp-user-highlighter/privacy.html`

## 4. Distribution

Sans frais, public, toutes les régions.

## 5. Instructions de test

Un compte Basecamp est nécessaire. Dans le projet d'exemple « Making a Podcast », ouvrir le Card Table, puis le popup de l'extension, et cliquer sur quelqu'un dans « Ajout rapide » : ses cartes se surlignent. Prévoir un compte de test si l'examen en demande un : **à créer et fournir par la personne**.
