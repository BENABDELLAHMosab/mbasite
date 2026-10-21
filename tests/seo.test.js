const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { origin, pages, canonical, syncSeo, scriptHash, validateScripts } = require('../scripts/seo.cjs');
const { build } = require('../scripts/build.cjs');
const { createPreview } = require('../scripts/preview.cjs');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('every indexable page has unique static metadata, a connected graph and a complete heading hierarchy', () => {
    assert.deepEqual(syncSeo(root), []);
    const titles = new Set(), descriptions = new Set();
    const sitemap = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    assert.deepEqual(sitemap, Object.keys(pages).map(canonical));
    const csp = JSON.parse(read('vercel.json')).headers[0].headers.find(header => header.key === 'Content-Security-Policy').value;
    assert.doesNotMatch(csp.split(';').find(directive => directive.trim().startsWith('script-src')), /unsafe-inline|unsafe-eval/);
    for (const [name, page] of Object.entries(pages)) {
        const html = read(name + '.html');
        assert.match(html, /<html lang="fr">/);
        assert.equal((html.match(/<title>/g) || []).length, 1, name);
        assert.equal((html.match(/name="description"/g) || []).length, 1, name);
        assert.equal((html.match(/rel="canonical"/g) || []).length, 1, name);
        assert.ok(html.includes(`rel="canonical" href="${canonical(name)}"`), name);
        assert.ok(html.includes('content="index, follow, max-image-preview:large"'), name);
        assert.ok(!titles.has(page.title), name + ': unique title');
        assert.ok(!descriptions.has(page.description), name + ': unique description');
        titles.add(page.title); descriptions.add(page.description);
        for (const field of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt', 'og:locale', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image:alt']) {
            assert.equal((html.match(new RegExp(`(?:name|property)="${field}"`, 'g')) || []).length, 1, `${name}: ${field}`);
        }
        const json = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1];
        assert.ok(csp.includes(scriptHash(json)), name + ': exact data block is authorized');
        const graph = JSON.parse(json)['@graph'];
        const ids = new Set(graph.map(node => node['@id']));
        function checkReferences(value) {
            if (!value || typeof value !== 'object') return;
            if (Object.keys(value).length === 1 && value['@id']) assert.ok(ids.has(value['@id']), name + ': graph reference ' + value['@id']);
            Object.values(value).forEach(checkReferences);
        }
        checkReferences(graph);
        const webpage = graph.find(node => node['@id'] === canonical(name) + '#webpage');
        assert.equal(webpage.name, page.title);
        assert.equal(webpage.description, page.description);
        if (name !== 'index') {
            const trail = graph.find(node => node['@type'] === 'BreadcrumbList').itemListElement;
            assert.equal(trail.length, page.work ? 3 : 2);
            assert.equal(trail.at(-1).item, canonical(name));
            trail.forEach((item, index) => assert.equal(item.position, index + 1));
        }
        const main = html.match(/<main\b[\s\S]*?<\/main>/)[0];
        const headings = [...main.matchAll(/<h([1-6])\b/g)].map(match => Number(match[1]));
        assert.equal(headings.filter(level => level === 1).length, 1, name);
        let previous = 0;
        for (const level of headings) {
            assert.ok(level <= previous + 1, name + ': no skipped heading level');
            previous = level;
        }
        const brandHref = html.match(/<a\b[^>]*href="([^"]+)"[^>]*class="brand"/)[1];
        // A root-relative '/' mistakenly opens C:/ when HTML is opened directly.
        for (const base of ['file:///C:/portfolio/', 'file:///tmp/portfolio/', 'https://example.test/portfolio/']) {
            const home = new URL(brandHref, base + name + '.html');
            home.hash = '';
            assert.equal(home.href, new URL('index.html', base).href, name + ': source logo returns to the portfolio');
        }
    }
    const listing = JSON.parse(read('projects.html').match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1])['@graph'].find(node => node['@type'] === 'ItemList');
    assert.equal(listing.numberOfItems, 11);
    assert.equal(listing.itemListElement.length, 11);
    for (const item of listing.itemListElement) {
        const url = new URL(item.url);
        const destination = read(url.pathname.slice(1));
        if (url.hash) assert.ok(destination.includes(`id="${url.hash.slice(1)}"`), item.name);
    }
    assert.match(read('404.html'), /name="robots" content="noindex"/);
    const notFoundHome = read('404.html').match(/<a\b[^>]*href="([^"]+)"[^>]*class="btn-home"/)[1];
    assert.equal(new URL(notFoundHome, 'file:///C:/portfolio/404.html').href, 'file:///C:/portfolio/index.html');
    assert.ok(sitemap.every(url => !url.includes('404') && !url.includes('?') && !url.endsWith('index.html')));
    assert.ok(read('robots.txt').includes(`Sitemap: ${origin}/sitemap.xml`));
});

