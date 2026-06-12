---
title: Dashboard
description: The Acme control plane web app.
---

# Dashboard

The Acme dashboard is the customer-facing control plane. It hosts
billing, audit logs, customer impersonation, webhook delivery
inspection, and feature-flag administration.

## Stack

- Next.js 15 with the App Router
- React Server Components for everything above the fold
- Tanstack Query for client-side state
- A typed gRPC-over-HTTP client targeting the edge runtime

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Tenant overview + recent activity |
| `/billing` | Plan, usage, invoices, payment method |
| `/audit` | Filterable audit log with CSV export |
| `/webhooks` | Live delivery feed + replay UI |
| `/team` | Members, roles, SSO config |

## Local development

```bash
acme dev --app dashboard
```

The dev server hot-reloads on saves and proxies API calls to your
local edge runtime. Authentication runs against the local
dev-tenant — no real credentials needed.
