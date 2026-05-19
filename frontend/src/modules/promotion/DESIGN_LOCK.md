# Promotion Module Design Lock

This document is the visual contract for the Vue implementation of the Promotion/TWBIS public-facing tourism UI. It is based only on `figmake-react-reference/` and `reference-screenshots/`.

Do not redesign, reinterpret, or introduce a new visual style during implementation.

## 1. Colors

Use the Figmake/React color system exactly.

| Token | Hex | Usage |
| --- | --- | --- |
| Primary | `#1B4332` | Logo mark, primary buttons, active nav underline, selected controls, dark footer |
| Primary Hover | `#14532D` | Primary button hover, footer bottom bar |
| Primary Light | `#D8F3DC` | Selected map result, soft active backgrounds, hover fills |
| Accent | `#B5451B` | Terra-cotta highlights, selected pins, warm event/product gradients |
| Accent Light | `#FFE8DE` | Category pill backgrounds |
| Accent Text | `#7A2D0E` | Category pill text |
| Gold | `#D4AC0D` | Accreditation dot/border, ratings only |
| Gold Background | `#FFF9E6` | Accreditation badge background, featured badge background |
| Gold Text | `#7D5A00` | Accreditation and featured badge text |
| Neutral Dark | `#1A1A1A` | Main text and headings |
| Neutral Mid | `#5C5C5C` | Secondary text, captions, descriptions |
| Neutral Light | `#F2F0EB` | Main warm page background |
| Border Soft | `#E8E4DC` | Card borders, dividers, navbar border |
| Border Dashed | `#BDBDBD` | Empty state dashed illustration border |
| White | `#FFFFFF` | Card surfaces, navbar, footer text |
| Success | `#1B7A4A` | Verified dot, success state |
| Danger | `#C0392B` | Error/destructive state |
| Beach Blue | `#1565C0` | Beach/map category marker |
| Cultural Brown | `#7B341E` | Cultural/map category marker |
| Museum Brown | `#5C3318` | Heritage/artifact accent |
| Warm Orange | `#D4711B` | Product/artifact accent |

Visual surfaces must alternate the same way as screenshots:

- Navbar: white.
- Home hero: deep green gradient/photo treatment.
- Main page background: `#F2F0EB`.
- Card surfaces: white.
- Footer: `#1B4332`, bottom bar `#14532D`.

## 2. Font Family And Typography Scale

Fonts from the reference:

- Display/headings: `"Plus Jakarta Sans", system-ui, sans-serif`
- Body/UI text: `"Inter", system-ui, sans-serif`

Typography rules:

| Element | Font | Weight | Size | Line Height | Notes |
| --- | --- | --- | --- | --- | --- |
| Hero H1 | Plus Jakarta Sans | 700 | `56px` | `1.05` | White on hero sections |
| Page H1 | Plus Jakarta Sans | 700 | `44px` | `1.2` | Products, events, main page headings |
| Section H2 | Plus Jakarta Sans | 600 | `32px` | `1.2` | Section titles |
| Card H3 | Plus Jakarta Sans | 600 | `20px` default, `16px` product card | `1.2` | Product card names use 16px |
| Body | Inter | 400 | `16px` | `1.6` | Minimum body size |
| Description | Inter | 400 | `14px`-`16px` | `1.6` | Secondary text uses `#5C5C5C` |
| Caption | Inter | 500 | `12px` | normal | Uppercase, `0.05em` tracking |
| Button | Inter | 500 | `13px` or `15px` | normal | Depends on size |
| Badge | Inter | 500 | `11px`-`12px` | normal | Pill text |

Do not use negative letter spacing in the Vue implementation. Preserve the visual scale shown in screenshots.

## 3. Button Styles

All buttons use:

- Border radius: `8px`
- Font: Inter Medium
- Active state: `scale(0.98)`
- Disabled state: `opacity: 0.4`, disabled cursor
- Icon gap: `8px`

Button variants:

| Variant | Height | Padding | Background | Text | Border | Hover |
| --- | --- | --- | --- | --- | --- | --- |
| Primary | `48px` | `0 24px` | `#1B4332` | white | none | `#14532D` |
| Primary Small | `36px` | `0 16px` | `#1B4332` | white | none | `#14532D` |
| Ghost | `48px` | `0 24px` | transparent | `#1B4332` | `1.5px solid #1B4332` | `#D8F3DC` fill |
| Ghost Small | `36px` | `0 16px` | transparent | `#1B4332` | `1.5px solid #1B4332` | `#D8F3DC` fill |
| White | `48px` | `0 24px` | white | `#1B4332` | none | `#F2F0EB` |
| White Ghost | `48px` | `0 24px` | transparent | white | `1.5px solid white` | white at 10% opacity |

Button labels must remain as shown in the screenshots/reference, such as:

- `Start exploring`
- `Shop OTOP`
- `Open full map`
- `View product ->`
- `View event ->`
- `Contact producer`
- `Save to itinerary`
- `Login`

## 4. Card Styles

General card rules:

