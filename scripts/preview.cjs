const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const mime = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
    '.pdf': 'application/pdf', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain'
};

function createPreview(root = path.resolve(__dirname, '../dist')) {
    root = path.resolve(root);
    const config = require('../vercel.json');
    return http.createServer((request, response) => {
        if (!['GET', 'HEAD'].includes(request.method)) {
            response.writeHead(405, { Allow: 'GET, HEAD' }).end();
            return;
        }
        let pathname;
        try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
        catch { response.writeHead(400).end(); return; }
        const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
        if (!target.startsWith(root + path.sep) || pathname.includes('\0')) {
            response.writeHead(403).end(); return;
        }
        const exists = fs.existsSync(target) && fs.statSync(target).isFile();
        const file = exists ? target : path.join(root, '404.html');
        if (!fs.existsSync(file)) { response.writeHead(503).end('Run npm run build first.'); return; }
        // These are exactly the two route patterns configured for this static deployment.
        for (const rule of config.headers) {
            if (rule.source === '/(.*)' || (exists && rule.source === '/static/(.*)' && pathname.startsWith('/static/'))) {
                for (const header of rule.headers) response.setHeader(header.key, header.value);
            }
        }
        response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
        response.setHeader('Content-Length', fs.statSync(file).size);
        response.writeHead(exists ? 200 : 404);
        if (request.method === 'HEAD') response.end();
        else fs.createReadStream(file).pipe(response);
    });
}

if (require.main === module) {
    const port = Number(process.env.PORT || 4173);
    const server = createPreview();
    server.listen(port, '127.0.0.1', () => console.log(`Production preview: http://127.0.0.1:${port}`));
}
module.exports = { createPreview };