test('JSON-LD allowance never permits executable inline scripts, handlers or invalid data', () => {
    for (const html of [
        '<script>alert(1)</script>',
        '<script type="module">alert(1)</script>',
        '<script src="/js/script.js">alert(1)</script>',
        '<img src="x" onerror="alert(1)">',
        '<script type="application/ld+json">alert(1)</script>',
        '<script type="application/ld+json">{"@context":"evil"}</script>'
    ]) assert.throws(() => validateScripts(html));
    const json = '{"@context":"https://schema.org","@graph":[]}';
    const html = `<script type="application/ld+json">${json}</script>`;
    assert.doesNotThrow(() => validateScripts(html, 'test', scriptHash(json)));
    assert.throws(() => validateScripts(html, 'test', "script-src 'self'"), /not authorized/);
});

test('stale metadata fails before an existing production build can be replaced', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-seo-'));
    try {
        for (const file of [...Object.keys(pages).map(name => name + '.html'), 'vercel.json', 'robots.txt', 'sitemap.xml']) {
            fs.copyFileSync(path.join(root, file), path.join(temp, file));
        }
        fs.mkdirSync(path.join(temp, 'dist'));
        fs.writeFileSync(path.join(temp, 'dist/sentinel'), 'existing build');
        fs.writeFileSync(path.join(temp, 'contact.html'), read('contact.html').replace('<title>', '<title>Stale '));
        assert.throws(() => build(temp), /SEO metadata is stale/);
        assert.equal(fs.readFileSync(path.join(temp, 'dist/sentinel'), 'utf8'), 'existing build');
        assert.ok(syncSeo(temp, { write: true }).includes('contact.html'));
        assert.deepEqual(syncSeo(temp), []);
    } finally {
        assert.ok(path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep));
        fs.rmSync(temp, { recursive: true, force: true });
    }
});

test('equivalent Vercel JSON serialization is accepted without rewriting configuration', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-seo-json-'));
    try {
        for (const file of [...Object.keys(pages).map(name => name + '.html'), 'vercel.json', 'robots.txt', 'sitemap.xml']) {
            fs.copyFileSync(path.join(root, file), path.join(temp, file));
        }
        const config = JSON.parse(read('vercel.json'));
        function reorder(value) {
            if (Array.isArray(value)) return value.map(reorder);
            if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).reverse().map(([key, child]) => [key, reorder(child)]));
            return value;
        }
        const variants = [
            JSON.stringify(config),
            JSON.stringify(config, null, 4),
            JSON.stringify(config, null, '\t') + '\r\n',
            JSON.stringify(reorder(config)),
            JSON.stringify(config).replaceAll('/', '\\/').replaceAll('self', '\\u0073elf')
        ];
        for (const content of variants) {
            assert.deepEqual(JSON.parse(content), config, 'the actual configuration is unchanged');
            fs.writeFileSync(path.join(temp, 'vercel.json'), content);
            assert.deepEqual(syncSeo(temp), []);
            assert.equal(fs.readFileSync(path.join(temp, 'vercel.json'), 'utf8'), content, 'check mode is read-only');
            assert.deepEqual(syncSeo(temp, { write: true }), []);
            assert.equal(fs.readFileSync(path.join(temp, 'vercel.json'), 'utf8'), content, 'write mode preserves an already valid config');
        }
    } finally {
        assert.ok(path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep));
        fs.rmSync(temp, { recursive: true, force: true });
    }
});