- Background: white.
- Border: `1px solid #E8E4DC`.
- Hover border: `#1B4332`.
- Hover lift: translate upward by approximately `2px`.
- No decorative shadows on normal cards.
- Cards use flat borders, not elevated panels.

Product card:

- Radius: `12px`.
- Image area: `aspect-ratio: 4 / 3`.
- Image treatment: gradient placeholder based on product accent color with subtle radial overlays.
- Accreditation badge: top-right, `8px` from edges.
- Content padding: `16px`.
- Category badge above title.
- Product name: 16px Plus Jakarta Sans SemiBold, line-clamped to 2 lines.
- Producer: 13px Inter, `#5C5C5C`, with green verified dot.
- Price: 15px Inter Medium, `#1A1A1A`.
- CTA: 13px, `#1B4332`.

Event card:

- Radius: `12px`.
- Image area: `aspect-ratio: 16 / 9`.
- Date badge: top-left, dark green background, large day number, small uppercase month.
- Content padding: `20px`.
- Category pill, title, location row, description, CTA.

Artifact card:

- Radius: `12px`.
- Square image area.
- Warm gradient placeholder using artifact accent.
- Content padding: `20px`.
- Era badge uses gold tone.

Map info card:

- Width: `280px`.
- Radius: `12px`.
- Border: `1px solid #E8E4DC`.
- Thumbnail height: `140px`.
- Entrance: fade plus slight upward movement.

Empty state:

- White card/container.
- Dashed placeholder box: `160px x 160px`, border `2px dashed #BDBDBD`.
- Centered text and ghost clear button.

## 5. Border Radius

| Element | Radius |
| --- | --- |
| Buttons | `8px` |
| Small controls/input fields | `8px` |
| Cards | `12px` |
| Map popup/info cards | `12px` |
| Navbar logo mark | `10px` |
| Modal | `16px` |
| Large floating quick-category strip | `16px` |
| Badges/pills/chips | `999px` |
| Avatar/profile circles | `999px` |

Do not increase radii into a new rounded style. Preserve the restrained radius from screenshots.

## 6. Shadows

The design is intentionally flat.

Allowed shadows:

- Fixed navbar scrolled state only: `0 2px 8px rgba(0,0,0,0.08)`.
- Home quick-category strip: subtle screenshot/reference shadow, approximately `0 2px 24px rgba(0,0,0,0.06)`.
- Map pins may use drop-shadow for readability.
- Modal overlays may use strong shadow only where the reference uses modal/drawer depth.

Do not add shadows to standard cards, page sections, buttons, or panels unless present in the reference.

## 7. Layout Spacing

Use an 8px base grid.

Approved spacing values:

- `4px`
- `8px`
- `12px`
- `16px`
- `20px` where present in cards/gaps
- `24px`
- `32px`
- `40px`
- `48px`
- `64px`
- `80px`
- `96px`
- `128px`

Primary desktop content width:

- Max width: `1280px`.
- Horizontal padding: `24px` on smaller desktop/tablet, `40px` on large screens.

Common section spacing:

- Home content sections: roughly `80px` top/bottom.
- Page headers: about `40px` vertical padding.
- Product grid gap: `20px`.
- Event/artifact grid gap: `24px`.
- Navbar offset: fixed `64px` desktop.

## 8. Header, Sidebar, And Topbar Structure

Global navbar:

- Fixed at top.
- Height: `64px`.
- Background: white.
- Bottom border: `1px solid #E8E4DC`.
- Content max width: `1280px`.
- Left: logo mark with `T`, text `TWBIS`, subtitle `Calabanga Tourism`.
- Center desktop nav links:
  - `Home`
  - `Map`
  - `OTOP`
  - `Events`
  - `Museum`
  - `Design`
- Active nav state: text `#1B4332` with 2px underline.
- Right: search icon, login ghost button.

Mobile navbar:

- Compact logo.
- Search icon and hamburger.
- Full-screen white drawer.
- Stacked links with 48px touch targets.
- Active link uses `#D8F3DC` background and `#1B4332` text.

Map/discovery page:

- Uses full viewport height below navbar.
- Left sidebar width: `360px`.
- Sidebar background: white.
- Right border: `1px solid #E8E4DC`.
- Map fills remaining width.
- Footer is hidden on the map page.

## 9. Page Sections In Exact Order

### Home

1. Fixed navbar.
2. Full hero with deep green landscape-gradient treatment.
3. Floating quick-category strip overlapping bottom of hero.
4. `What's On` featured promotions, white background, three product cards.
5. `Explore Calabanga` map preview, warm off-white background.
6. `Calabanga's Finest` OTOP highlights, white background.
7. `Upcoming Festivals & Events`, warm off-white background.
8. Accreditation/trust strip, white background.
9. Footer.

### Map / Discovery

1. Fixed navbar.
2. Full-height split layout.
3. Left discovery sidebar:
   - Title.
   - Search.
   - Filter results.
   - Category checkboxes.
   - LGU accredited toggle.
   - Result count.
   - Scrollable result list.
