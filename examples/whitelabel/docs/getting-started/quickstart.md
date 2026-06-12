---
title: Quickstart
description: From signup to your first deploy in 12 minutes.
---

# Quickstart

This guide walks you from a fresh Acme account to a production
deployment in under fifteen minutes.

## 1. Install the CLI

```bash
npm install -g @acme/cli
acme login
```

The login flow opens a browser tab and writes an OAuth token to
`~/.acme/credentials`. Tokens are scoped to a single workspace and
rotate every 90 days.

## 2. Bootstrap a project

```bash
acme init my-service --template typescript-edge
cd my-service
```

The starter ships with:

- A `handlers/` directory with example routes
- A typed Prisma schema linked to your Acme workspace
- A `acme.config.ts` describing your edge regions and entitlements
- A GitHub Actions workflow that previews each PR

## 3. Run it locally

```bash
acme dev
```

This boots a local edge runtime, mounts your handlers, and proxies
authentication against your dev tenant. Hot reload is instant — typing
in `handlers/health.ts` updates the running route without restarting.

## 4. Deploy

```bash
acme deploy --env production
```

The CLI builds your handlers, runs a typecheck against the live
database schema, uploads artifacts, and flips traffic. Zero-downtime
deploys are the default — there's no separate flag.

## What's next

- Read [Authentication](/guides/authentication) to wire up customer
  identity.
- Read [Webhooks](/guides/webhooks) to receive events from Acme.
- Skim the [API Reference](/api/overview) when you're ready to call
  the platform directly.
