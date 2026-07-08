---
'@ciderpress/config': minor
'@ciderpress/ui': minor
---

Add `feedback` config to toggle the "Was this page helpful?" widget.

The widget is off by default. Set `feedback: true` to enable it with the default question, or `feedback: { question: '...' }` to enable it with custom text.

- **`@ciderpress/config`** — new `feedback?: boolean | FeedbackConfig` field on `CiderpressConfig`, with an exported `FeedbackConfig` type.
- **`@ciderpress/ui`** — `SiteBlock` and `CiderpressSiteBlock` gain a `feedback: { enabled, question }` field; `Layout` renders `<Feedback />` only when feedback is enabled.
