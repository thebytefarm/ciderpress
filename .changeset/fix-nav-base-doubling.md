---
'@ciderpress/ui': patch
---

Fix top-nav links doubling the mount prefix on subpath deploys.

The theme's primary nav is built by scraping Rspress's rendered `.rp-nav-menu`, whose hrefs already carry the site `base`. Those already-based hrefs were passed straight to `<Link>`, so react-router's `basename` applied the prefix a second time — every mounted example site (`base: /examples/<slug>/`) produced `/examples/<slug>/examples/<slug>/…` links that 404'd on click and hard refresh. The scraped hrefs are now un-based with `removeBase` before routing, so `<Link>` re-applies the prefix exactly once. The root docs site (`base: /`) is unaffected — `removeBase` is a no-op there.
