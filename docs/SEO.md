# Optimisation SEO du portfolio — 21 octobre 2026

Les améliorations sont intégrées aux sources et à la construction statique Vercel. Elles visent la recherche du nom de Mosab BEN ABDELLAH et la découverte de son profil par des recruteurs en génie logiciel et Data Engineering, pour un stage PFE en France dès avril 2027. Aucun diplôme terminé, poste occupé, avis client ou résultat commercial n’a été inventé.

## Audit et corrections

| Point | État initial | Optimisation appliquée |
| --- | --- | --- |
| Titres et descriptions | Présents, mais souvent génériques ou très courts | Dix couples spécifiques : formation, technologies, expériences et projets, en cohérence avec chaque page |
| Partage social | Open Graph et Twitter sur l’accueil uniquement | Couverture des dix pages : titre, description, URL, langue, identité du site et portrait avec dimensions et texte alternatif |
| Identité structurée | Aucun balisage Schema.org | Graphe JSON-LD reliant `Person`, `WebSite` et chaque page ; `ProfilePage` sur À propos et `ContactPage` sur Contact |
| Projets structurés | Aucun | `CollectionPage` et liste des onze réalisations ; `CreativeWork` pour les trois études de cas, avec auteur et technologies |
| Hiérarchie des titres | Plusieurs passages directs de H1 à H3 | H1 unique et enchaînement H2/H3 cohérent ; styles des cartes et chronologies conservés |
| Liens internes | Navigation existante et quelques liens de preuve | Liens contextuels depuis l’accueil et le profil ; ancres précises pour les études de cas |
| URL de référence | Canonicals déjà présents sur dix pages | Même domaine HTTPS avec `www` dans le HTML, le graphe et le sitemap ; liens d’accueil vers `/` dans la version construite et vers `index.html` dans les sources pour l’ouverture directe des fichiers ; redirections permanentes configurées pour `/index.html` et le domaine sans `www` |
| Filtres | Pages accessibles avec `?category=…` | Une seule URL canonique par page, sans paramètres ; les filtres et retours de catégories restent utilisables |
| Exploration | `robots.txt` et sitemap déjà présents | Synchronisation depuis le registre des pages, sans paramètres ni page 404 dans le sitemap ; `noindex` de la 404 conservé |
| Pérennité | Pas de contrôle SEO dédié | Vérification automatique des métadonnées, du graphe, des titres, du sitemap, de la CSP et des réponses HTTP |

Les métadonnées sont présentes avant l’exécution du JavaScript. Le graphe utilise uniquement des informations attestées par le portfolio. Les fils d’Ariane structurés suivent la hiérarchie Accueil → Page ou Accueil → Projets → Étude de cas. Le balisage ne promet pas l’affichage d’un résultat enrichi.

## Ciblage éditorial

Ces axes correspondent au contenu disponible ; ils ne constituent pas une étude de volumes de recherche ni une promesse de positionnement.

| Page | Intention ciblée |
| --- | --- |
| Accueil | Mosab BEN ABDELLAH, portfolio informatique, génie logiciel, Data Engineering |
| À propos | Mosab BEN ABDELLAH ENSA Tanger, Master 2 DOSI UBO Brest, parcours |
| Compétences | Compétences développement logiciel, SQL, ETL, Power BI, Docker et CI/CD |
| Services / expertise | Développement Full-Stack, API REST, Data Engineering, Cloud et DevOps |
| Projets | Projets logiciel, data et cloud de Mosab BEN ABDELLAH |
| Expérience | Stages Tanger Med / TMPA et Yazaki, React / Node.js, PostgreSQL, Power Apps |
| Contact | Contact Mosab BEN ABDELLAH, stage PFE 2027, France, Brest |
| Étude TMPA | TMPA UI Builder, React, TypeScript, Node.js, MongoDB, No-Code / Low-Code |
| Étude ETL | Pipeline ETL Pentaho, Data Warehouse PostgreSQL, Power BI |
| Étude TRIZ | Application Kaizen / TRIZ Yazaki, Power Apps, SharePoint, Power Automate |

Les textes visibles ont été renforcés sur l’accueil et Contact, et contextualisés sur Compétences, Expertise et Projets. Les contenus de formation et de réalisations restent factuels. Aucun contenu masqué destiné aux moteurs, bourrage de mots-clés ou faux balisage de FAQ n’a été ajouté.

## Maintenance et sécurité

La source commune est `scripts/seo.cjs`. Après une modification des titres/descriptions SEO ou des cartes projets :

