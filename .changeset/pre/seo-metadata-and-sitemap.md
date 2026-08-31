---
'ciderpress': minor
'@ciderpress/config': minor
'@ciderpress/ui': minor
---

Add first-class SEO configuration with nested per-page overrides.

- Configure the production origin, title template, social image, Open Graph defaults, Twitter
  cards, robots directives, and sitemap generation under top-level `seo`.
- Override canonical, search, Open Graph, Twitter, and robots metadata under page frontmatter
  `seo`.
- Generate absolute canonical URLs and `sitemap.xml` while preserving Rspress's built-in page
  title, description, Open Graph, and `llms.txt` generation.
- Upgrade Rspress to 2.0.19 and use its official sitemap plugin.
