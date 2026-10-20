# Fiches projets : sources et ressources

Les trois fiches ont été réalisées à partir des rapports transmis par Mosab le 20 octobre 2026. Les PDF originaux restent hors du dossier du site et ne sont pas publiés.

| Fiche | Rapport | Preuves utilisées |
| --- | --- | --- |
| project-tmpa.html | Ben_Abdellah_Mosab_Rapport_PFA_TMPA_2026.pdf | PDF 72 : Builder (figure 21.2, page imprimée 71) ; PDF 47 : Smart Guides (figure 13.1, page imprimée 46) ; PDF 77–78 : scénarios validés manuellement |
| project-etl.html | Rapport_Final_BI.pdf | PDF 21 : vue Power BI (figure 4.1, page imprimée 20) ; PDF 16 : pipeline Pentaho (figure 3.7, page imprimée 15) ; PDF 18, 25, 27 : 1 200 observations ; PDF 21–24 : cinq pages Power BI |
| project-triz.html | Rapport  MOSAB BEN ABDELLAH (1).pdf | PDF 17–19 : participation au développement, Power Apps / Power Automate / SharePoint et 40 principes TRIZ ; PDF 32 : accueil ; PDF 35 : cartes TRIZ |

L’année 2024 du projet Yazaki vient du portfolio et du contexte fourni par Mosab, pas de la couverture du rapport. Ce projet est distinct de la migration MDGS de 2025.

## Contenu retenu

- TMPA : conception et développement de la plateforme, versioning, rôles et revue. Le rapport confirme des validations manuelles ; aucun gain de temps ni déploiement à grande échelle n’est ajouté.
- ETL : chaîne complète CSV / Excel → staging PostgreSQL → transformations Pentaho → modèle dimensionnel → Power BI. Les 1 200 observations et cinq pages sont des livrables documentés, sans interprétation médicale des indicateurs.
- Yazaki : participation au développement du parcours de créativité. Les captures ont été recadrées pour exclure un nom d’utilisatrice et une zone industrielle ; le contenu visible de l’application n’est pas recomposé. La formulation ne revendique pas un développement solitaire.

## Où placer de nouvelles captures

Dossier : `assets/projects/evidence/`.

Les quatorze captures sont proposées en WebP. Les variantes `-640.webp` servent aux cartes et aux petits écrans. Les vues Smart Guides (579 px) et détection des dimensions (537 px) restent à leur définition d’origine.

Les galeries principales comptent trois captures TMPA, six captures ETL et trois captures TRIZ. Elles proposent une navigation manuelle avec flèches et légendes synchronisées, également disponible dans la vue agrandie. Les deux vues de précision TMPA sont présentées côte à côte. La commande d’agrandissement précède chaque image.

Les captures complémentaires proviennent des pages PDF 45 (conteneurs TMPA), 48 (repères de dimensions), 65 (prévisualisation publiée), 22–24 (autres tableaux de bord Power BI) et 32 (explication du parcours TRIZ). La prévisualisation TMPA est recadrée pour exclure un libellé personnel dans la partie inférieure.

Pour remplacer une capture :

1. Préparer une image nette de l’application, avec un nom descriptif sans espace et sans informations internes inutiles.
2. Conserver son ratio et renseigner ses vraies dimensions dans le HTML.
3. Mettre à jour le `src`, le `srcset`, le lien d’agrandissement et la légende dans la fiche et, si nécessaire, dans la carte de projets.
4. Reconstruire avec `npm run build` : les URL versionnées sont régénérées automatiquement. Ne pas modifier `dist/` à la main.

Les liens images fonctionnent sans JavaScript. Le dialogue natif constitue une amélioration progressive, avec retour du focus et restauration du défilement.

## Liens de code

L’API GitHub publique a confirmé le 20 octobre 2026 que les dépôts TMPA UI Builder et Data Warehouse ETL Pipeline sont publics et accessibles. Les liens correspondants sont conservés.

Le dépôt GrowTrack utilisé auparavant renvoie encore HTTP 404. Seul son bouton Code a été retiré ; la carte et la description sont conservées. Pour le rétablir, fournir l’URL publique valide du dépôt.

## Vérification avant publication

Les captures ont été inspectées directement. Les contrôles automatisés couvrent les ressources publiées, les liens et ancres locales, les catégories, le retour filtré, le dialogue, le clavier, la copie d’adresse et le comportement sans introduction répétée.

Une nouvelle recette visuelle interactive sur téléphone et ordinateur reste à effectuer : l’outil navigateur a refusé l’accès à la page locale pendant cette session. Les anciennes captures ne sont pas présentées comme une validation des nouvelles fiches.

