---
'@ciderpress/ui': minor
---

Render topbar nav dropdowns. Nav items with an `items` array now paint as
submenus instead of being dropped: on desktop as a hover/click popover (with a
hover bridge and close delay so it doesn't snap shut), and on mobile as a
collapsible accordion in the drawer. `CiderpressNavMenuItem.link` is now
optional and `items` is supported, matching the config-side `NavItem` shape.
