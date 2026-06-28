---
title: Using portless.sh
description: Run ciderpress dev behind portless.sh for stable HTTPS hostnames instead of localhost:6174.
---

# Using portless.sh

[portless.sh](https://portless.sh) is a local reverse proxy that replaces `localhost:6174` with a stable `https://<name>.localhost` hostname. ciderpress works behind portless with one config field — `devServer.url` — that tells the dev server which URL to print in the terminal and open in the browser.

## Install portless

```bash
npm install -g portless
```

First run on macOS / Linux generates and trusts a local CA, then binds port 443 (sudo-elevates as needed). No further setup.

## Configure ciderpress

Three things need to line up so portless serves your docs at the hostname you want:

1. **`devServer.url`** in `ciderpress.config.ts` — where the "ready: …" message points and what the browser auto-opens.
2. **`portless`** field in `package.json` — overrides the inferred subdomain so portless serves at `acme.localhost` instead of `<package-name>.localhost`.
3. **`dev` script** in `package.json` — portless runs the `dev` script when invoked with no args.

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

```jsonc title="package.json"
{
  "name": "example-custom",
  "portless": "acme",
  "scripts": {
    "dev": "ciderpress dev"
  }
}
```

`devServer.url` does not change which port ciderpress binds to — the dev server still listens on `localhost:6174` (or your configured `host` / `port`). It only changes what the "ready: …" message prints and what `o` / `--open` opens in the browser.

> **See it working:** the [`examples/custom`](https://github.com/thebytefarm/ciderpress/tree/main/examples/custom) example ships with portless pre-configured. Setup is a two-step:
>
> ```bash
> cd examples/custom
> pnpm setup:portless    # installs the local CA into your system trust store
>                        # (sudo-prompts once), runs `portless doctor`, and
>                        # verifies the example's config alignment.
> ```
>
> Then, from anywhere in the repo:
>
> ```bash
> pnpm dev:custom        # runs the dev server. A `predev` preflight runs in
>                        # check-only mode (never sudo-prompts) and refuses to
>                        # start if portless drifts out of alignment.
> ```
>
> The preflight catches three regressions: `portless` missing from PATH, the `portless` field missing from `package.json`, or `devServer.url` drifting from the configured hostname. Fix any failure with the printed `Fix:` line, then re-run.

## Run portless

From your project directory:

```bash
portless
```

portless reads the `dev` script from `package.json`, picks an upstream port, runs `ciderpress dev` against it, and registers the route at `https://<portless-name>.localhost`. Visit the URL ciderpress prints — portless terminates TLS and forwards to the dev server.

## Why it works

ciderpress runs on top of Rsbuild, which does **not** validate the `Host` header on incoming requests. Portless's `Host: docs.acme.localhost` header lands without any allowlist configuration — no `allowedHosts`, no CORS adjustment needed for normal docs browsing.

## Gotchas

- **HMR over a portless HTTPS origin.** Rsbuild's HMR uses a WebSocket. When the page loads from `https://docs.acme.localhost`, the WebSocket needs to either travel through the same portless tunnel or hit the upstream directly. Portless proxies WebSockets, so this works as long as the page connects to its own origin. If you see HMR drop, check the browser devtools console for a mixed-content or origin-mismatch warning.
- **Don't set `cors` unless you actually need it.** A docs site is static — no XHR back to the dev server in the common case. Only configure `devServer` proxy / CORS settings if you embed live demos that `fetch()` back to the dev server from the portless origin.
- **`base` stays a path.** `devServer.url` is the origin (`https://docs.acme.localhost`); `base` is the URL path the site mounts at (`/`, `/docs/`). They serve different concerns and don't overlap.

## References

- [Configuration reference — `devServer`](/reference/configuration#devserver) — full field reference
- [CLI reference — `dev`](/reference/cli#dev) — `--url`, `--host`, `--port` overrides

## Resources

- [portless.sh](https://portless.sh) — install + project docs
- [vercel-labs/portless](https://github.com/vercel-labs/portless) — source repo
