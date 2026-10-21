// Static, reviewable SEO metadata. No browser JavaScript or third-party dependency.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const origin = 'https://www.benabdellahmosab.com';
const personId = origin + '/#person';
const websiteId = origin + '/#website';
const portrait = origin + '/Img/profile_main.jpg';
const pages = {
    index: {
        title: 'Mosab BEN ABDELLAH | Génie logiciel & Data Engineering',
        description: 'Mosab BEN ABDELLAH, élève-ingénieur à Brest : développement logiciel, Data Engineering et DevOps. Recherche un stage PFE de 6 mois dès avril 2027 en France.',
        label: 'Accueil', type: 'WebPage'
    },
    about: {
        title: 'Parcours ENSA Tanger & UBO Brest | Mosab BEN ABDELLAH',
        description: 'Découvrez le parcours de Mosab BEN ABDELLAH : double diplomation ENSA Tanger et Master 2 DOSI à l’UBO Brest, stages industriels et engagements associatifs.',
        label: 'Profil et parcours', type: 'ProfilePage'
    },
    skills: {
        title: 'Compétences logiciel, Data & DevOps | Mosab BEN ABDELLAH',
        description: 'Compétences de Mosab BEN ABDELLAH en développement logiciel, SQL, ETL, Power BI, Docker et CI/CD, illustrées par ses projets académiques et industriels.',
        label: 'Compétences techniques', type: 'WebPage'
    },
    services: {
        title: 'Expertise logiciel, Data & Cloud | Mosab BEN ABDELLAH',
        description: 'Développement Full-Stack, API REST, Data Engineering, Business Intelligence et Cloud & DevOps : les domaines de Mosab BEN ABDELLAH, avec projets à l’appui.',
        label: 'Domaines d’expertise', type: 'WebPage'
    },
    projects: {
        title: 'Projets logiciel, Data & Cloud | Mosab BEN ABDELLAH',
        description: 'Explorez les projets de Mosab BEN ABDELLAH : TMPA UI Builder, pipeline ETL et Power BI, applications web et mobiles, infrastructures Cloud et DevOps.',
        label: 'Projets et réalisations', type: 'CollectionPage'
    },
    experience: {
        title: 'Stages chez Tanger Med & Yazaki | Mosab BEN ABDELLAH',
        description: 'Trois stages de Mosab BEN ABDELLAH chez Tanger Med et Yazaki : plateforme Full-Stack React/Node.js, migration PostgreSQL et digitalisation avec Power Apps.',
        label: 'Expériences professionnelles', type: 'WebPage'
    },
    contact: {
        title: 'Contact & stage PFE 2027 en France | Mosab BEN ABDELLAH',
        description: 'Contactez Mosab BEN ABDELLAH, élève-ingénieur à Brest, pour un stage PFE de 6 mois dès avril 2027 en France en développement logiciel ou Data Engineering.',
        label: 'Contact', type: 'ContactPage'
    },
    'project-tmpa': {
        title: 'TMPA UI Builder : React & Node.js | Mosab BEN ABDELLAH',
        description: 'Étude de cas du TMPA UI Builder : plateforme No-Code / Low-Code en React, TypeScript, Node.js et MongoDB, réalisée par Mosab BEN ABDELLAH à Tanger Med.',
        label: 'TMPA UI Builder', type: 'WebPage',
        work: { name: 'TMPA UI Builder', keywords: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Docker', 'No-Code / Low-Code'], code: 'https://github.com/BENABDELLAHMosab/tmpa-ui-builder' }
    },
    'project-etl': {
        title: 'Pipeline ETL, Pentaho & Power BI | Mosab BEN ABDELLAH',
        description: 'Étude de cas Data Engineering : pipeline ETL Pentaho, Data Warehouse PostgreSQL et tableaux de bord Power BI. Projet académique de Mosab BEN ABDELLAH.',
        label: 'Data Warehouse et ETL Pipeline', type: 'WebPage',
        work: { name: 'Data Warehouse & ETL Pipeline', keywords: ['Data Engineering', 'Pentaho Data Integration', 'PostgreSQL', 'Power BI', 'DAX'], code: 'https://github.com/BENABDELLAHMosab/Data-Warehouse-ETL-Pipeline' }
    },
    'project-triz': {
        title: 'Kaizen / TRIZ : Power Apps chez Yazaki | Mosab BEN ABDELLAH',
        description: 'Application Kaizen / TRIZ chez Yazaki : contribution de Mosab BEN ABDELLAH à un parcours Power Apps avec SharePoint, Power Automate et les 40 principes TRIZ.',
        label: 'Kaizen / TRIZ chez Yazaki', type: 'WebPage',
        work: { name: 'Kaizen / TRIZ chez Yazaki', keywords: ['Power Apps', 'Power Automate', 'SharePoint', 'TRIZ', 'Kaizen'] }
    }
};

const canonical = name => origin + (name === 'index' ? '/' : '/' + name + '.html');
const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
// Escaping < prevents a future description from terminating its HTML data block.
const serialize = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const scriptHash = source => "'sha256-" + createHash('sha256').update(source.replace(/\r\n?/g, '\n')).digest('base64') + "'";

function structuredData(name, html) {
    const page = pages[name];
    const url = canonical(name);
    const graph = [
        {
            '@type': 'Person', '@id': personId, name: 'Mosab BEN ABDELLAH',
            url: origin + '/', image: portrait,
            jobTitle: 'Élève-ingénieur en informatique',
            sameAs: ['https://www.linkedin.com/in/benabdellahmosab/', 'https://github.com/BENABDELLAHMosab']
        },
        {
            '@type': 'WebSite', '@id': websiteId, url: origin + '/',
            name: 'Mosab BEN ABDELLAH', alternateName: 'Portfolio de Mosab BEN ABDELLAH',
            inLanguage: 'fr-FR', publisher: { '@id': personId }
        },
        {
            '@type': page.type, '@id': url + '#webpage', url, name: page.title,
            description: page.description, inLanguage: 'fr-FR',
            isPartOf: { '@id': websiteId }, about: { '@id': personId },
            author: { '@id': personId }, primaryImageOfPage: { '@id': url + '#primaryimage' },
            ...(name !== 'index' ? { breadcrumb: { '@id': url + '#breadcrumb' } } : {}),
            ...(['index', 'about', 'contact'].includes(name) ? { mainEntity: { '@id': personId } } : {}),
            ...(page.work ? { mainEntity: { '@id': url + '#project' } } : {}),
            ...(name === 'projects' ? { mainEntity: { '@id': url + '#project-list' } } : {})
        },
        { '@type': 'ImageObject', '@id': url + '#primaryimage', url: portrait, width: 1000, height: 1000, caption: 'Portrait de Mosab BEN ABDELLAH' }
    ];
    if (name !== 'index') {
        const trail = [{ name: 'Accueil', item: origin + '/' }];
        if (page.work) trail.push({ name: pages.projects.label, item: canonical('projects') });
        trail.push({ name: page.label, item: url });
        graph.push({
            '@type': 'BreadcrumbList', '@id': url + '#breadcrumb',
            itemListElement: trail.map((item, index) => ({ '@type': 'ListItem', position: index + 1, ...item }))
        });
    }
    if (page.work) {
        graph.push({
            '@type': 'CreativeWork', '@id': url + '#project', name: page.work.name,
            url, description: page.description, inLanguage: 'fr-FR',
            creator: { '@id': personId }, mainEntityOfPage: { '@id': url + '#webpage' },
            keywords: page.work.keywords,
            ...(page.work.code ? { subjectOf: { '@type': 'SoftwareSourceCode', codeRepository: page.work.code, url: page.work.code } } : {})
        });
    }
    if (name === 'projects') {
        // Derive the list from visible cards, so projects cannot drift from their markup.
        const items = [...html.matchAll(/<article\b[^>]*\bid="([^"]+)"[^>]*class="project-card"[\s\S]*?<h[23]\b[^>]*>([^<]+)<\/h[23]>/g)];
        graph.push({
            '@type': 'ItemList', '@id': url + '#project-list', name: page.label,
            numberOfItems: items.length,
            itemListElement: items.map(([, id, title], index) => ({
                '@type': 'ListItem', position: index + 1,
                name: title.replaceAll('&amp;', '&'),
                url: ['project-tmpa', 'project-etl', 'project-triz'].includes(id) ? canonical(id) : url + '#' + id
            }))
        });
    }
    return { '@context': 'https://schema.org', '@graph': graph };
}

function renderMetadata(name, html) {
    const page = pages[name];
    const url = canonical(name);
    const meta = (key, value, property = false) => `    <meta ${property ? 'property' : 'name'}="${key}" content="${escapeHtml(value)}">`;
    return [
        '    <!-- SEO: generated by npm run seo:write; edit scripts/seo.cjs -->',
        `    <title>${escapeHtml(page.title)}</title>`,
        meta('description', page.description),
        meta('author', 'Mosab BEN ABDELLAH'),
        meta('robots', 'index, follow, max-image-preview:large'),
        `    <link rel="canonical" href="${url}">`,
        meta('og:type', 'website', true), meta('og:locale', 'fr_FR', true),
        meta('og:site_name', 'Mosab BEN ABDELLAH', true), meta('og:url', url, true),
        meta('og:title', page.title, true), meta('og:description', page.description, true),
        meta('og:image', portrait, true), meta('og:image:type', 'image/jpeg', true),
        meta('og:image:width', '1000', true), meta('og:image:height', '1000', true),
        meta('og:image:alt', 'Portrait de Mosab BEN ABDELLAH', true),
        meta('twitter:card', 'summary'), meta('twitter:url', url),
        meta('twitter:title', page.title), meta('twitter:description', page.description),
        meta('twitter:image', portrait), meta('twitter:image:alt', 'Portrait de Mosab BEN ABDELLAH'),
        `    <script type="application/ld+json">${serialize(structuredData(name, html))}</script>`,
        '    <!-- /SEO -->'
    ].join('\n');
}

function renderPage(name, html) {
    const metadata = renderMetadata(name, html);
    if (html.includes('    <!-- SEO:')) return html.replace(/    <!-- SEO:[\s\S]*?    <!-- \/SEO -->/, metadata);
    // One-time migration of the existing hand-written metadata.
    return html.replace(/    <meta name="description"[\s\S]*?(?=    <link rel="preload")/, metadata + '\n\n');
}

function renderSitemap() {
    // No invented lastmod, priority or changefreq values.
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        Object.keys(pages).map(name => `  <url><loc>${canonical(name)}</loc></url>`).join('\n') + '\n</urlset>\n';
}

function validateScripts(html, label = 'HTML', allowedHashes) {
    if (/\son\w+\s*=/i.test(html)) throw new Error(`Inline JavaScript is forbidden by the CSP: ${label}`);
    for (const [, attributes, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
        if (/\bsrc\s*=/i.test(attributes) && !body.trim()) continue;
        if (!/^\s*type="application\/ld\+json"\s*$/i.test(attributes)) {
            throw new Error(`Inline JavaScript is forbidden by the CSP: ${label}`);
        }
        const data = JSON.parse(body);
        if (data['@context'] !== 'https://schema.org' || !Array.isArray(data['@graph'])) {
            throw new Error(`Invalid JSON-LD graph: ${label}`);
        }
        if (allowedHashes && !allowedHashes.includes(scriptHash(body))) {
            throw new Error(`JSON-LD is not authorized by the CSP: ${label}`);
        }
    }
}

function syncSeo(root = path.resolve(__dirname, '..'), { write = false } = {}) {
    const changed = [];
    const hashes = [];
    function sync(file, expected) {
        const target = path.join(root, file);
        const current = fs.readFileSync(target, 'utf8').replace(/\r\n?/g, '\n');
        if (current !== expected) {
            changed.push(file);
            if (write) fs.writeFileSync(target, expected);
        }
    }
    for (const name of Object.keys(pages)) {
        const html = fs.readFileSync(path.join(root, name + '.html'), 'utf8').replace(/\r\n?/g, '\n');
        const expected = renderPage(name, html);
        if (!expected.includes('<!-- /SEO -->')) throw new Error(`Missing SEO insertion point: ${name}`);
        validateScripts(expected, name);
        sync(name + '.html', expected);
        for (const [, body] of expected.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) hashes.push(scriptHash(body));
    }
    sync('sitemap.xml', renderSitemap());
    sync('robots.txt', 'User-agent: *\nAllow: /\n\nSitemap: ' + origin + '/sitemap.xml\n');
    const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
    const csp = config.headers.find(rule => rule.source === '/(.*)').headers.find(header => header.key === 'Content-Security-Policy');
    // Only the exact JSON data blocks are authorized; executable inline scripts stay forbidden.
    const expectedCsp = csp.value.replace(/script-src\s+[^;]+/, "script-src 'self' " + [...new Set(hashes)].join(' '));
    // The config is user/platform-owned JSON, not a generated text file. Its
    // indentation, key order, escapes and final newline do not change the CSP.
    // Check only the generated value; check mode must never rewrite the config.
    if (csp.value !== expectedCsp) {
        changed.push('vercel.json');
        if (write) {
            csp.value = expectedCsp;
            fs.writeFileSync(path.join(root, 'vercel.json'), JSON.stringify(config, null, 2) + '\n');
        }
    }
    if (changed.length && !write) throw new Error('SEO metadata is stale. Run npm run seo:write: ' + changed.join(', '));
    return changed;
}

if (require.main === module) {
    const write = process.argv.includes('--write');
    const changed = syncSeo(undefined, { write });
    console.log(write ? `SEO synchronized (${changed.length} files updated).` : `SEO verified for ${Object.keys(pages).length} indexable pages.`);
}
module.exports = { origin, pages, canonical, renderMetadata, structuredData, syncSeo, scriptHash, validateScripts };
