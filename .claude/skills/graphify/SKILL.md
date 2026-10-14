---
name: graphify
description: Index structurel local du dépôt (sections HTML, règles CSS, fonctions JS/Python, titres, liens id/classe ↔ CSS ↔ JS) pour répondre et modifier le code en lisant le minimum de lignes. À utiliser AVANT toute lecture de fichier, pour toute question ou modification sur le code du portfolio, et après chaque modification pour rafraîchir l'index.
---

# graphify : lire peu, écrire juste

Script : `python3 .claude/skills/graphify/scripts/graphify.py <cmd>` (noté `G` ci-dessous).
Stdlib uniquement, réseau coupé dans le process, aucun contenu de fichier stocké
(seulement des noms de symboles, des numéros de ligne et des relations). L'index
`.graphify/` est ignoré par git.

## 1. Démarrage (une fois par session)

1. `G status` : si « aucun graphe » ou « PÉRIMÉ », lancer `G build`.
2. `G map` : la carte (~40 lignes) remplace la lecture des fichiers. Ne pas relire la carte ensuite.

## 2. Localiser avant de lire

| Besoin | Commande |
|---|---|
| Où est X ? | `G find X` (id, classe, fonction, titre, sélecteur) |
| Que touche X / qui touche X ? | `G show X` |
| Voir le code de X, borné | `G show X --code` (60 lignes max ; `--max N`) |
| Que casse un changement sur X ? | `G impact X` (règles CSS, HTML, JS liés) |

Règles de lecture :
- **Jamais** de `Read`/`cat` sur un fichier entier de plus de 150 lignes. Lire une plage
  avec `sed -n 'A,Bp' fichier` ou `Read` avec `offset`/`limit`, plages données par le graphe.
- Élargir de ±5 lignes seulement si le contexte manque, jamais « au cas où ».
- Ne pas relire une plage déjà lue dans la session, sauf si elle a été modifiée.
- Si le graphe ne trouve rien : un `Grep` ciblé (`output_mode: content`, `-n`), pas une lecture.

## 3. Modifier

- Avant de renommer ou supprimer un id, une classe ou une fonction : `G impact X`, puis
  modifier **toutes** les occurrences listées.
- Utiliser `Edit` par petits blocs, sans jamais réécrire un fichier entier.
- Après les modifications : `G build` (moins d'1 s) pour garder l'index à jour.

## 4. Produire sans remplissage

- Réponses ancrées : citer `fichier:ligne` et les vrais noms (ids, classes, fonctions) du
  dépôt, jamais d'exemple générique ni de « par exemple, vous pourriez… ».
- Ne pas recopier du code que l'utilisateur a déjà ; montrer seulement le diff ou la ligne concernée.
- Ne pas inventer de section, de classe ou de contenu absents du graphe. Si une info manque,
  le dire et la demander.
- Respecter l'existant : français, style CSS et conventions de nommage observées dans le graphe.
- Pas de résumé final qui répète ce qui vient d'être fait.

## 5. Confidentialité

- Les fichiers `.env*`, clés, `*secret*`, `*credential*` et `*password*` ne sont jamais
  indexés ni affichés (`show --code` refuse). Ne pas contourner avec `cat`.
- Ne jamais copier dans une réponse, un commit ou un outil externe les données personnelles
  (email, téléphone, adresse) présentes dans le HTML ; l'index les masque déjà.
- Ne pas committer `.graphify/`.

## Signaux utiles dans `G map`

« Classes stylées mais absentes du HTML » signale du CSS mort ; « Classes HTML sans règle CSS »
signale un style manquant ; « ids référencés mais inexistants » signale une ancre cassée.
Il faut vérifier ces signaux avant de proposer un nettoyage.
