---
'@ciderpress/config': minor
'@ciderpress/ui': minor
---

Add `feedback` config to toggle the "Was this page helpful?" widget.

The widget is enabled by default. Set `feedback: false` to disable it site-wide, or `feedback: { question: '...' }` to customise the question text.

- **`@ciderpress/config`** — new `feedback?: false | FeedbackConfig` field on `CiderpressConfig`, with an exported `FeedbackConfig` type.
- **`@ciderpress/ui`** — `SiteBlock` and `CiderpressSiteBlock` gain a `feedback: { enabled, question }` field; `Layout` conditionally renders `<Feedback />` based on the resolved value.