test('reformatted Vercel configuration still rejects and repairs genuinely stale CSP values', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-seo-csp-'));
    try {
        for (const file of [...Object.keys(pages).map(name => name + '.html'), 'vercel.json', 'robots.txt', 'sitemap.xml']) {
            fs.copyFileSync(path.join(root, file), path.join(temp, file));
        }
        const original = JSON.parse(read('vercel.json'));
        const header = config => config.headers.find(rule => rule.source === '/(.*)').headers.find(item => item.key === 'Content-Security-Policy');
        const mutations = [
            value => value.replace(/ 'sha256-[^']+'/, ''),
            value => value.replace(/'sha256-[^']+'/, "'sha256-stale'"),
            value => value.replace("script-src 'self'", "script-src 'self' 'sha256-extra'"),
            value => value.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")
        ];
        for (const mutate of mutations) {
            const config = structuredClone(original);
            header(config).value = mutate(header(config).value);
            fs.writeFileSync(path.join(temp, 'vercel.json'), JSON.stringify(config));
            assert.throws(() => syncSeo(temp), /SEO metadata is stale.*vercel\.json/);
            assert.deepEqual(syncSeo(temp, { write: true }), ['vercel.json']);
            assert.deepEqual(JSON.parse(fs.readFileSync(path.join(temp, 'vercel.json'), 'utf8')), original, 'other headers and deployment settings are preserved');
            assert.deepEqual(syncSeo(temp), []);
        }
    } finally {
        assert.ok(path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep));
        fs.rmSync(temp, { recursive: true, force: true });
    }
});

test('HTTP preview preserves canonical filters, permanent redirects and genuine 404 responses', async t => {
    const server = createPreview(root);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    function request(route, headers = {}) {
        return new Promise((resolve, reject) => {
            const req = http.get({ hostname: '127.0.0.1', port: server.address().port, path: route, headers }, response => {
                let body = '';
                response.setEncoding('utf8');
                response.on('data', chunk => { body += chunk; });
                response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
            });
            req.on('error', reject);
        });
    }
    const routes = [...Object.keys(pages).map(name => new URL(canonical(name)).pathname),
        '/projects.html?category=data', '/project-etl.html?category=data'];
    for (const route of routes) {
        const response = await request(route);
        assert.equal(response.status, 200, route);
        assert.ok(response.body.includes(`rel="canonical" href="${origin}${route.split('?')[0]}"`));
        validateScripts(response.body, route, response.headers['content-security-policy']);
    }
    const home = await request('/index.html?utm_source=cv');
    assert.equal(home.status, 308);
    assert.equal(home.headers.location, '/?utm_source=cv');
    const apex = await request('/project-etl.html?category=data', { Host: 'benabdellahmosab.com' });
    assert.equal(apex.status, 308);
    assert.equal(apex.headers.location, origin + '/project-etl.html?category=data');
    const slash = await request('/projects.html/');
    assert.equal(slash.status, 308);
    assert.equal(slash.headers.location, '/projects.html');
    const missing = await request('/page-inexistante');
    assert.equal(missing.status, 404);
    assert.match(missing.body, /name="robots" content="noindex"/);
    const image = await request('/Img/profile_main.jpg');
    assert.equal(image.status, 200);
    assert.equal(image.headers['content-type'], 'image/jpeg');
    const cv = await request('/document/CV_Mosab_BEN_ABDELLAH_PFE_2027.pdf');
    assert.equal(cv.status, 200);
    assert.equal(cv.headers['content-type'], 'application/pdf');
    assert.ok(cv.body.startsWith('%PDF-'), 'the CV response is an actual PDF');
});
