---
'@ciderpress/config': minor
'@ciderpress/ui': minor
'ciderpress': minor
---

Add the `pixel` icon set and give every social link a real glyph

The [Pixel Icons](https://icon-sets.iconify.design/pixel/) collection is now
bundled and resolvable by the `pixel:` prefix, both in `IconConfig` values and
`VALID_ICON_IDS` validation.

Every `SocialLinkIcon` value now maps to a real `pixel:` brand glyph — `slack`,
`linkedin`, `gitlab`, `instagram`, and `facebook` previously fell back to a
generic chain icon.

The `SocialLinkIcon` enum was trimmed to the platforms with a pixel-art glyph:
`lark`, `wechat`, `qq`, `juejin`, `zhihu`, `bilibili`, and `weibo` are no longer
accepted values (use `{ svg: '<svg>...</svg>' }` for those).
