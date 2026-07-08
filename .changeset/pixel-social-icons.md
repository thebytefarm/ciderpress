---
'@ciderpress/config': minor
'@ciderpress/ui': minor
'ciderpress': minor
---

Add the `pixel` icon set and give every social link a real glyph

The [Pixel Icons](https://icon-sets.iconify.design/pixel/) collection is now
bundled and resolvable by the `pixel:` prefix, both in `IconConfig` values and
`VALID_ICON_IDS` validation.

Social links now map to `pixel:` glyphs wherever a pixel-art icon exists, so
`slack`, `linkedin`, `gitlab`, `instagram`, and `facebook` — all valid
`SocialLinkIcon` values that previously fell back to a generic chain icon — now
render their real brand mark. The China-centric platforms `pixel` doesn't ship
(`wechat`, `qq`, `juejin`, `zhihu`, `bilibili`, `weibo`) fall back to the
monochrome `simple-icons` set.
