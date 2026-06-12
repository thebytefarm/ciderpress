---
title: Configuration
description: The acme.config.ts contract.
---

# Configuration

Every Acme service is described by a single `acme.config.ts` file at
the project root. The config drives:

- Routing and region pinning
- Database connection pooling
- Feature flag defaults
- Audit log retention
- Outbound webhook signing keys

## Minimal example

```ts
import { defineConfig } from '@acme/sdk'

export default defineConfig({
  name: 'billing',
  regions: ['us-east', 'eu-west'],
  database: {
    pool: { min: 2, max: 16 },
    statement_timeout_ms: 4000,
  },
  flags: {
    invoice_v2: { default: false, owner: 'platform@acme.co' },
  },
})
```

## Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | yes | Service slug, used in audit logs and traces. |
| `regions` | `Region[]` | yes | At least one Acme edge region. |
| `database.pool.min` | `number` | no | Minimum pool size per region. Default `1`. |
| `database.pool.max` | `number` | no | Maximum pool size per region. Default `8`. |
| `database.statement_timeout_ms` | `number` | no | Hard SQL timeout. Default `30000`. |
| `flags` | `Record<string, FlagSpec>` | no | Server-evaluated feature flags. |

## Environment overrides

Anything in `acme.config.ts` can be overridden per environment:

```ts
export default defineConfig({
  // ...
  environments: {
    production: {
      database: { pool: { min: 8, max: 64 } },
    },
    preview: {
      database: { pool: { max: 2 } },
    },
  },
})
```

The CLI surfaces the merged effective config with `acme config show
--env production`.
