---
'@ciderpress/ui': patch
---

Size the sidebar bottom band to its content

The sidebar bottom band (`.cp-sidebar-bottom`, which holds the promo card and
below-links) grew to fill all remaining sidebar height (`flex: 1 0 auto`) and
bottom-aligned its content (`justify-content: flex-end`). When the nav tree was
short — or the promo was disabled, leaving only the below-links — the band
stretched full-height and stranded its content at the very bottom of the
sidebar, leaving a large block of dead space between the last nav item and the
links/promo.

The band now sizes to its content (`flex: 0 0 auto`, no bottom-align) so the
promo and links sit directly beneath the last nav item. `position: sticky;
bottom: 0` is kept, so when the nav tree overflows the viewport and the sidebar
scrolls, the band still pins to the viewport bottom and stays visible — the
sticky offset is simply inert on a short, non-scrolling nav.
