---
'@ciderpress/ui': patch
---

Fix cramped ordered-list markers. Rspress seats list markers `outside` with no `li` padding, so decimal numbers butted directly against their text (bullets looked fine, numbers did not). Add a consistent marker-to-text gap on list items, applied to `ol` and `ul` together so they stay aligned.
