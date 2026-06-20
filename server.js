import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 8080
const HOST = process.env.HOST || 'localhost'
const OPEN_BROWSER = process.argv.includes('--open')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath)
  const mime = MIME[ext] || 'application/octet-stream'

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Not Found')
      return
    }
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    })
    res.end(data)
  })
}

const server = http.createServer((req, res) => {
  let urlPath = new URL(req.url, `http://${HOST}:${PORT}`).pathname

  if (urlPath === '/') urlPath = '/index.html'

  const filePath = path.join(__dirname, urlPath)

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  serveFile(res, filePath)
})

server.listen(PORT, HOST, () => {
  console.log(`\n  ✓ Estuda+ server running`)
  console.log(`  ─────────────────────────────`)
  console.log(`  Local:   http://${HOST}:${PORT}`)
  console.log(`  Network: http://0.0.0.0:${PORT}\n`)

  if (OPEN_BROWSER) {
    import('node:child_process').then(({ exec }) => {
      const cmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open'
      exec(`${cmd} http://${HOST}:${PORT}`)
    })
  }
})