4. Map area:
   - Location label top-left.
   - Layers and Browse OTOP buttons top-right.
   - Category-coded pins.
   - Cluster marker.
   - Selected location popup.
   - Legend bottom-left.
5. No footer.

### OTOP Products / Promotion List

1. Fixed navbar.
2. White page header with caption, `OTOP Products`, subtitle, search, sort, filters.
3. Sticky chip row below header.
4. Warm off-white product grid section.
5. Result count.
6. 3-column product grid with 9 products.
7. Pagination.
8. Footer.

### Product Detail / Promotion Detail

1. Fixed navbar.
2. Breadcrumb bar.
3. Warm off-white detail area.
4. Two-column layout:
   - Left: large image gallery and thumbnails.
   - Right: sticky product detail card and producer card.
5. About this product section below gallery.
6. Related products section.
7. Contact producer modal when opened.
8. Footer.

### Events & Promotions

1. Fixed navbar.
2. White page header with caption, title, subtitle, list/calendar segmented control.
3. Warm off-white page body.
4. Featured event banner.
5. List view event card grid.
6. Calendar view alternative when selected.
7. Event detail modal when opened.
8. Footer.

### Virtual Museum

1. Fixed navbar.
2. Cinematic warm gradient hero, 21:9 treatment.
3. Collection section header and filter chips.
4. 3-column artifact grid.
5. Artifact detail modal when opened.
6. Footer.

### Design System Reference

If implemented, it must mirror `ComponentNotes.tsx` and remain a reference page, not a redesigned dashboard.

## 10. Assets, Images, And Icons That Must Be Reused

Reference assets:

- `figmake-react-reference/imports/image.png`
- `figmake-react-reference/imports/image-1.png`
- `figmake-react-reference/imports/image-2.png`
- `reference-screenshots/01-home.png`
- `reference-screenshots/02-map-discovery.png`
- `reference-screenshots/03-products.png`
- `reference-screenshots/04-event.png`
- `reference-screenshots/05-museum.png`

The React design primarily uses gradient placeholders instead of real photos. Preserve those visual treatments unless the user explicitly provides real tourism imagery.

Required icon style:

- Use Lucide-style outline icons.
- Icon sizes are usually `16px`, `20px`, or `24px`.
- Icons must visually match the React reference icons:
  - Search
  - Menu
  - X/close
  - User
  - LogOut
  - Leaf
  - Landmark
  - UtensilsCrossed
  - Calendar / CalendarDays / CalendarPlus
  - MapPin
  - Compass
  - ArrowRight / ChevronRight / ChevronDown
  - Filter / SlidersHorizontal
  - Star
  - Bookmark
  - Map
  - Facebook
  - Instagram
  - Youtube
  - Mail
  - Phone
  - Play
  - Volume2

If using a Vue icon package, choose the Vue equivalent of Lucide icons. Do not mix in another icon visual style.

## 11. Responsive Behavior

Desktop:

- Max content width: `1280px`.
- Navbar shows centered nav links.
- Home product grids use 3 or 4 columns as shown.
- OTOP products use 3 columns.
- Events grid uses 2 columns on the events page.
- Museum grid uses 3 columns.
- Map uses fixed left sidebar and full map area.

Tablet:

- Product/event/artifact grids reduce columns naturally.
- Header controls wrap without changing visual style.
- Horizontal chip rows remain scrollable where needed.

Mobile:

- Navbar collapses to logo, search icon, hamburger.
- Drawer is full-screen white with stacked links.
- Home quick-category tiles become 2-column or horizontally scrollable as needed while preserving tile styling.
- Product grids become 1 column or 2 compact columns depending on available width and visual match.
- Product detail becomes single column; thumbnails scroll horizontally.
- Map should become full-screen map with bottom sheet behavior if implemented.
- Museum modal becomes full-screen or near full-screen.
- Touch targets must be at least `44px`.

Do not create a separate mobile visual language. Mobile must be the same design adapted to narrower width.

## 12. Things That Must NOT Be Changed

- Do not import React code into Vue.
- Do not use React components, React Router, `sonner`, `motion/react`, or shadcn React components directly.
- Do not redesign the module.
- Do not create an admin dashboard or staff-facing UI.
- Do not replace the TWBIS visual identity with generic government portal styling.
- Do not change the main palette.
- Do not change the typography families or scale.
- Do not introduce oversized rounded cards, glassmorphism, decorative blobs, or new gradients beyond the reference treatments.
- Do not add shadows to regular cards.
- Do not change the order of page sections.
- Do not replace the gradient placeholder image style with unrelated stock imagery unless explicitly requested.
- Do not rename visible navigation labels unless needed by an existing route constraint.
- Do not remove the accreditation badge, verified dot, category badges, map pins, or footer structure.
- Do not make the map page scroll like a normal document on desktop; it is a full-viewport split layout.
- Do not implement backend-only or admin-only features in this public-facing module.
- Do not alter files outside the approved implementation scope without asking first.

Implementation must match the screenshots first, and the React/Figmake source second where behavior details are needed.
