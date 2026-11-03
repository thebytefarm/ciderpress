---
'@ciderpress/cli': patch
'ciderpress': patch
---

Fix recursive discovery builds when a subdirectory has a named entry file such as `overview.md`. Generate sidebar metadata for the real directory, keep the entry page visible, and preserve its existing URL.
