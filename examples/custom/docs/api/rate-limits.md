---
title: Rate Limits
description: Quotas, burst behaviour, and how to ask for more.
---

# Rate Limits

Acme applies rate limits at the workspace level, not per-key. Every
response carries the live limit state in headers:

```http
X-Acme-Limit: 1000
X-Acme-Remaining: 947
X-Acme-Reset: 1736812800
```

## Default quotas

| Tier       | Sustained req/s | Burst      | Daily ceiling |
| ---------- | --------------- | ---------- | ------------- |
| Free       | 10              | 30         | 100,000       |
| Pro        | 100             | 300        | unlimited     |
| Enterprise | negotiated      | negotiated | unlimited     |

## Burst behaviour

Acme runs a token-bucket limiter sized at `burst` tokens, refilling
at `sustained` per second. A burst of `burst` requests is allowed,
then traffic must slow to the sustained rate or be rejected with
`429 Too Many Requests`.

## Handling 429

The SDK retries `429` responses with exponential backoff and respects
the `Retry-After` header:

```ts
import { client } from '@acme/sdk'

const c = client({
  retry: {
    on: [429, 502, 503, 504],
    max_attempts: 5,
    base_delay_ms: 200,
  },
})
```

Hand-rolled clients should mirror that behaviour.

## Raising your limit

Pro and Enterprise customers can request a higher limit through the
dashboard. Limits are increased without downtime — usually within
two business days.
