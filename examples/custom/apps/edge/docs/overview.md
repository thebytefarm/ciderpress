---
title: Edge Runtime
description: The serverless layer that runs your handlers.
---

# Edge Runtime

The Acme edge runtime is where your `handlers/` directory actually
runs. It's a managed V8 isolate environment running on more than
forty points of presence worldwide.

## Cold start budget

Acme guarantees `p99` cold starts under 50ms. Most cold starts
finish in 8–14ms because isolates share the V8 platform and only
recompile your code.

## What's available

- Standard web APIs (`fetch`, `Request`, `Response`, `crypto`)
- `Buffer` and `process.env` polyfills
- Acme SDK helpers (`ctx.db`, `ctx.log`, `ctx.cache`, `ctx.flags`)
- Time and IO operations forwarded to the regional pool

## What's not

Node-only APIs (`fs`, `net`, raw `process` access, native modules)
are intentionally absent. Use Acme's managed equivalents:

| Node API           | Acme equivalent                |
| ------------------ | ------------------------------ |
| `fs.readFileSync`  | `ctx.assets.read('path')`      |
| `net.connect`      | `ctx.cache` (Redis) or `fetch` |
| `process.cpuUsage` | `ctx.metrics`                  |

## Routing

Routes are file-based:

```
handlers/
  index.ts         → GET  /
  customers.ts     → GET  /customers, POST /customers
  customers/[id].ts → GET  /customers/:id
```

Export a default `route(...)` from each file. The build step
generates an OpenAPI spec automatically.
