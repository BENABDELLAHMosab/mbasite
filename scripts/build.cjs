// Dependency-free static build. Only resources reachable from the portfolio pages are published.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const pages = ['index', 'about', 'skills', 'services', 'projects', 'experience', 'contact', 'project-tmpa', 'project-etl', 'project-triz', '404'];
const origin = 'https://www.benabdellahmosab.com';
const assetPattern = /^(?:assets|css|js|Img|document)\//;

function build(root = path.resolve(__dirname, '..')) {
    const output = path.resolve(root, 'dist');
    // Never clean a configurable or arbitrary path, even when called from a test.
    if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== 'dist') {
        throw new Error('Unsafe output directory');
    }
    if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) {
        throw new Error('Output directory must not be a symbolic link');
    }
    fs.rmSync(output, { recursive: true, force: true });
    fs.mkdirSync(output);
    const manifest = {};
    const visiting = new Set();
    const virtualBoot = fs.readFileSync(path.join(root, 'js/theme.js'), 'utf8') + '\n' +
        fs.readFileSync(path.join(root, 'js/preloader.js'), 'utf8');

    function write(file, data) {
        const target = path.join(output, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, data);
    }

    function rewrite(reference, parent = '') {
        if (/^(?:data:|#|mailto:|tel:)/i.test(reference)) return reference;
        let local = reference;
        const absolute = local.startsWith(origin + '/');
        if (absolute) local = local.slice(origin.length);
        else if (/^(?:https?:)?\/\//i.test(local)) return reference;
        const suffix = local.match(/[?#].*$/)?.[0] || '';
        local = decodeURIComponent(local.slice(0, local.length - suffix.length || undefined));
        local = local.startsWith('/') ? local.slice(1) : path.posix.join(path.posix.dirname(parent), local);
        local = path.posix.normalize(local);
        if (!assetPattern.test(local)) return reference;
        const result = publish(local) + suffix;
        return absolute ? origin + result : result;
    }

    function publish(file) {
        if (manifest[file]) return manifest[file];
        if (visiting.has(file)) throw new Error(`Circular asset reference: ${file}`);
        visiting.add(file);
        const source = path.resolve(root, file);
        if (!source.startsWith(path.resolve(root) + path.sep)) throw new Error(`Invalid asset: ${file}`);
        let data = file === 'js/boot.js' ? Buffer.from(virtualBoot) : fs.readFileSync(source);
        const extension = path.extname(file);
        if (extension === '.css') {
            data = Buffer.from(data.toString().replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/g,
                (whole, doubleQuoted, singleQuoted, bare) => {
                    const url = (doubleQuoted ?? singleQuoted ?? bare).trim();
                    return url.startsWith('data:') ? whole : `url("${rewrite(url, file)}")`;
                }));
        } else if (extension === '.js') {
            data = Buffer.from(data.toString().replace(/(["'])((?:\/)?(?:assets|css|js|Img|document)\/[^"'\r\n]+)\1/g,
                (whole, quote, url) => quote + rewrite(url.startsWith('/') ? url : '/' + url) + quote));
        }
        const hash = createHash('sha256').update(data).digest('hex').slice(0, 12);
        const hashed = 'static/' + file.slice(0, -extension.length) + '.' + hash + extension;
        write(hashed, data);
        visiting.delete(file);
        manifest[file] = encodeURI('/' + hashed);
        return manifest[file];
    }

    for (const name of pages) {
        let html = fs.readFileSync(path.join(root, name + '.html'), 'utf8');
        // One synchronous request resolves the theme and starts the loading deadline before CSS.
        html = html.replace(/<script src="js\/theme.js"><\/script>\s*<script src="js\/preloader.js"><\/script>/,
            '<script src="/js/boot.js"></script>');
        html = html.replace(/\b(src|href|data-fallback-src|content)="([^"<>]+)"/g,
            (whole, attribute, url) => `${attribute}="${rewrite(url)}"`);
        html = html.replace(/\bsrcset="([^"]+)"/g, (whole, value) => 'srcset="' + value.split(',').map(candidate => {
            const match = candidate.trim().match(/^(\S+)\s+(\d+(?:\.\d+)?[wx])$/);
            if (!match) throw new Error(`Invalid responsive image candidate: ${candidate}`);
            return rewrite(match[1]) + ' ' + match[2];
        }).join(', ') + '"');
        if (/<script\b(?![^>]*\bsrc=)[^>]*>\s*\S/i.test(html) || /\son\w+\s*=/i.test(html)) {
            throw new Error(`Inline JavaScript is forbidden by the CSP: ${name}.html`);
        }
        write(name + '.html', html);
    }
    // Preserve public URLs used by CV links, social previews and earlier theme scripts.
    // The logos must also work for an already-open page using their unversioned URLs.
    for (const file of [
        'Img/profile_main.jpg', 'document/CV_Mosab_BEN_ABDELLAH_PFE_2027.pdf',
        'assets/logo-mba-light.png', 'assets/logo-mba-dark.png'
    ]) {
        write(file, fs.readFileSync(path.join(root, file)));
    }
    // Licenses travel with the self-hosted font and SVG glyphs.
    for (const file of ['assets/fonts/OFL.txt', 'assets/icons/FONT-AWESOME-LICENSE.txt', 'assets/icons/BRAND-SOURCES.md', 'robots.txt', 'sitemap.xml']) {
        write(file, fs.readFileSync(path.join(root, file)));
    }
    write('asset-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
    return { output, manifest, pageCount: pages.length };
}

if (require.main === module) {
    const { manifest, pageCount } = build();
    console.log(`Built ${pageCount} pages and ${Object.keys(manifest).length} versioned resources in dist/.`);
}
module.exports = { build };
