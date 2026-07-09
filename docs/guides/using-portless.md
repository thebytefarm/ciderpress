---
title: Using portless.sh
description: Run ciderpress dev behind portless.sh for stable HTTPS hostnames instead of localhost:6174.
---

# Using portless.sh

[portless.sh](https://portless.sh) replaces `localhost:6174` with a stable `https://<name>.localhost` hostname over HTTPS. ciderpress works behind portless via a static **alias** — portless proxies your hostname to the local port the dev server binds. No env-var dance, no portless-managed child process required.

## 1. Install portless and trust its CA — once per machine

```bash
npm i -g portless
portless trust            # sudo-prompts to install the CA
portless proxy start      # sudo-prompts to bind 443 (or use `portless service install` for boot persistence)
```

`portless trust` adds the local CA to your system trust store (`security` on macOS, `update-ca-certificates` / `update-ca-trust` on Linux, `certutil` on Windows). After that the CA stays trusted; you never re-run unless you `portless clean` first. Verify with `portless doctor`.

## 2. Configure your project — once per project

```jsonc title="package.json"
{
  "name": "my-docs",
  "portless": "acme", // alias hostname → https://acme.localhost
}
```

```ts title="ciderpress.config.ts"
import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'Acme Docs',
  pages: [/* ... */],
  devServer: {
    url: 'https://acme.localhost', // what the ready message + browser auto-open use
    port: 7174, // stable port the alias points at
  },
})
```

The dev server binds to `127.0.0.1:${devServer.port}` (defaults to `127.0.0.1` — explicitly IPv4, because `localhost` on macOS can resolve to IPv6 first and trip reverse proxies pointed at the IPv4 loopback). `devServer.url` is purely a display + auto-open hint.

## 3. Register the alias — once per machine per project

```bash
portless alias acme 7174 --force
```

This tells portless: "when someone hits `https://acme.localhost`, proxy to `127.0.0.1:7174`." The alias persists in portless's state directory and survives proxy restarts.

`--force` overwrites any prior entry, so re-running after a port change just refreshes the route.

## 4. Run it

```bash
ciderpress dev            # binds 127.0.0.1:7174
```

Then visit `https://acme.localhost`. The dev server doesn't know about portless at all — portless intercepts the HTTPS request, terminates TLS with its trusted CA, and forwards to the local HTTP port.

## See it working

The [`examples/custom`](https://github.com/thebytefarm/ciderpress/tree/main/examples/custom) example ships pre-configured. From its directory:

```bash
pnpm setup:portless        # verifies portless is installed + proxy running,
                           # registers the acme.localhost → 127.0.0.1:7174 alias,
                           # confirms the alias is visible in `portless list`.
                           # Never sudo-prompts. Idempotent — safe to re-run.
pnpm dev                   # binds 127.0.0.1:7174 — visit https://acme.localhost
```

The `predev` lifecycle hook runs the same setup script in `--quiet` mode before every `pnpm dev`, so misconfiguration surfaces as a clear failure with a `Fix:` command before the dev server starts.

> **`zx --install`:** the setup script uses `massaman` for pattern matching but neither `massaman` nor a config file lives in `examples/custom`'s `devDependencies`. `zx --install` reads the script's imports at runtime and installs them on demand.

## How it works under the hood

ciderpress runs on top of Rsbuild, which does **not** validate the `Host` header on incoming requests. Portless's `Host: acme.localhost` header lands without any allowlist configuration — no `allowedHosts`, no CORS adjustment needed for normal docs browsing.

## Gotchas

- **IPv4 vs IPv6 binding.** ciderpress binds `127.0.0.1` by default specifically so reverse proxies pointed at the IPv4 loopback can reach it. If you override `devServer.host`, keep it on an IPv4 address that portless can reach. `host: 'localhost'` will bind IPv6-only on some platforms and produce 502 Bad Gateway through portless.
- **Pin the port.** The alias points at a specific port. If your dev server picks a different port (e.g. the configured port is occupied and ciderpress falls forward), the alias goes stale. Set `devServer.port` to a value you don't use anywhere else and keep portless aligned via `pnpm setup:portless`.
- **HMR over a portless HTTPS origin.** Rsbuild's HMR uses a WebSocket. Portless proxies WebSockets, so this works as long as the page connects to its own origin. If HMR drops, check devtools for a mixed-content or origin-mismatch warning.
- **Don't set `cors` unless you actually need it.** A docs site is static. Only configure CORS if you embed live demos that `fetch()` back to the dev server from the portless origin.
- **`base` stays a path.** `devServer.url` is the origin (`https://acme.localhost`); `base` is the URL path the site mounts at (`/`, `/docs/`). Different concerns.

## References

- [Configuration reference — `devServer`](/reference/configuration#devserver) — full field reference
- [CLI reference — `dev`](/reference/cli#dev) — `--url`, `--host`, `--port` overrides

## Resources

- [portless.sh](https://portless.sh) — install + project docs
- [vercel-labs/portless](https://github.com/vercel-labs/portless) — source repo + `portless alias` semantics
