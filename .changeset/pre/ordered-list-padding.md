---
'@ciderpress/ui': patch
---

Improve list and footnote rendering in docs content.

- Ordered lists, unordered lists, and task lists now share a consistent marker column, so numbers, bullets, and checkboxes line up and every list's text starts at the same place — including wrapped lines and nested lists.
- Task-list checkboxes sit cleanly in that column, with the leftover bullet removed.
- Footnotes are now set apart from the page with a separator line, a small muted heading, and compact muted text, instead of a full-size heading over body-size text.
