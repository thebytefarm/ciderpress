---
'ciderpress': minor
'@ciderpress/cli': minor
'@ciderpress/config': minor
'@ciderpress/ui': minor
---

**Fix:** the navbar fallback no longer overrides the auto-generated `/logo.svg`
with the hardcoded `<CiderpressLogo />` wordmark. When `logo` is omitted, the
nav now shows the SVG written to the public dir by the banner module (derived
from `title`). Sites that committed their own `public/logo.svg` already won
this round; sites that didn't were silently getting the ciderpress wordmark.

The themed wordmark is still available as an opt-in:

```ts
import { CiderpressLogo } from 'ciderpress'

export default defineConfig({
  logo: ({ theme }) => <CiderpressLogo />,
})
```

**New:** two top-level config fields for overriding auto-generated asset paths.

- `banner?: string` — hero image used on the home page and workspace landing
  pages. Defaults to `/banner.svg`.
- `favicon?: string` — favicon path. Defaults to `/icon.svg`. Distinct from
  `icon` (the Iconify id for the inline topbar mark).

```ts
export default defineConfig({
  banner: '/assets/hero.png',
  favicon: '/favicon.ico',
})
```

Auto-generation and the `<!-- ciderpress-generated -->` marker still carry the
default case — these fields are only needed to point at a different filename
or a CDN URL.
