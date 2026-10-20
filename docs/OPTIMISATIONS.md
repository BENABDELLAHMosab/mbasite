# Bilan technique — 20 octobre 2026

Les améliorations portent sur les performances, la fiabilité, l’accessibilité et le déploiement. Les textes, couleurs, dispositions habituelles et animations approuvées ont été conservés. Les ajustements sur petits écrans corrigent des débordements préexistants.

## Téléchargement et exécution

| Ressource | Avant | Après | Bénéfice |
| --- | ---: | ---: | --- |
| Logo BricoliRent | 2 266 178 octets | 562 222 octets | −75 %, pixels visibles conservés |
| Logo BookNest | 215 552 octets | 96 422 octets | −55 %, pixels visibles conservés |
| Logo TMPA | 56 187 octets | 35 378 octets | −37 %, pixels visibles conservés |
| Logo GrowTrack | 19 726 octets | 4 910 octets | −75 %, pixels visibles conservés |
| Photo | JPEG de 544 197 octets | WebP de 17 352 à 162 546 octets selon la résolution choisie | Moins de données ; JPEG conservé en secours |
| Moteur Three.js | Environ 616 ko de JavaScript décodé et moteur local | Retiré | Suppression d’un calcul 3D invisible et de sa tentative de texture externe |
| Police et icônes | Google Fonts et feuille/fontes complètes Font Awesome | Inter local et SVG des seuls glyphes utilisés | Suppression des dépendances aux CDN tiers au chargement |

Les WebP des projets ont été comparés aux PNG : alpha identique et couleurs identiques pour chaque pixel non entièrement transparent. Les variantes du portrait utilisent une compression avec pertes de qualité 92 ; elles conservent la même image et leur rendu a été contrôlé. Les logos du site ont aussi été recompressés sans changer leurs pixels.

Le portrait garde son animation originale, `blob-bounce` de six secondes. Les effets visibles d’entrée, de défilement, de survol et le rail réversible restent présents. Le moteur supprimé dessinait un canvas masqué dans les deux thèmes ; son retrait ne supprime aucun de ces effets.

Les ressources publiées ont désormais un nom contenant leur empreinte. Vercel peut donc les conserver un an dans le navigateur, et chaque modification génère une nouvelle URL. Le HTML est revalidé pour découvrir les dernières versions. L’initialisation du thème et du préchargement est regroupée dans un seul fichier critique lors de la construction.

Ces chiffres décrivent les fichiers et non un temps de chargement garanti. Le résultat sur le domaine public devra être mesuré après déploiement, sur de vrais appareils et réseaux. Aucun score Lighthouse de production n’est revendiqué.

## Fiabilité et comportement

- Le préchargement démarre son délai de sécurité avant les autres scripts. Il disparaît à la disponibilité du DOM et ne dépend plus de l’arrivée de toutes les images ou d’un CDN. Sans JavaScript, il est masqué par défaut.
- Une erreur d’écriture dans le stockage du navigateur ne bloque plus la fermeture de la suggestion de navigation ni son bouton de navigation.
- Le formulaire inclut maintenant l’adresse e-mail saisie dans le brouillon. Les paramètres sont encodés ; un `&` ou un retour à la ligne dans un nom ne crée pas un autre en-tête de messagerie.
- Les images de projets disposent d’un secours unique en cas d’échec, sans boucle de rechargement ni gestionnaire JavaScript intégré au HTML.
- Le calcul de progression protège le cas d’une page qui ne défile pas, et le retour en haut respecte la préférence de mouvement réduit.
- Les images ont leurs dimensions intrinsèques pour réserver leur place avant le chargement.

## Accessibilité et HTML

- Les huit pages utilisent le mode HTML standard. Les petits écarts de ligne introduits par la sortie du mode historique ont été compensés pour conserver les espacements existants.
- Chaque page possède un titre principal `h1`. Les titres des sous-pages gardent leur typographie précédente.
- Le sélecteur de thème a un nom accessible et reçoit le focus au clavier.
- Le menu mobile fermé est inerte. L’ouverture place le focus sur les liens, Échap ferme le menu et rend le focus au bouton, et le passage sur ordinateur ferme le menu.
- Le retour en haut fonctionne avec Entrée et Espace ; un lien d’évitement permet d’atteindre directement le contenu.
- Les grilles et textes longs ne débordent plus sur un écran de 320 pixels.
- Les URL de ressources et le retour à l’accueil de la page 404 fonctionnent aussi pour une adresse inexistante située dans plusieurs sous-dossiers.

## Déploiement et maintenance

`vercel.json` publie uniquement `dist/`. La construction et les tests utilisent les modules natifs de Node.js. L’outil d’obfuscation inutilisé et son arbre de dépendances ont été supprimés ; l’installation propre ne contient plus de dépendance npm. Le verrou npm est versionné.

La politique CSP limite les scripts au même site et interdit les scripts intégrés, les objets et l’intégration du site dans une iframe. Les styles intégrés restent autorisés pour conserver le code et le rendu existants. Les en-têtes ajoutent aussi `nosniff`, une politique de référent et la désactivation des accès caméra, microphone et géolocalisation inutilisés. Ces réglages ont été vérifiés sur l’aperçu local reproduisant la configuration ; leur présence effective sur le domaine dépend du prochain déploiement Vercel.

