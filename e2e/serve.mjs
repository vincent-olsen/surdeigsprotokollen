// Serves dist/ under a sub-path, exactly like GitHub Pages serves a project
// site at https://<user>.github.io/<repo>/. Zero dependencies.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    port: { type: 'string', default: '4173' },
    base: { type: 'string', default: '/surdeigsprotokollen/' },
    dir: { type: 'string', default: 'dist' },
  },
});

const root = resolve(values.dir);
const base = values.base.endsWith('/') ? values.base : `${values.base}/`;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

if (!existsSync(join(root, 'index.html'))) {
  console.error(`No build found in ${root}. Run "npm run build" first.`);
  process.exit(1);
}

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  if (path === base.slice(0, -1)) {
    res.writeHead(301, { Location: base }).end();
    return;
  }
  if (!path.startsWith(base)) {
    res.writeHead(404).end('Not found (outside base path)');
    return;
  }
  let file = normalize(join(root, path.slice(base.length)));
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404).end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(Number(values.port), () => {
  console.log(`Serving ${root} at http://localhost:${values.port}${base}`);
});
