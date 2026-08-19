---
title: Publishing
description: How Ciderpress makes a deployed documentation site discoverable by browsers, search engines, social platforms, and AI tools.
---

# Publishing

## Overview

Ciderpress produces a static site with discovery metadata for each major consumer:

| Consumer         | Output                                             | Configuration                     |
| ---------------- | -------------------------------------------------- | --------------------------------- |
| Browsers         | Page title, description, and canonical URL         | `seo` and page frontmatter        |
| Search engines   | Robots directives and `sitemap.xml`                | `seo.robots` and `seo.sitemap`    |
| Social platforms | Open Graph and Twitter card metadata               | `seo.openGraph` and `seo.twitter` |
| AI tools         | `llms.txt`, `llms-full.txt`, and per-page Markdown | Generated automatically           |

Set the production origin once at the site root. Ciderpress uses it to turn routes and image paths into absolute URLs:

```ts
seo: {
  origin: 'https://docs.acme.com',
  titleTemplate: '%s | Acme',
  socialImage: '/social.png',
  sitemap: true,
}
```

## Site defaults and page overrides

The root `seo` block defines site-wide publishing defaults. Individual pages inherit those defaults and can override search or social metadata under frontmatter `seo`:

```yaml
---
title: Authentication
description: Authenticate requests to the Acme API.
seo:
  title: Acme API Authentication
  canonical: https://docs.acme.com/guides/authentication
  socialImage: /social/authentication.png
  openGraph:
    type: article
---
```

Keep page metadata nested under `seo` so publishing fields remain distinct from layout and navigation frontmatter.

## Canonical URLs

By default, Ciderpress combines `seo.origin` with the current route to produce an absolute canonical URL. Set `frontmatter.seo.canonical` to an absolute URL when another page is authoritative, or set it to `false` to omit the canonical tag.

## Search engines

When `seo` is configured, Ciderpress generates `sitemap.xml` by default. Set `seo.sitemap` to `false` to disable it, or provide sitemap defaults such as `changeFrequency` and `priority`.

Robots metadata is inherited from `seo.robots` and can be overridden per page with `frontmatter.seo.robots`. This controls page-level crawler directives; Ciderpress does not generate a `robots.txt` file.

## Social previews

Open Graph and Twitter metadata inherit the page title and description. `seo.socialImage` provides the site default, while `frontmatter.seo.socialImage` provides a page-specific image. Relative image paths are resolved against `seo.origin`.

Ciderpress accepts static image paths. It does not generate dynamic Open Graph images.

## AI discovery

Ciderpress generates `llms.txt`, `llms-full.txt`, and a Markdown representation of every page automatically. These are root-level resources and do not need a `<head>` tag or an SEO configuration switch.

See [LLM Output](/concepts/llm-output) for endpoint details and examples.

## References

- [Configuration reference](/reference/configuration#seo) — root SEO defaults and sitemap settings
- [Frontmatter reference](/reference/frontmatter#seo) — per-page search and social overrides
- [LLM Output](/concepts/llm-output) — machine-readable documentation output