```sh
npm run seo:write
npm run seo:check
npm test
npm run build
```

`seo:write` met à jour les blocs HTML, le sitemap, les règles d’exploration et les empreintes CSP des données JSON-LD. Le build vérifie leur cohérence avant de remplacer un précédent répertoire `dist/`. Seuls les blocs JSON valides sont admis dans le HTML : JavaScript exécutable intégré et gestionnaires d’événements HTML restent interdits. Aucun `unsafe-inline` ni `unsafe-eval` n’a été ajouté à `script-src`.

Le portrait de partage conserve l’URL publique `/Img/profile_main.jpg`. Il est servi en JPEG, en 1 000 × 1 000 pixels. Les autres ressources gardent leur versionnement par empreinte et leur cache existants. Aucune dépendance npm, bibliothèque SEO ou requête tierce au chargement n’a été ajoutée.

## Vérifications

- 77 tests réussis au dernier audit global, dont les quatre scénarios SEO : métadonnées et graphes de toutes les pages, rejet des scripts intégrés invalides, refus d’un build désynchronisé et réponses HTTP locales. Les réponses des dix pages indexables et du CV PDF sont vérifiées.
- Construction de onze pages réussie, dont dix indexables et la page 404 ; ressources, liens et ancres internes vérifiés dans le résultat publié.
- Vérification des données JSON-LD de production contre les empreintes de la CSP.
- Vérification HTTP des redirections 308, de la conservation des paramètres, de l’URL de partage, des canonicals et d’une vraie réponse 404 pour une page inexistante.
- Contrôle navigateur de l’accueil et du profil sur ordinateur et de l’accueil et des projets filtrés à 390 px : pas de débordement horizontal ni d’erreur console observée sur ces vues.

Ces contrôles sont locaux. Aucun score Lighthouse, trafic, position Google, état d’indexation ou indicateur Core Web Vitals de production n’est revendiqué. Le domaine public n’a pas pu être audité par l’outil web pendant cette intervention. Les redirections du domaine, le comportement du CDN et les données terrain restent à vérifier après déploiement.

Le contrôle complémentaire des onze pages à quatre largeurs d’écran, des interactions clavier, du mode sans scripts et des miniatures est détaillé dans [AUDIT_GLOBAL.md](AUDIT_GLOBAL.md).

## Mise en ligne et suivi

1. Déployer les sources et la configuration sur le projet Vercel existant. Vérifier que le domaine avec `www` sert ce projet et que le domaine sans `www` y est associé ou redirigé vers lui, sans boucle avec les réglages Domains de Vercel. Conserver les URL `.html` existantes.
2. Vérifier sur le domaine public : accueil et pages en 200, `/index.html` redirigé vers `/`, domaine sans `www` redirigé vers `www`, page inconnue en 404, portrait et sitemap accessibles. Vérifier aussi les en-têtes et les protections des déploiements d’aperçu Vercel avant de les partager.
3. Ouvrir la propriété Google Search Console du domaine. Si elle n’existe pas, sa vérification nécessite l’accès DNS du propriétaire ; aucun jeton de vérification n’a été inventé ni ajouté.
4. Soumettre `https://www.benabdellahmosab.com/sitemap.xml`, puis inspecter l’accueil, le profil et les trois études de cas. Demander une nouvelle indexation lorsque l’outil le permet.
5. Tester le profil et les fils d’Ariane avec le [test des résultats enrichis](https://search.google.com/test/rich-results), puis les autres types avec le [validateur Schema.org](https://validator.schema.org/). Une validation correcte ne garantit pas leur affichage dans Google.
6. Suivre les impressions, clics, requêtes et pages dans Search Console sur des périodes comparables. Examiner les exclusions d’indexation et les Core Web Vitals lorsqu’un volume de données suffisant est disponible. Ajuster ensuite le contenu avec les requêtes réellement observées.
7. Conserver des liens cohérents vers le portfolio depuis LinkedIn, GitHub et le CV. Les modifications de ces comptes ne font pas partie des changements locaux.

## Références officielles consultées

- [Google Search Central — Guide de démarrage SEO](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google — URL canoniques et consolidation des doublons](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google — Création et soumission d’un sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google — Données structurées ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
- [Google — Données structurées BreadcrumbList](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
- [Vercel — Configuration et redirections](https://vercel.com/docs/project-configuration/vercel-json)
- [MDN — Empreintes dans Content-Security-Policy / script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src)
