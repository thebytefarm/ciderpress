---
title: Using portless.sh
description: Run ciderpress dev behind portless.sh for stable HTTPS hostnames instead of localhost:6174.
---

# Using portless.sh

[portless.sh](https://portless.sh) replaces `localhost:6174` with a stable `https://<name>.localhost` hostname over HTTPS. ciderpress works behind portless with one config field — `devServer.url`. The whole setup is four short steps.

## 1. Install portless and trust its CA — once per machine

```bash
npm i -g portless
portless trust
```

`portless trust` sudo-prompts once to add portless's local CA to your system trust store (`security add-trusted-cert` on macOS, `update-ca-certificates` / `update-ca-trust` on Linux, `certutil` on Windows). After that the CA stays trusted; you never re-run this command unless you `portless clean` first.

Verify with `portless doctor` — it reports CA trust, port 443 binding, and anything else portless wants.

## 2. Configure your project — once per project

Two fields. The first tells portless which subdomain to serve at; the second tells ciderpress what URL to print and auto-open.

```jsonc title="package.json"
{
  "name": "my-docs",
  "portless": "acme",                  // serves at https://acme.localhost
  "scripts": {
    "dev": "ciderpress dev"            // portless runs the `dev` script
  }
}
```

```ts title="ciderpress.config.ts"
import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'Acme Docs',
  pages: [
    /* ... */
  ],
  devServer: {
    url: 'https://acme.localhost',
    open: true,
  },
})
```

`devServer.url` does not change which port ciderpress binds to — the dev server still listens on `localhost:6174` (or your configured `host` / `port`). It only changes what the "ready: …" message prints and what the `o` hotkey / `open: true` opens in the browser.

## 3. Run it

From your project directory:

```bash
portless
```

portless reads the `dev` script from `package.json`, picks an upstream port, runs `ciderpress dev` against it, and registers the route at `https://acme.localhost`. Visit that URL — portless terminates TLS and forwards to the dev server.

## 4. See it working

The [`examples/custom`](https://github.com/thebytefarm/ciderpress/tree/main/examples/custom) example ships pre-configured. From its directory:

```bash
pnpm setup:portless        # preflight check — verifies Node, portless on PATH,
                           #   package.json portless field, and devServer.url.
                           #   Never sudo-prompts; never mutates anything.
                           #   Failures print the exact fix command.
portless                   # opens https://acme.localhost
```

Or from the repo root, just run the dev server (the preflight runs automatically as a `predev` hook and refuses to start if portless drifts out of alignment):

```bash
pnpm dev:custom
```

## How it works under the hood

ciderpress runs on top of Rsbuild, which does **not** validate the `Host` header on incoming requests. Portless's `Host: acme.localhost` header lands without any allowlist configuration — no `allowedHosts`, no CORS adjustment needed for normal docs browsing.

## Gotchas

- **HMR over a portless HTTPS origin.** Rsbuild's HMR uses a WebSocket. When the page loads from `https://acme.localhost`, the WebSocket needs to travel through the same portless tunnel. Portless proxies WebSockets, so this works as long as the page connects to its own origin. If HMR drops, check devtools for a mixed-content or origin-mismatch warning.
- **Don't set `cors` unless you actually need it.** A docs site is static — no XHR back to the dev server in the common case. Only configure CORS if you embed live demos that `fetch()` back to the dev server from the portless origin.
- **`base` stays a path.** `devServer.url` is the origin (`https://acme.localhost`); `base` is the URL path the site mounts at (`/`, `/docs/`). They serve different concerns and don't overlap.

## References

- [Configuration reference — `devServer`](/reference/configuration#devserver) — full field reference
- [CLI reference — `dev`](/reference/cli#dev) — `--url`, `--host`, `--port` overrides

## Resources

- [portless.sh](https://portless.sh) — install + project docs
- [vercel-labs/portless](https://github.com/vercel-labs/portless) — source repo
