const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
const { build } = require('../scripts/build.cjs');
const { validateScripts } = require('../scripts/seo.cjs');
const root = path.resolve(__dirname, '..');

test('production resources are reachable, hashed by content, deterministic and isolated from source files', () => {
    // Build a temporary copy so npm test never modifies a running dist/ preview.
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-build-'));
    try {
        const excluded = new Set(['.git', 'node_modules', 'dist', '.agents', '.codex']);
        for (const file of fs.readdirSync(root)) {
            if (!excluded.has(file)) fs.cpSync(path.join(root, file), path.join(temp, file), { recursive: true });
        }
        // Hosting tools may serialize JSON differently before running the build.
        // A compact config with no final newline must build without being rewritten.
        const configFile = path.join(temp, 'vercel.json');
        const compactConfig = JSON.stringify(JSON.parse(fs.readFileSync(configFile, 'utf8')));
        fs.writeFileSync(configFile, compactConfig);
        const { output, manifest } = build(temp);
        assert.equal(fs.readFileSync(configFile, 'utf8'), compactConfig);
        for (const [source, url] of Object.entries(manifest)) {
            const data = fs.readFileSync(path.join(output, decodeURI(url)));
            const hash = createHash('sha256').update(data).digest('hex').slice(0, 12);
            assert.ok(url.includes('.' + hash + '.'), source);
        }
        const htmlPages = fs.readdirSync(output).filter(f => f.endsWith('.html'));
        const csp = JSON.parse(fs.readFileSync(path.join(temp, 'vercel.json'), 'utf8')).headers[0].headers
            .find(header => header.key === 'Content-Security-Policy').value;
        const pageIds = new Map(htmlPages.map(file => [file, new Set(
            [...fs.readFileSync(path.join(output, file), 'utf8').matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
        )]));
        for (const file of htmlPages) {
            const html = fs.readFileSync(path.join(output, file), 'utf8');
            assert.match(html, /^<!DOCTYPE html>/);
            assert.equal((html.match(/<h1\b/g) || []).length, 1, file);
            for (const match of html.matchAll(/\b(?:src|href|data-fallback-src)="(\/static\/[^"<>]+)"/g)) {
                assert.ok(fs.existsSync(path.join(output, decodeURI(match[1]))), `${file}: ${match[1]}`);
            }
            validateScripts(html, file, csp);
            const homeHref = html.match(/<a\b[^>]*href="([^"]+)"[^>]*class="(?:brand|btn-home)"/)[1];
            const pageUrl = file === 'index.html' ? 'https://www.benabdellahmosab.com/' :
                'https://www.benabdellahmosab.com/' + (file === '404.html' ? 'missing/nested/page' : file);
            const homeUrl = new URL(homeHref, pageUrl);
            homeUrl.hash = '';
            assert.equal(homeUrl.href, 'https://www.benabdellahmosab.com/', file + ': production home is canonical');
            if (file !== '404.html') {
                const canonical = 'https://www.benabdellahmosab.com/' + (file === 'index.html' ? '' : file);
                assert.ok(html.includes(`rel="canonical" href="${canonical}"`), file);
                assert.match(html, /property="og:image" content="https:\/\/www\.benabdellahmosab\.com\/Img\/profile_main\.jpg"/);
                assert.ok(html.includes('type="application/ld+json"'), file);
            }
            assert.doesNotMatch(html, /cdnjs|fonts\.googleapis|three\.min\.js|background\.js/);
            // Every contextual link and full-size image must survive production rewriting.
            for (const match of html.matchAll(/\bhref="([^"]+)"/g)) {
                const url = new URL(match[1].replaceAll('&amp;', '&'), 'https://www.benabdellahmosab.com/' + file);
                if (url.origin !== 'https://www.benabdellahmosab.com') continue;
                const destination = decodeURIComponent(url.pathname.slice(1)) || 'index.html';
                assert.ok(fs.existsSync(path.join(output, destination)), `${file}: missing ${destination}`);
                if (url.hash && pageIds.has(destination)) {
                    assert.ok(pageIds.get(destination).has(decodeURIComponent(url.hash.slice(1))), `${file}: missing anchor ${url.href}`);
                }
            }
        }
        for (const slug of ['tmpa', 'etl', 'triz']) {
            assert.ok(htmlPages.includes(`project-${slug}.html`), `published case study ${slug}`);
        }
        const css = fs.readFileSync(path.join(output, decodeURI(manifest['css/style.css'])), 'utf8');
        assert.ok(css.includes(manifest['assets/fonts/inter-latin.woff2']));
        assert.ok(css.includes('url(%23noiseFilter)'), 'embedded SVG data URL stays intact');
        const boot = fs.readFileSync(path.join(output, decodeURI(manifest['js/boot.js'])), 'utf8');
        assert.ok(boot.includes(manifest['assets/logo-mba-light.png']));
        assert.ok(boot.includes(manifest['assets/logo-mba-dark.png']));
        // Existing tabs can still request these public URLs after an optimized build.
        for (const theme of ['light', 'dark']) {
            const file = `assets/logo-mba-${theme}.png`;
            assert.deepEqual(fs.readFileSync(path.join(output, file)), fs.readFileSync(path.join(root, file)));
        }
        const home = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
        for (const width of [320, 480, 768, 1000]) {
            assert.ok(home.includes(manifest[`Img/profile-${width}.webp`] + ' ' + width + 'w'));
        }
        assert.deepEqual(build(temp).manifest, manifest);
        fs.appendFileSync(path.join(temp, 'assets/fonts/inter-latin.woff2'), Buffer.from([0]));
        const changed = build(temp).manifest;
        assert.notEqual(changed['assets/fonts/inter-latin.woff2'], manifest['assets/fonts/inter-latin.woff2']);
        assert.notEqual(changed['css/style.css'], manifest['css/style.css'], 'a nested dependency invalidates the CSS URL');
        assert.equal(changed['Img/profile_main.jpg'], manifest['Img/profile_main.jpg'], 'unrelated resources keep their cache URL');
        assert.equal(fs.existsSync(path.join(output, 'package.json')), false);
        assert.equal(fs.existsSync(path.join(output, 'js/script.obfuscated.js')), false);
        assert.ok(fs.existsSync(path.join(output, 'document/CV_Mosab_BEN_ABDELLAH_PFE_2027.pdf')));
    } finally {
        // temp is created by mkdtemp under the OS temp directory, never supplied externally.
        assert.ok(path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep));
        fs.rmSync(temp, { recursive: true, force: true });
    }
});
