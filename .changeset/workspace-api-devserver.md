---
'ciderpress': minor
'@ciderpress/cli': minor
'@ciderpress/config': minor
'@ciderpress/ui': minor
---

**Workspace API mirrors Page, plus a `devServer` config block for reverse proxies.**

## Workspace API migration

The `Workspace` interface now uses the same discovery surface as `Page`. Six legacy fields are replaced with their Page-aligned equivalents:

| Before (legacy) | After (Page-aligned) |
| --- | --- |
| `Workspace.items: Page[]` | `Workspace.pages: Page[]` |
| `Workspace.sort` | `Workspace.discover.sort` |
| `Workspace.recursive` | `Workspace.discover.recursive` |
| `Workspace.exclude` | `Workspace.discover.ignore` |
| `Workspace.entryFile` | `Workspace.discover.indexFile` |
| `Workspace.frontmatter` | `Workspace.defaults` |

```ts
// Before
apps: [
  {
    title: 'API',
    path: '/apps/api',
    items: [{ title: 'Overview', path: '/apps/api', include: 'README.md' }],
    sort: 'alpha',
    recursive: true,
    exclude: ['draft-*.md'],
    entryFile: 'overview',
    frontmatter: { aside: false },
  },
]

// After
apps: [
  {
    title: 'API',
    description: 'REST API',
    path: '/apps/api',
    pages: [{ title: 'Overview', path: '/apps/api', include: 'README.md' }],
    discover: { sort: 'alpha', recursive: true, ignore: ['draft-*.md'], indexFile: 'overview' },
    defaults: { aside: false },
  },
]
```

`WorkspaceGroup.items` is unchanged — it's a different `items` (an array of Workspaces, not an array of Pages). `Workspace.openapi` is unchanged.

## `devServer` config block

New top-level field for reverse-proxy and host/port control:

```ts
devServer?: {
  url?: string      // externally-visible URL → ready message + browser auto-open
  port?: number     // preferred port. Default 6174. CLI --port overrides
  host?: string     // bind interface. Default '127.0.0.1' (was 'localhost')
  open?: boolean    // auto-open the resolved URL when ready. Default false
}
```

CLI flags `--port`, `--host`, `--url` override config values. The ready message prints both the configured URL and the local bind URL when they differ, so a portless / nginx / Caddy hostname falls back to `http://127.0.0.1:port` if the proxy isn't running.

### IPv4 default for `devServer.host`

Default changed from `'localhost'` to `'127.0.0.1'`. On macOS, Node resolves `localhost` to IPv6 (`[::1]`) first; Rsbuild then binds IPv6-only and any reverse proxy pointed at `127.0.0.1:port` returns 502 Bad Gateway. Binding the IPv4 loopback by default keeps localhost-only security while staying compatible with every proxy. Set `devServer.host: '0.0.0.0'` to expose on every interface (LAN / Docker).

## End-to-end docs rewrite

Every concept doc, framework guide, and the configuration reference now matches the shipped surface — Workspace shape, `devServer`, theme block, sidebar islands, announcement shape, etc. The contributing-guide example walk-through (Stage 1 → Stage 3 in `/framework/scaling`) uses the new `pages` / `nav.island` / `discover.*` vocabulary throughout. New `/guides/using-portless` walkthrough covers the four-step portless flow.

## Custom example

`examples/custom/` ships pre-configured for portless with a stable port (`devServer.port: 7174`), a `portless: "acme"` hostname override, and a `pnpm setup:portless` script that registers the `acme.localhost → 127.0.0.1:7174` alias automatically. Visit `https://acme.localhost` after running `pnpm dev` from the example dir.
