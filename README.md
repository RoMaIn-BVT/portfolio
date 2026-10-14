# Portfolio — Romain Bonvalet

- `index.html` : le portfolio (BTS SIO SISR, Bac+3 DevOps ENI Rennes, alternance Thales).
- `stats/` : le site de statistiques du portfolio, relié à lui. Il est actualisé chaque heure.
  Adresse : `https://votre-site.netlify.app/stats/` (ou `…/#stats`). Il n'est pas référencé par les moteurs de recherche.

## Ce qui est mesuré

Visiteurs (aujourd'hui, 7 j, 30 j, 90 j, total, avec l'évolution par rapport à la période précédente),
courbe jour par jour, heures et jours de visite, temps passé, parcours de lecture (part des visiteurs ayant vu
chaque section), clics (CV, PDF, stages, Thales, carte, filtres, email, liens externes, formulaire),
provenance, pays, appareils, navigateurs et systèmes.

La mesure passe par GoatCounter : aucun cookie et aucune donnée personnelle, donc pas de bandeau de consentement.
Ouvrir le site de stats sur un navigateur exclut ce navigateur des comptages, pour ne pas compter ses propres visites
(un lien en bas de page permet de revenir dessus).

## Mise en route (une seule fois)

1. Créer un compte gratuit sur <https://www.goatcounter.com> et choisir un code (ex. `romainbvt`).
   Dans *Settings*, mettre le fuseau horaire sur `Europe/Paris`.
2. Dans `index.html`, remplacer `VOTRE-CODE` par ce code (`const GOATCOUNTER_CODE = ...`, en bas du fichier).
3. Dans GoatCounter : *Settings → API* → créer une clé avec le droit « Read statistics ».
4. Dans GitHub, onglet *Settings* du dépôt :
   - *Secrets and variables → Actions → Secrets* : ajouter `GOATCOUNTER_TOKEN` (la clé API) ;
   - *Secrets and variables → Actions → Variables* : ajouter `GOATCOUNTER_SITE` (le code) ;
5. Sur Netlify : *Add new site → Import an existing project → GitHub* → ce dépôt, branche `main`,
   sans commande de build, dossier de publication `/` (racine). Le dépôt doit rester **public**,
   car le site de stats lit les chiffres sur GitHub.
6. Onglet *Actions* → « Statistiques du portfolio » → *Run workflow* pour une première mise à jour.

Ensuite, `.github/workflows/stats.yml` tourne chaque heure (à hh:07). Il lance `scripts/fetch_stats.py`
et publie `stats.json` sur la branche **`stats-data`** (uniquement si les chiffres ont changé).
Le site `stats/` lit ce fichier directement sur GitHub, si bien que `main` et Netlify ne sont **pas redéployés**
toutes les heures : pas de consommation inutile de déploiements Netlify. Le `stats.json` de `main`
ne sert que de secours (vide).

Hébergement ailleurs (GitHub Pages, autre) : rien ne change, le même fonctionnement s'applique.

Pensez aussi à déposer à la racine du dépôt les PDF et dossiers vers lesquels le portfolio pointe
(CV, rapports de stage, E5…).
