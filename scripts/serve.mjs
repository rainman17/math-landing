// Локальный просмотр без зависимостей: node scripts/serve.mjs [порт] [--lan]
// --lan — открыть доступ с других устройств в локальной сети.
import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const port = Number(process.argv.find((arg) => /^\d+$/.test(arg)) || 4173)
const host = process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1'
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let file = normalize(join(root, path))
  if (!file.startsWith(root) || file.includes(`${root}/.git`) || file.includes('node_modules')) {
    res.writeHead(403).end()
    return
  }
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html')
    statSync(file)
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' })
    createReadStream(file).pipe(res)
  } catch {
    res.writeHead(404, { 'content-type': types['.html'] })
    createReadStream(join(root, '404.html')).pipe(res)
  }
}).listen(port, host, () => console.log(`http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`))
