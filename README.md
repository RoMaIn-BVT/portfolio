# Portfolio — Romain Bonvalet

Portfolio de Romain Bonvalet : 3e année **Administrateur Système DevOps** à l'ENI Rennes, alternance chez **Thales Rennes** à partir d'octobre 2026 (BTS SIO SISR).

Le site tient dans un seul fichier, `index.html`. Three.js 0.160 est chargé depuis jsDelivr pour les scènes 3D ; sans WebGL ou si le CDN est injoignable, le site reste complet (topologie et carte en version 2D).

## Effets 3D

- **Accueil** : réseau d'infrastructure en WebGL (nœuds, serveurs, paquets de données) derrière le terminal, avec parallaxe à la souris. Le relief du nom s'oriente selon le curseur.
- **Projet E4 (CHE)** : maquette 3D interactive de l'infrastructure. Internet, FortiGate, cœur de réseau, 6 VLANs et salle serveurs (AD/DNS/DHCP, GLPI, Zabbix, impression, Veeam). Déploiement animé, survol des équipements, simulation d'attaques bloquées par le pare-feu avec journal en direct.
- **Carte de Rennes** : ville 3D stylisée avec la Vilaine, la rocade, les axes et des repères lumineux (domicile, ENI, Thales). Vol de caméra vers chaque lieu et distances calculées.
- **Titres de section** : lettres qui pivotent en 3D à l'apparition, relief éclairé par la souris.
- **Compétences** : sphère 3D de 33 technologies ; un clic filtre les compétences.
- **Frise** : effet coverflow 3D au défilement.
- Terminal : nouvelle commande `attaque`.

Thème clair et sombre, responsive, `prefers-reduced-motion` respecté, rendu 3D en pause hors de l'écran.

## Fichiers attendus à côté de `index.html`

Le site renvoie vers ces documents, à placer dans le même dossier : `CV Romain BONVALET 22.09.2025.pdf`, `Romain BONVALET E5.pdf`, les rapports de stage PDF, et les dossiers `Cisco VLAN/`, `Gitlab/`, `GLPI/`, `Centreon/`, `Masterisation Windows 10-11/`.

## Lancer en local

```bash
python3 -m http.server 8000   # puis http://localhost:8000
```
