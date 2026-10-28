---
'@ciderpress/config': minor
'@ciderpress/ui': minor
'@ciderpress/cli': patch
'ciderpress': minor
---

Allow `navbar: { width: 'container' | 'full' }` in page frontmatter or config defaults to choose home-style container navigation or full-width navigation independently of the page layout. Existing boolean navbar settings remain supported, and omitting the width preserves the page type's default.
