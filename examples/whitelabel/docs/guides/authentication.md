---
title: Authentication
description: Wiring customer identity into your Acme service.
---

# Authentication

Acme handles authentication via short-lived JWTs signed by your
workspace's private key. The SDK ships with helpers for the common
flows: cookie-session web apps, mobile clients, and machine-to-machine
calls.

## Verifying a request

Every handler receives a typed `ctx.actor` after the auth middleware
runs. The middleware is on by default — opt out per route with
`auth: false`.

```ts
import { route } from '@acme/sdk'

export const me = route({
  method: 'GET',
  path: '/me',
  handler: async (ctx) => {
    // ctx.actor is fully typed; .id, .org, .roles are non-null here.
    return { id: ctx.actor.id, org: ctx.actor.org }
  },
})
```

## Cookie sessions

For browser-based clients, set the session cookie after sign-in:

```ts
import { issueSession } from '@acme/sdk/auth'

const cookie = await issueSession({
  actor: { id: user.id, org: user.org_id, roles: ['member'] },
  ttl: '24h',
})
```

The cookie is `HttpOnly`, `Secure`, and `SameSite=Lax` by default.
Override only if you have a documented reason.

## Machine-to-machine

For server-side calls, mint a service token:

```bash
acme token create --service ingestion-pipeline --ttl 30d
```

The token is printed once. Treat it like a password — store it in
your secrets manager, not in source control.

## Role-based access

Define roles in `acme.config.ts`:

```ts
roles: {
  admin: { permissions: ['*'] },
  member: { permissions: ['read:*', 'write:own'] },
  guest: { permissions: ['read:public'] },
}
```

Then gate handlers:

```ts
export const wipe = route({
  method: 'POST',
  path: '/admin/wipe',
  require: { role: 'admin' },
  handler: async (ctx) => { /* … */ },
})
```
