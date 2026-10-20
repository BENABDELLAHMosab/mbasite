# Portfolio de Mosab BEN ABDELLAH

Site statique en HTML, CSS et JavaScript, hébergé sur Vercel. Aucune base de données, fonction serveur ou dépendance npm n’est nécessaire à son fonctionnement ou à sa construction.

## Développement et vérification

Utiliser Node.js 22 ou supérieur et servir les fichiers en HTTP :

```sh
npm ci --ignore-scripts
npm test
npm run build
npm run preview
```

Ouvrir ensuite [l’aperçu de production](http://127.0.0.1:4173). Le serveur local reproduit les en-têtes de sécurité, le cache et la page 404 configurés pour Vercel. Après une modification, reconstruire avec `npm run build`, puis recharger l’aperçu.

Pour travailler directement sur les sources avec Python, utiliser `python -m http.server 8080`, puis ouvrir [le site local](http://127.0.0.1:8080). L’aperçu de production reste nécessaire pour vérifier les URL versionnées et la CSP. Le double-clic sur un fichier HTML ne reproduit pas l’hébergement HTTP.

## Déploiement Vercel

La configuration du dépôt est dans `vercel.json` :

- commande de construction : `npm run build` ;
- répertoire publié : `dist` ;
- ressources dans `dist/static` : nom contenant une empreinte du contenu, cache navigateur d’un an ;
- HTML et URL publiques stables (dont les deux logos) : revalidation à chaque visite ;
- fichier `404.html` conservé, sans redirection globale vers l’accueil ;
- scripts autorisés uniquement depuis le site, sans script JavaScript intégré au HTML.

`dist/` est généré et ignoré par Git. La construction copie uniquement les ressources référencées par les onze pages (dont trois fiches de projets), réécrit leurs URL et produit `dist/asset-manifest.json`. Une modification d’une ressource modifie automatiquement son URL, y compris celle du CSS qui la référence. Les sources restent lisibles et modifiables.

Le workflow `.github/workflows/quality.yml` lance l’installation, les tests et la construction à chaque push ou pull request. Il ne déploie pas le site lui-même.

## Fichiers importants

| Fichier | Rôle |
| --- | --- |
| `js/theme.js` | Thème système par défaut, choix manuel dans `localStorage` sous `portfolio-theme`, synchronisation entre onglets et restauration de l’historique |
| `js/preloader.js` | Introduction à la première arrivée de la session, délai maximal de 2,5 s, navigation suivante directe |
| `js/script.js` | Menu mobile avec restauration du défilement, retour en haut et révélations au défilement |
| `js/journey.js` | Animations des parcours sur À propos et Expérience |
| `js/entrance.js` | Animations d’entrée de l’accueil et du contact |
| `js/projects.js` | Filtres dans l’URL, compteur accessible, transitions et liens vers les fiches |
| `js/contact.js` | Brouillon e-mail et copie de l’adresse avec solution de repli |
| `js/project-gallery.js` | Agrandissement accessible des captures et retour au projet dans sa catégorie |
| `project-tmpa.html`, `project-etl.html`, `project-triz.html` | Fiches illustrées à partir des rapports fournis |
| `css/style.css` | Styles communs, navigation, accès au CV et disposition responsive de l’accueil |
| `css/recruiter-journey.css` | Liens contextuels, fiches de projets et galeries |
| `scripts/build.cjs` | Construction statique et versionnement des ressources, sans bibliothèque externe |
| `scripts/preview.cjs` | Aperçu HTTP local de la construction |
| `tests/` | Tests du thème, du chargement, du contact et de la construction |

## Images, polices et icônes

Inter et les icônes sont hébergés localement. Leurs licences sont conservées dans `assets/fonts/OFL.txt` et `assets/icons/FONT-AWESOME-LICENSE.txt`. Les pictogrammes SVG Font Awesome correspondent aux glyphes déjà utilisés.

Le contact utilise les fichiers de marque Gmail (version 2026) et WhatsApp publiés par leurs sites officiels, ainsi que les pictogrammes LinkedIn et GitHub. Les sources sont consignées dans `assets/icons/BRAND-SOURCES.md`. Les couleurs des logos restent identiques en clair et en sombre. Les effets de survol, de pression et de focus utilisent uniquement du CSS et sont désactivés lorsque le visiteur demande une réduction des animations.

Les quatre images de projets converties en WebP conservent leurs pixels visibles. La photo utilise quatre variantes WebP de haute qualité (320, 480, 768 et 1 000 px) ; le navigateur choisit la résolution adaptée à l’écran. Le JPEG d’origine reste le secours et l’image de partage. Le mouvement CSS original de la photo (`blob-bounce`, 6 secondes) est conservé et respecte la préférence de réduction des animations.

## Contact

Le formulaire explique qu’il ouvre le logiciel de messagerie du visiteur avec un brouillon. Il n’envoie rien depuis Vercel et n’annonce jamais un envoi effectué. La copie de l’adresse confirme la réussite de l’API Clipboard ; si elle échoue, une adresse sélectionnable permet une copie manuelle. Sans JavaScript, l’action native `mailto:` et un lien direct restent disponibles ; la CSP autorise ce protocole pour les formulaires.

## Parcours et navigation

La visite utilise des liens contextuels entre compétences, expériences et projets. Les blocs de continuation ajoutés en bas de page ont été retirés après revue visuelle avec Mosab. Aucune fenêtre de navigation n’apparaît sur minuterie. Les anciennes préférences `portfolio-tour-dismissed` restent intactes ; ce mécanisme n’est plus nécessaire au parcours actuel.

Le préchargement utilise séparément `sessionStorage`, sous `portfolio-preloader-seen`, pour ne présenter l’introduction qu’à la première arrivée dans la session de l’onglet. Un stockage indisponible omet cette introduction facultative. Le thème reste géré indépendamment dans `localStorage`.

Les filtres utilisent `projects.html?category=data` (ou `software`, `cloud`, `ia`, `mobile`). Les fiches conservent cette catégorie dans leur lien de retour. Les images de projets sont dans `assets/projects/evidence/`. Les sources, pages des rapports et consignes de remplacement sont documentées dans `docs/PROJETS_SOURCES.md` ; les rapports complets ne sont pas publiés.

Le bilan technique figure dans `docs/OPTIMISATIONS.md`. Les améliorations du parcours recruteur, les vérifications et les aperçus des nouvelles fiches sont récapitulés dans `docs/UX_FINAL.md`.
