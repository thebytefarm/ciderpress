---
title: SDK
description: The official @acme/sdk TypeScript client.
---

# @acme/sdk

The official SDK for calling Acme from JavaScript and TypeScript.
Generated from the same OpenAPI spec that powers our internal
clients — every method is fully typed end-to-end.

## Install

```bash
npm install @acme/sdk
```

## Quick example

```ts
import { client } from '@acme/sdk'

const acme = client({ token: process.env.ACME_TOKEN! })

const customer = await acme.customers.create({
  email: 'sam@example.com',
  plan: 'pro',
})

console.log(customer.id) // typed as `cust_${string}`
```

## Surface area

- `client(opts)` — root client factory
- `acme.customers.{ list, create, retrieve, update, delete }`
- `acme.charges.{ list, create, refund }`
- `acme.flags.{ evaluate, override }`
- `acme.webhooks.{ list, subscribe, retry }`
- `acme.audit.{ search, export }`

Every method returns a `Result<T, AcmeError>` tuple — no thrown
exceptions on expected failures (4xx). Network errors and `5xx`
responses still throw.

## Streaming

Long-running collections expose async iterators:

```ts
for await (const customer of acme.customers.stream({ plan: 'pro' })) {
  // pages fetched lazily
}
```

The stream respects `AbortSignal` and surfaces rate-limit headers via
`stream.meta`.
