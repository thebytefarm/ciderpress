---
title: Webhooks
description: Receiving signed events from Acme.
---

# Webhooks

Acme posts webhook events when state changes in your workspace —
customer signups, invoice payments, billing failures, audit policy
violations. Each event is signed with HMAC-SHA256 using your
workspace's webhook secret.

## Subscribing

Create a subscription in the dashboard or via the CLI:

```bash
acme webhooks subscribe \
  --url https://api.example.com/acme \
  --events 'customer.created,invoice.paid'
```

Wildcard subscriptions are supported (`invoice.*`, `*`).

## Verifying signatures

Always verify the signature header before processing the body:

```ts
import { verifyWebhook } from '@acme/sdk/webhooks'

app.post('/acme', async (req, res) => {
  const [err, event] = await verifyWebhook({
    body: req.rawBody,
    signature: req.headers['x-acme-signature'],
    secret: process.env.ACME_WEBHOOK_SECRET!,
  })
  if (err) return res.status(401).end()

  // event.type is a discriminated union — match exhaustively
  // ...
})
```

The SDK validates timestamp skew (default 5 minutes) and rejects
replay attempts against a local sliding window.

## Delivery guarantees

Acme retries failed deliveries with exponential backoff for up to 24
hours. After that, the event lands in your DLQ — viewable in the
dashboard under **Webhooks → Failures**.

| Attempt | Delay |
|---------|-------|
| 1 | immediate |
| 2 | 30s |
| 3 | 5m |
| 4 | 30m |
| 5 | 2h |
| 6 | 6h |
| 7 | 24h |

Acknowledge with any `2xx` response within 10 seconds. Anything else
counts as a failure.
