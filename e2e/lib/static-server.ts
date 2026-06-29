import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join, normalize, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolvePath(HERE, '..', '..')
const DIST_DIR = resolvePath(REPO_ROOT, '.ciderpress', 'dist')

const PORT = Number(process.env.PORT ?? '8080')

const MIME_TYPES = new Map<string, string>([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.mjs', 'application/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.avif', 'image/avif'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf'],
  ['.mp4', 'video/mp4'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.md', 'text/markdown; charset=utf-8'],
  ['.mdx', 'text/markdown; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
])

/**
 * Resolve a request URL to an absolute file path under DIST_DIR.
 *
 * Vercel-style resolution order:
 *   1. exact file match (`/foo.html` → `dist/foo.html`)
 *   2. cleanUrls extension (`/foo` → `dist/foo.html`)
 *   3. directory index (`/foo/` → `dist/foo/index.html`)
 *
 * Returns `null` when nothing matches. Deliberately does NOT fall back
 * to the root SPA index — broken routes should surface as 404s so the
 * e2e specs can catch them.
 *
 * @private
 * @param requestPath - URL path from the incoming request
 * @returns Absolute file path under DIST_DIR, or `null` when no match
 */
function resolveFile(requestPath: string): string | null {
  // Strip query / fragment + normalize so `../` traversal can't escape DIST_DIR.
  const cleanPath = requestPath.split('?')[0].split('#')[0]
  const normalized = normalize(cleanPath).replace(/^(\/)?(\.\.\/)+/, '/')
  const decoded = decodeURIComponent(normalized)
  const safePath = resolvePath(DIST_DIR, `.${decoded}`)
  if (!safePath.startsWith(DIST_DIR)) {
    return null
  }

  const candidates = (() => {
    if (decoded.endsWith('/')) {
      // Try the directory's `index.html` first; fall back to the
      // cleanUrls sibling (`/foo/` → `/foo.html`) so paths like
      // `/examples/` resolve to the landing MDX that Rspress emits as
      // `dist/examples.html`.
      return [join(safePath, 'index.html'), `${safePath.replace(/\/$/, '')}.html`]
    }
    return [safePath, `${safePath}.html`, join(safePath, 'index.html')]
  })()

  return (
    candidates.find(
      // oxlint-disable-next-line security/detect-non-literal-fs-filename -- path is constrained to safePath built from rootDir + a sanitized request URL
      (path) => existsSync(path) && statSync(path).isFile()
    ) ?? null
  )
}

const server = createServer((req, res) => {
  const requestUrl = req.url ?? '/'
  const filePath = resolveFile(requestUrl)
  if (filePath === null) {
    res.statusCode = 404
    res.setHeader('content-type', 'text/plain; charset=utf-8')
    res.end(`404: ${requestUrl}\n`)
    return
  }

  const ext = extname(filePath).toLowerCase()
  const mime = MIME_TYPES.get(ext) ?? 'application/octet-stream'
  res.statusCode = 200
  res.setHeader('content-type', mime)
  res.setHeader('cache-control', 'no-cache')
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- filePath is constrained to DIST_DIR by resolveFile
  createReadStream(filePath).pipe(res)
})

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[e2e/static-server] serving ${DIST_DIR} on http://localhost:${PORT}`)
})
