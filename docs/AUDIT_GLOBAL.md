# Audit global du portfolio — 21 octobre 2026

Les tests ont été relancés après la correction du logo, puis complétés par une revue des scripts, des ressources, du HTML et du résultat de construction, ainsi que des contrôles dans le navigateur. Les problèmes reproduits ont été corrigés dans les sources locales. Aucun déploiement n’a été effectué.

## Corrections appliquées

| Problème constaté | Correction | Vérification |
| --- | --- | --- |
| Favicons remplacés par une URL `/assets/…` en changeant de thème : l’ouverture directe des fichiers cherche alors l’image à la racine du disque | URLs relatives dans les sources ; le build produit toujours les URLs versionnées absolues pour le site publié | Régression des thèmes et résolution réelle des ressources dans le dossier du portfolio |
| Police préchargée et ressources de la page 404 avec des chemins à la racine | Préchargements, CSS, script de thème et icône de la 404 compatibles avec les sources locales | Ressources sources existantes, construction et page 404 imbriquée |
| Filtre non transmis aux études de cas dans un dossier local ou sous `/portfolio/` | Validation des fichiers voisins, conservation de la catégorie, des autres paramètres et du fragment | Tests `file://`, dossier contenant des espaces, sous-répertoire HTTP et destinations hors du dossier |
| Flèches du carrousel depuis un lien de capture : la capture masquée emporte le focus | Transfert du focus au lien de la nouvelle capture visible | Plusieurs flèches successives et bouclage en tests ; reproduction au clavier dans le navigateur |
| Menu mobile inutilisable sans JavaScript | Navigation et CV natifs visibles, en-tête dans le flux normal, commandes inactives masquées via une feuille `<noscript>` | Copie temporaire sans scripts, onze pages à 320 px et navigation entre sections |
| Élément décoratif `span` directement sous la liste de navigation | Élément `li` décoratif masqué aux technologies d’assistance | Structure des listes et absence de modification du rendu normal |
| Miniatures BookNest et BricoliRent beaucoup plus grandes que leur affichage | Variantes WebP de 320 et 640 px, `srcset` et `sizes`, originaux conservés | Dimensions, transparence, poids, intégrité du build et sélection des variantes dans le navigateur |

La correction précédente du logo reste en place : liens `index.html` dans les sources, liens `/` dans les pages construites et retour `#top` depuis l’accueil. Les métadonnées SEO et les URL canoniques sont conservées.

## Gain sur les images

Redimensionnement Lanczos avec Pillow 12.3.0, WebP qualité 90, transparence conservée. Aucune dépendance de fonctionnement du site n’a été ajoutée.

| Image | Original | Variante 320 px | Variante 640 px |
| --- | ---: | ---: | ---: |
| BookNest | 96 422 octets | 9 284 octets | 20 268 octets |
| BricoliRent | 562 222 octets | 13 942 octets | 41 294 octets |
| Total | 658 644 octets | 23 226 octets | 61 562 octets |

Les variantes de 320 px sont 96,47 % plus légères que les originaux correspondants ; celles de 640 px sont 90,65 % plus légères. Le choix dépend de la densité d’écran et des dimensions déclarées. Les fichiers originaux ne sont pas modifiés et restent candidats pour les écrans très denses. Ces images étaient déjà chargées à la demande : le bénéfice concerne surtout le défilement de la liste des projets, sans promesse de gain sur le LCP initial.

## Résultats des vérifications

Les commandes finales ont toutes réussi :

```sh
npm run seo:check
npm test
npm run build
git diff --check
```

- **77 tests réussis**, aucun échec ni test ignoré ; neuf scénarios de régression supplémentaires depuis la précédente validation à 68 tests.
- **Onze pages construites**, dont dix indexables et la page 404 ; 65 ressources versionnées et leurs dépendances vérifiées.
- Métadonnées et graphes JSON-LD cohérents, sitemap synchronisé et autorisations CSP exactes.
- Les dix pages indexables répondent en HTTP 200 dans l’aperçu ; filtres et URL canoniques vérifiés. La réponse du CV est en `application/pdf` et commence par la signature PDF.
- Redirections permanentes, conservation des paramètres et vraie réponse 404 pour un chemin inconnu vérifiées par HTTP local.
- Les onze pages ont été contrôlées dans le navigateur aux largeurs **320, 390, 768 et 1 280 px**, en clair et en sombre : aucun débordement horizontal détecté dans ces 88 configurations.
- Contrôle de titres H1 uniques, attributs alternatifs présents et libellés des commandes visibles ; ces vérifications ne constituent pas une certification d’accessibilité complète.
- Menu mobile ouvert et fermé avec Échap, restitution du focus et libération du défilement vérifiés.
- Navigation filtrée vers une étude de cas, flèches successives du carrousel, agrandissement d’image et fermeture avec Échap vérifiés dans le navigateur. Le focus revient à la capture visible.
- Aucune erreur ni alerte console observée sur les parcours contrôlés.

Pour le mode sans JavaScript, l’outil navigateur ne proposait pas de désactivation du moteur. Une copie temporaire de la construction a été servie sans balises `script`, avec le contenu de `noscript` activé. Les onze vues à 320 px n’ont présenté aucun débordement ; les six liens principaux restent visibles sur les dix pages concernées, les onze projets restent affichés et le formulaire conserve son action native. L’en-tête ne recouvre pas le contenu. Cette copie de contrôle ne fait pas partie du site livré.

## Vérifications restant liées à la publication

Les corrections sont prêtes à déployer sur le projet Vercel existant. L’audit local ne mesure pas le CDN, les redirections effectivement configurées dans le compte Vercel, le référencement observé dans Google, les performances sur réseau mobile réel ou la disponibilité future des services externes.

Après déploiement, vérifier les domaines avec et sans `www`, les URL principales, le CV, le sitemap et la page 404, puis suivre l’indexation dans Search Console. Les étapes détaillées figurent dans [SEO.md](SEO.md). Les envois e-mail, appels téléphoniques et messages WhatsApp n’ont pas été déclenchés ; la préparation du brouillon et les liens sont vérifiés par les tests et l’inspection du site.