Un sitemap, les URL canoniques des sous-pages et `robots.txt` ont été ajoutés. La page 404 est exclue de l’indexation. Les ouvertures externes dans un nouvel onglet utilisent `noopener noreferrer`.

95 fichiers obsolètes ou remplacés, soit 16 269 942 octets, ont été retirés des sources après vérification d’une copie de sauvegarde. La majorité n’était jamais téléchargée par les visiteurs : ce nettoyage simplifie le dépôt et évite de publier des captures de pages ou des scripts anciens. Il ne constitue pas un gain de téléchargement à lui seul. Ces fichiers restent récupérables depuis l’historique Git et la copie de référence de cette intervention.

## Vérifications

- Installation propre : `npm ci --ignore-scripts` ; aucune dépendance à installer.
- 32 tests Node : préférence de thème, synchronisation, historique, stockage indisponible, préchargement bloqué, encodage du contact, construction déterministe, renouvellement des URL lorsque le contenu change et fermeture globale des suggestions.
- Construction : huit pages et trente-deux ressources versionnées.
- Navigateur Chromium : huit pages × cinq largeurs (320, 390, 768, 991, 1 366 px) × deux thèmes, soit 80 combinaisons. Contrôles du débordement, des images, des erreurs JavaScript, des violations CSP et des ressources externes.
- Scénarios réels : navigation entre pages et onglets, menu au clavier, rail au défilement dans les deux sens, filtres, animation de la photo, contact avec messagerie simulée, retour en haut, mouvement réduit, JavaScript désactivé, script retardé de 4,2 secondes, stockage bloqué ou plein, page 404 imbriquée, cache et en-têtes.
- Captures de référence et comparaison de la géométrie sur ordinateur et mobile, en clair et en sombre.

La messagerie a été simulée dans les essais : aucun e-mail n’a été envoyé.

## Points qui nécessitent encore une information externe

Le formulaire reste un lien `mailto:` : un véritable envoi serveur demande un fournisseur de messagerie, ses accès et une décision sur les quotas et mesures anti-abus. Aucun service fictif ni secret côté navigateur n’a été ajouté.

Deux liens GitHub ont répondu 404 pendant l’audit : `BENABDELLAHMosab/tmpa-ui-builder` et `jawad3213/GrowTrackiiiiyyyy`. Ils peuvent être privés ou avoir changé d’adresse. Ils sont conservés tant qu’une URL publique correcte n’est pas connue.

La configuration est prête pour Vercel. Aucun déploiement, push ou changement du domaine public n’a été effectué pendant cette intervention.

Références techniques : [configuration Vercel](https://vercel.com/docs/project-configuration/vercel-json), [404 statique sur Vercel](https://vercel.com/kb/guide/custom-404-page), [politique CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).

## Correction du logo après validation

Les URL publiques `/assets/logo-mba-light.png` et `/assets/logo-mba-dark.png` sont aussi conservées dans la construction, pour les pages déjà ouvertes et les anciens scripts. Le sélecteur de thème conserve maintenant l’image du logo définie dans le HTML ; sa couleur est adaptée par le CSS existant. Un test de régression couvre les basculements de thème et le retour dans l’historique sans remplacement de cette URL. Les réponses du serveur pour les deux URL publiques et les deux URL versionnées ont été vérifiées : statut 200, type `image/png` et contenu identique aux fichiers sources.

## Fermeture globale des suggestions de navigation

La fermeture par × ou « Plus tard » est maintenant enregistrée pour l’ensemble du site dans `localStorage` (`portfolio-tour-dismissed = true`), sans expiration de 24 heures. Elle est respectée après rafraîchissement, navigation et nouvelle visite dans le même navigateur. Les anciennes fermetures par page sont reprises automatiquement. Les événements de stockage synchronisent les onglets déjà ouverts ; le retour depuis l’historique et le délai avant apparition vérifient également ce choix.

Douze tests supplémentaires exercent les véritables gestionnaires du script avec un DOM simulé et une horloge contrôlée : les deux boutons de fermeture, les sept pages, les visites suivantes, les anciens choix, les onglets ouverts ou en attente, l’historique, une animation différée et le stockage indisponible. Ils vérifient aussi que le bouton d’acceptation continue à naviguer et que la préférence de thème reste intacte. Aucun style de la fenêtre n’a été modifié.

## Icônes de contact colorées

Les versions monochromes Gmail et WhatsApp sont remplacées par les SVG actuellement publiés sur les sites de Google et WhatsApp. Les filtres d’inversion des couleurs ont été supprimés. Les boutons LinkedIn et GitHub portent aussi leurs pictogrammes reconnaissables ; une petite surface blanche conserve leur contraste dans les deux thèmes. Les icônes de localisation et de téléphone ont des accents bleus/cyan et verts cohérents avec la page.

Les boutons ont un léger soulèvement et un reflet au survol, un retour visuel à la pression et un focus visible au clavier. Les mouvements sont désactivés en mode de réduction des animations. Ces effets sont réalisés uniquement en CSS, sans bibliothèque ni calcul continu. Les liens e-mail, téléphone, WhatsApp et profils restent ceux déjà présents. La provenance des fichiers figure dans `assets/icons/BRAND-SOURCES.md`.
