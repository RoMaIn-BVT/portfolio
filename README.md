# Portfolio — Romain Bonvalet

Site statique : `index.html`. Les statistiques de visite sont mises à jour toutes les heures dans `stats.json`.

## Voir les statistiques

Ouvrir le site avec `#stats` à la fin de l'adresse (ex. `https://romain-bvt.github.io/portfolio/#stats`).
Le panneau est invisible pour les visiteurs. Ouvrir `#stats` une fois sur un navigateur l'exclut des comptages,
pour ne pas compter ses propres visites.

Ce qui est mesuré : visiteurs (jour, 7 j, 30 j, total), visites par jour, temps passé, sections consultées,
clics (CV, rapports, email, formulaire), provenance, pays, appareils, navigateurs et systèmes.

## Mise en route (une seule fois)

1. Créer un compte gratuit sur <https://www.goatcounter.com> et choisir un code (ex. `romainbvt`).
   GoatCounter ne pose aucun cookie et ne garde aucune donnée personnelle : pas besoin de bandeau de consentement.
2. Dans `index.html`, remplacer `VOTRE-CODE` par ce code (`const GOATCOUNTER_CODE = ...`).
3. Dans GoatCounter : *Settings → API* → créer une clé avec le droit « Read statistics ».
4. Dans GitHub, onglet *Settings* du dépôt :
   - *Secrets and variables → Actions → Secrets* : ajouter `GOATCOUNTER_TOKEN` (la clé API) ;
   - *Secrets and variables → Actions → Variables* : ajouter `GOATCOUNTER_SITE` (le code) ;
   - *Pages* : source « Deploy from a branch », branche `main`, dossier `/ (root)`.
5. Onglet *Actions* → « Statistiques du portfolio » → *Run workflow* pour une première mise à jour.

Ensuite, le workflow `.github/workflows/stats.yml` tourne chaque heure (à hh:07) et ne committe `stats.json` que s'il a changé.
