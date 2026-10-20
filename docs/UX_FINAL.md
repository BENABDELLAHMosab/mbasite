# Améliorations du parcours recruteur — 20 octobre 2026

Les huit recommandations de la revue UX ont été approuvées puis mises en œuvre, en conservant la palette, la typographie et le mouvement original du portrait.

## Réalisé

1. **Accès au CV et actions mobiles** : lien PDF dans le menu mobile et dans le header sur ordinateur ; actions avant le texte détaillé sur mobile ; disposition précédente conservée sur ordinateur.
2. **Preuves des projets** : fiches TMPA, ETL et Kaizen/TRIZ ; quatorze captures réelles, variantes WebP, légendes, contribution personnelle et résultats documentés. Galeries manuelles à flèches : trois vues TMPA, six ETL et trois TRIZ. Deux captures de précision TMPA côte à côte.
3. **Contact** : explication du brouillon de messagerie, copie de l’adresse avec confirmation et solution de repli, action mailto native sans JavaScript.
4. **Continuité du parcours** : liens des compétences et des domaines vers des réalisations ; liens depuis les stages. Les propositions de bas de page ont été retirées à la demande de Mosab. Les fenêtres de suggestion automatiques restent supprimées.
5. **Filtres** : URL partageable par catégorie, compteur annoncé, réagencement de 200 ms, annulation des animations lors de clics rapides, retour filtré depuis les fiches et respect du mouvement réduit.
6. **Survol des cartes** : relief de la carte active conservé à la souris et au clavier ; cartes voisines stables ; effets de survol réservés aux pointeurs fins.
7. **Navigation mobile** : hauteur dynamique, défilement interne, verrouillage du fond et restitution de la position, libellés français, état de page accessible, retour du focus lors d’une ouverture du CV dans un autre onglet.
8. **Introduction** : première arrivée de la session uniquement ; rechargements et pages suivantes sans délai d’introduction ; contenu disponible si le stockage est bloqué ou plein.

Le dialogue des images reste facultatif : les liens vers les images complètes fonctionnent sans JavaScript. Son ouverture bloque le défilement du fond ; sa fermeture rend le focus à la capture activée. La préférence de réduction des animations est respectée.

## Sources et éléments à préparer

Les trois rapports fournis ont suffi. Les captures retenues sont dans `assets/projects/evidence/`. Les pages sources et les consignes de remplacement sont dans [PROJETS_SOURCES.md](PROJETS_SOURCES.md). Les rapports complets et leurs extractions ne sont pas publiés.

Le seul complément utile est une URL publique valide du dépôt GrowTrack. L’API GitHub renvoie HTTP 404 pour l’ancienne ; le bouton a été retiré, la présentation conservée. Les dépôts TMPA et ETL ont été confirmés publics.

## Vérifications

- `npm test` : 64 tests réussis.
- `npm run build` : 11 pages, 60 ressources versionnées.
- `git diff --check` : aucune erreur.
- Contrôle des ressources et ancres locales dans les fichiers de production : aucun lien local manquant.
- Revue croisée du code des nouvelles fiches, de la navigation et des interactions.
- Inspection des captures utilisées avant conversion ; les versions WebP complètes conservent les pixels des images sélectionnées et des recadrages documentés.

La seconde revue a retiré les blocs « Ce que le projet démontre », remplacé le lien de retour par un bouton discret et la fermeture par une croix dans un contrôle circulaire. La commande d’agrandissement se trouve au-dessus de chaque image. La fiche TRIZ propose un lien externe vers les 40 principes sur Innover Malin.

L’outil navigateur a refusé l’accès à la page locale. Une nouvelle recette visuelle interactive sur téléphone et ordinateur n’a donc pas été effectuée ; les anciennes captures ne servent pas de validation des nouvelles pages.

## Aperçu

Après `npm run build`, lancer `npm run preview` et consulter :
- http://127.0.0.1:4173/index.html
- http://127.0.0.1:4173/projects.html
- http://127.0.0.1:4173/project-tmpa.html
- http://127.0.0.1:4173/project-etl.html
- http://127.0.0.1:4173/project-triz.html

Les modifications sont locales ; aucun déploiement Vercel n’a été lancé.

