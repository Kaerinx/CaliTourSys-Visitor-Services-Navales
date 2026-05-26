You are designing low-fidelity wireframes for a tourism information website 
called TWBIS (Tourism Web-Based Information System) for the Local Government 
Unit of Calabanga, Camarines Sur, Philippines.

This is a PUBLIC-FACING tourist website only. Do not include any admin 
panels, CMS dashboards, or staff-facing screens.

---

DESIGN SYSTEM RULES (apply to all pages):
- Use an 8px base grid throughout
- 12-column layout at desktop (1280px), 4-column at mobile (375px)
- Grayscale only: fills in [#F5F5F5, #E0E0E0, #BDBDBD, #757575, #212121]
- Use placeholder boxes for images (gray fill + diagonal cross)
- Typography: use placeholder text in hierarchy sizes only — H1, H2, H3, Body, Caption
- Annotate EVERY section with a sticky note or label explaining its purpose and behavior
- Show ALL states: default, hover (dashed border), active (darker fill), disabled (40% opacity)
- No icons, no colors, no real images

---

NAVIGATION (appears on every page):
Fixed top navbar — 64px height
Left: Logo placeholder (rectangle 120×32px)
Center: Nav links — Home | Discover | Map | OTOP Products | Events | Museum
Right: Search icon | Login button
Mobile: Hamburger icon → full-screen drawer
ANNOTATION: "Sticky on scroll. Collapses to icon-only on mobile. Active state = underline on current page."

---

PAGE 1 — HOME (most important, most detailed)

Section 1 — Hero banner (full viewport height, 100vw)
- Large image placeholder (full bleed)
- Overlay layer: site tagline block left-aligned, centered vertically
- Tagline placeholder: "H1 — Discover Calabanga" + "H3 — sub-tagline" + Primary CTA button + Secondary ghost button
- ANNOTATION: "Parallax scroll effect. CTA = 'Explore the map'. Ghost = 'Learn more'."

Section 2 — Quick discovery strip (below hero, 96px height)
- 4 icon tiles in a row: Nature | Culture | Food | Events
- Each tile = icon placeholder circle + label
- ANNOTATION: "Horizontal scroll on mobile. Click filters the map to that category."

Section 3 — Featured promotions (card grid)
- Section header: "H2 label" + "See all →" link
- 3-column card grid (1 column on mobile)
- Each card: Image placeholder (16:9) | Title | Tag badge | Short description | "Read more" link
- ANNOTATION: "Cards sourced from active promotional campaigns. Max 6 shown on home."

Section 4 — Interactive map preview (full-width, 480px height)
- Map placeholder (gray fill with grid lines to simulate tile map)
- Left overlay panel: "Filter by category" with 4 checkbox placeholders
- 5–6 pin markers scattered on map (circles with numbers)
- "Open full map →" button bottom-right
- ANNOTATION: "Static preview only on home. Clicking any pin or button routes to /discover."

Section 5 — OTOP product highlights (horizontal scroll)
- Section header: "H2" + category filter tabs (All | Food | Handicraft | Textile)
- Horizontal scroll row: 4 product cards visible + partial 5th (scroll affordance)
- Each product card: Square image placeholder | Product name | Producer name | Price | "Accredited" badge placeholder
- ANNOTATION: "Horizontal drag on mobile. 'Accredited' badge appears only if producer is verified."

Section 6 — Upcoming events strip
- 3-column card grid (cards are landscape 3:1 ratio)
- Each card: Date block (large day number + month) | Event title | Location pill
- ANNOTATION: "Auto-sorted by nearest date. Max 3 events shown."

Section 7 — Footer
- 4-column layout: Logo + tagline | Quick links | Contact info | Social media icons
- Bottom bar: Copyright + "LGU Calabanga Official Website" disclaimer
- ANNOTATION: "Footer is static, no interactions."

---

PAGE 2 — TOURIST MAP & DISCOVERY (second most important)

Layout: Full-viewport split — Left panel 360px fixed | Right: map fills remaining width
Mobile layout: Map full screen + bottom sheet panel (slide up)

Left panel (desktop):
- Search bar at top (full width, 44px height)
- "Filter by:" label
- Category filter: checkbox group (Nature | Beach | Cultural | Food | Shopping | Events)
- Distance slider placeholder (track + thumb)
- "Show accredited only" toggle
- Results list: scrollable, each item = location name + category badge + distance
- ANNOTATION: "Panel is fixed. Results update live as map viewport moves."

Right: Map area
- Full-bleed map placeholder with grid lines
- 6–8 pin markers: standard pins + cluster pin (circle with number)
- One pin in "selected" state: slightly larger, info card attached
- Info card on selected pin: thumbnail placeholder | name | category | star rating placeholder | "View details →"
- ANNOTATION: "Map uses Leaflet.js. Cluster pins collapse markers when zoomed out."

Mobile bottom sheet:
- Handle bar at top (drag indicator)
- Shows same filter and results content as desktop left panel
- Two states: collapsed (shows handle + first result) | expanded (full height)
- ANNOTATION: "Bottom sheet — swipe up to expand, swipe down to collapse."

---

PAGE 3 — OTOP PRODUCTS

Layout: Full page, standard scroll

Header row: "H1 — OTOP Products" | Search bar | Category dropdown | Sort by dropdown
Filter chips row: scrollable horizontal pills — All | Food | Handicraft | Textile | Agricultural | Souvenir
Active chip: filled dark | Inactive: outlined

Product grid: 3 columns desktop, 2 tablet, 1 mobile
Each product card:
- Image placeholder (4:3)
- Top-right badge: "Accredited" or "Pending"
- Product name (H3)
- Producer name (caption + verified checkmark placeholder)
- Price
- "View product →" link

Empty state (show this below the grid):
- Illustration placeholder (centered 200×200px box)
- "No products found" — H3
- "Try adjusting your filters" — body text
- "Clear filters" button
ANNOTATION: "Empty state appears when no products match the active filters."

Pagination: numbered pagination bar at bottom

---

PAGE 4 — PRODUCT DETAIL

Layout: Two-column above the fold (desktop) | Single column (mobile)

Left column (60%):
- Large image hero (16:9 placeholder)
- Thumbnail strip below: 4 small image placeholders (clickable)

Right column (40%):
- Breadcrumb: Home > OTOP Products > [Product name]
- Product name (H1)
- Category badge + Accreditation badge
- Price (large, 24px)
- Short description (body)
- Producer card (outlined box): avatar placeholder | producer name | "Accredited since [year]" | "View producer profile →"
- Share row: "Share:" + icon placeholders for Facebook, Messenger, link copy
- "Save to itinerary" button (outlined, full width)

Below the fold — full width:
- "Full description" section (body text placeholder)
- "Related products" — horizontal scroll row of 4 cards (same format as OTOP grid cards)

ANNOTATION: "Product detail pulls data from /api/products/:id. Producer card links to accreditation record."

---

PAGE 5 — EVENTS & PROMOTIONS

Header: "H1 — Events & Promotions" | Month/year navigation arrows | "List view / Calendar view" toggle

Featured event banner (full-width, 320px height):
- Large image placeholder
- Left-aligned overlay: Event name (H1) | Date | Location | "Learn more" CTA
ANNOTATION: "Featured event is manually pinned by Tourism Staff."

Event card grid: 2 columns desktop, 1 mobile
Each card:
- Image placeholder (16:9)
- Date badge (top-left corner overlay)
- Event name (H3)
- Location + category pills
- Short description
- "View event →" link

---

PAGE 6 — VIRTUAL MUSEUM

Header: "H1 — Calabanga Cultural Museum" | subtitle body text

Hero: Full-width banner placeholder (cinematic 21:9 ratio)

Artifact grid: 3 columns desktop, 2 tablet, 1 mobile
Each artifact card:
- Square image placeholder
- Artifact name (H3)
- Era/period badge
- Short description (2 lines, truncated)
- "Explore →" link

Artifact detail modal (show as overlay state on same page):
- Modal container: centered, 800px wide, 90vh height
- Left: Large image placeholder (square)
- Right: Artifact name (H1) | Period | Full description | Audio guide placeholder (play button + waveform placeholder)
- Close button top-right (×)
ANNOTATION: "Modal opens on card click. Audio guide is a future feature — show as disabled state."

---

EXPORT REQUIREMENTS:
- Deliver frames for all 6 pages at desktop (1280px) and mobile (375px) simultaneously
- Each section must have a sticky annotation label
- Organize frames in Figma pages: [Page name] Desktop | [Page name] Mobile
- Include a "Component notes" frame listing all reusable components identified
- Use auto-layout on all card components so spacing is demonstrably consistent