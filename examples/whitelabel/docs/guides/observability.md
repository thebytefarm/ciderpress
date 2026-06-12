---
title: Observability
description: Logs, metrics, and traces in Acme.
---

# Observability

Every Acme service ships with built-in observability — no agent
install, no per-handler instrumentation. The runtime captures
structured logs, OpenTelemetry traces, and custom metrics
automatically.

## Logs

Structured logs are emitted to the platform log sink for every
request. To add your own fields:

```ts
ctx.log.info({ customer_id, plan }, 'upgrade requested')
```

The log automatically carries `request_id`, `actor_id`, `org_id`,
`service`, `region`, and `version` — never log them manually.

## Traces

Spans are created for every handler invocation, database query,
outbound HTTP call, and cache lookup. View them in the dashboard
under **Service → Traces** or export to your own backend with the
OTLP shipper.

## Custom metrics

Counters, histograms, and gauges live alongside your handlers:

```ts
import { counter, histogram } from '@acme/sdk/metrics'

const signups = counter('signups_total', ['plan'])
const latency = histogram('billing_latency_ms', ['route'])

export const signup = route({
  // ...
  handler: async (ctx, body) => {
    const start = performance.now()
    const user = await ctx.db.users.create({ data: body })
    signups.inc({ plan: body.plan })
    latency.observe(performance.now() - start, { route: '/signup' })
    return user
  },
})
```

Metrics are flushed every 10 seconds and retained for 90 days.

## Alerts

Define alerts in `acme.config.ts`:

```ts
alerts: [
  {
    name: 'error_rate_spike',
    query: 'rate(http_errors_total[5m]) > 0.05',
    notify: ['#oncall-billing'],
  },
]
```

Slack, PagerDuty, email, and webhook destinations are supported.
