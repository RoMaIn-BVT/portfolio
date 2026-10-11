# Portfolio — Romain Bonvalet

Portfolio de Romain Bonvalet, étudiant en **BTS SIO option SISR**, à la recherche d'un contrat d'apprentissage d'un an à partir de **septembre 2026**.

## Fonctionnalités

- **Accueil en 3D** (Three.js) : une infrastructure réseau où des paquets de données circulent de nœud en nœud, avec des serveurs, un cœur en icosaèdre et une parallaxe qui suit la souris.
- **Projet phare en 3D** : la stack Docker phpIPAM (phpipam, cron, mariadb, powerdns). Les conteneurs se déploient sur l'hôte, on peut faire pivoter la scène et survoler chaque conteneur.
- **Sphère 3D des compétences** : on clique sur une technologie pour voir où elle a été utilisée.
- **Rapports de stage** en dossiers 3D, lisibles dans une fenêtre intégrée, imprimables et téléchargeables.
- **Terminal interactif** (touche `` ` `` ou bouton `>_`) : `help`, `whoami`, `docker ps`, `ping`, `neofetch`…
- Cartes inclinables en 3D, frise chronologique animée, onglets accessibles au clavier, formulaire de contact qui ouvre la messagerie.
- Responsive (mobile → grand écran), prise en compte de `prefers-reduced-motion`, rendu de secours sans WebGL, animations 3D en pause hors de l'écran.

## Structure

```
index.html            page principale
css/style.css         styles
js/main.js            interface (navigation, sphère, terminal, modale, formulaire…)
js/content.js         contenu des rapports et du CV, documents imprimables
js/scene-network.js   scène 3D de l'accueil
js/scene-docker.js    scène 3D de la stack Docker
js/glow.js            matériau lumineux partagé et boucle de rendu
js/vendor/            Three.js 0.160 (MIT), embarqué, sans CDN
```

## Lancer en local

Les modules JavaScript doivent être servis en HTTP : ouvrir `index.html` directement depuis le disque ne fonctionne pas.

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Mise en ligne avec GitHub Pages

Dans *Settings → Pages*, choisir la branche `main` et le dossier `/ (root)`.
