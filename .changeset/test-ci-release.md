---
'ciderpress': patch
'@ciderpress/cli': patch
'@ciderpress/config': patch
'@ciderpress/templates': patch
'@ciderpress/theme': patch
'@ciderpress/ui': patch
---

Test/exercise the CI release pipeline.

No code changes — this changeset only exists to force the changesets bot to open a release PR, validate that the GitHub Actions workflow can publish via npm trusted publishing (no `NPM_TOKEN`, OIDC-only with `id-token: write` + `NPM_CONFIG_PROVENANCE: true`), and confirm provenance attestations land on the resulting `1.0.0-rc.2` releases. Following the local bootstrap publish of `1.0.0-rc.1`, this is the first CI-driven cut.
