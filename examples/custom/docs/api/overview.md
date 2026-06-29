---
title: API Overview
description: Resources, conventions, and pagination.
---

# API Overview

The Acme HTTP API is REST-shaped with JSON request and response
bodies. Every endpoint is also exposed as a strongly-typed call in
the official SDKs.

## Base URL

```text
https://api.acme.dev/v1
```

Preview deploys get a stable subdomain per workspace:

```text
https://api.<workspace>.preview.acme.dev/v1
```

## Authentication

All requests must carry a bearer token:

```http
Authorization: Bearer <token>
```

See [Authentication](/guides/authentication) for token types and
scopes.

## Pagination

Collection endpoints return a `cursor`-based page envelope:

```json
{
  "data": [
    /* … */
  ],
  "page": {
    "next_cursor": "eyJpZCI6IjIwMjUtMDEifQ==",
    "has_more": true
  }
}
```

Pass `?cursor=<next_cursor>` to fetch the next page. Cursors are
opaque, signed, and tied to the original query.

## Errors

Errors follow [RFC 7807](https://datatracker.ietf.org/doc/html/rfc7807):

```json
{
  "type": "https://errors.acme.dev/invalid_payload",
  "title": "Invalid payload",
  "status": 422,
  "detail": "field 'email' must be a valid address",
  "instance": "/v1/customers"
}
```

The `type` URL resolves to a human-readable explanation page with
remediation steps.

## Idempotency

Mutating endpoints accept an `Idempotency-Key` header. Acme stores
the first response under that key for 24 hours — replays return the
cached result.

```http
POST /v1/charges
Idempotency-Key: 7f3d2c1a-9b4e-4...
```

Use a UUID per logical operation, not per retry.
