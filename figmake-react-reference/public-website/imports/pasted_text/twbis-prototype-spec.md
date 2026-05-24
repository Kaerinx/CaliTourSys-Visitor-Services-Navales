You are building a fully interactive high-fidelity prototype for TWBIS 
(Tourism Web-Based Information System) for LGU Calabanga. Use all components, 
colors, and typography from the high-fidelity mockup frames already completed.

This prototype covers the PUBLIC tourist-facing website only.
Priority order: Tourist discovery journey > OTOP browsing > Events > Museum > Auth.

---

INTERACTION DESIGN PRINCIPLES:
- Transition default: "Smart animate" between frames, 300ms ease-out
- Overlay/modal: fade in 200ms, backdrop fades to rgba(0,0,0,0.6)
- Bottom sheet (mobile): slide up 300ms ease-out spring
- Page navigation: dissolve 250ms (not slide — this is a website, not an app)
- Hover states: all interactive elements must have hover variants defined
- Touch targets: minimum 44×44px for all mobile interactive elements
- Scroll behavior: vertical scroll on all page frames (overflow: scroll)

---

COMPONENT INTERACTION STATES (define as variants first):

For each component, create variants for:
Default | Hover | Active/Pressed | Disabled | Loading | Error

Priority components to variant-build:
1. Primary button — 5 states
2. Product card — Default, Hover (border + lift), Skeleton loading
3. Map pin — Default, Hover, Selected, Cluster
4. Location info card — Hidden, Visible (entrance: fade + Y offset)
5. Filter chip — Default, Active, Hover
6. Bottom sheet — Collapsed, Expanded (mobile only)
7. Accreditation badge — Accredited, Pending, Expired

---

PROTOTYPE FLOWS (wire every click):

FLOW 1 — CORE TOURIST DISCOVERY (highest priority)
This is the primary value flow. Every interaction must be wired.

Step 1: User lands on Home page (desktop)
→ Navbar: all links clickable to correct pages
→ Hero CTA "Explore the map" → navigates to /map page (dissolve)
→ Hero ghost "Learn more" → smooth scroll to Featured promotions section

Step 2: Quick category tiles on Home
→ Click "Nature" tile → navigates to /map page with Nature filter pre-applied
→ ANNOTATION: "In dev, this passes ?category=nature query param to /map"

Step 3: Map & Discovery page
→ Category checkboxes: clicking each checkbox updates the results list below it
   (use component swap to show filtered state vs default state)
→ Results list items: hover state shows highlighted background
→ Click a result list item → map pin for that location switches to Selected state
   AND location info card appears above the pin
→ Location info card: "View details →" link → overlay opens (location detail overlay)
→ "Accredited only" toggle: result list swaps to accredited-only variant

Step 4: Location detail overlay (not a new page — overlay on map)
→ Overlay: 600px wide right panel slides in from right (300ms)
→ Contains: hero image | name | category | description | hours | "Get directions" button | "Save to itinerary" button
→ "Get directions" → opens native maps (external link, show link preview tooltip)
→ "Save to itinerary" → toast notification appears (success state, bottom-right)
→ Close (×) → panel slides back out right

MOBILE version of Flow 1:
→ Map fills full screen
→ Tap any pin → bottom sheet transitions from Collapsed to Expanded (show both states)
→ Expanded bottom sheet shows location detail content
→ Swipe down gesture on handle → bottom sheet returns to Collapsed
→ "View details" inside bottom sheet → full-screen location detail page (dissolve)

---

FLOW 2 — OTOP PRODUCT BROWSING

Step 1: From Home → click "View all promotions →" OR nav → "OTOP"
→ Navigates to OTOP Products page (dissolve 250ms)

Step 2: OTOP Products page
→ Category filter chips: clicking each chip swaps the product grid to a filtered variant
   (show at least 2 variants: All products grid | Food-only grid)
→ Search bar: clicking shows keyboard focus state (active border #1B4332)
→ Product card hover: show hover variant (border change + Y lift)

Step 3: Click a product card
→ Navigates to Product Detail page (dissolve)
→ Thumbnail strip: clicking each thumbnail swaps the hero image (component swap)
→ "Save to itinerary" button: click → shows loading state (spinner inside button) 
   → 800ms delay → success toast notification
→ "Save to itinerary" after logged in → shows saved state (button changes to "Saved ✓")
→ "Contact producer" → overlay modal appears (contact form)

Step 4: Contact form modal
→ Fade in 200ms, backdrop darkens
→ Form: Name field | Email field | Message textarea | "Send inquiry" primary button | "Cancel" link
→ "Send inquiry" → loading state → success toast → modal closes (fade out)
→ Click backdrop or × → modal closes
→ ANNOTATION: "In dev, form submits to POST /api/visitors/inquiries"

---

FLOW 3 — EVENTS & PROMOTIONS

Step 1: From Home events strip → click any event card
→ Navigates to Events page (dissolve), scrolled to that event's card (anchor)

Step 2: Events page
→ Month navigation arrows: click → swaps event grid to different month variant
→ Featured banner "Learn more" → overlay modal with full event details
→ Event card "View event →" → same event detail overlay

Event detail overlay:
→ 700px centered modal, fade in
→ Hero image | Date | Location | Full description | "Add to calendar" button (external link) | Close (×)

---

FLOW 4 — VIRTUAL MUSEUM

Step 1: Nav → Museum → navigates to Museum page (dissolve)

Step 2: Museum page
→ Artifact card "Explore →" → artifact detail modal opens (fade in, backdrop)
→ Modal: left image | right content
→ Thumbnail strip inside modal: click → swaps main image
→ "Audio guide" button (disabled state) → hover shows tooltip "Coming soon in next update"
→ Close (×) → modal fades out

---

FLOW 5 — USER AUTHENTICATION

Step 1: Nav → "Login" button → Login modal appears (fade in, centered)

Login modal:
→ Email field | Password field | "Log in" primary button | "Forgot password?" link | "Register" link
→ "Log in" clicked → loading state on button (spinner)
→ Success: modal fades out → navbar updates: "Login" button replaced by avatar circle + dropdown
→ Error: form shows error state (red border on fields + error toast)
→ "Register" link → modal content swaps to registration form (not a new modal — swap content)
→ Click backdrop → modal closes

Registration form (inside same modal):
→ Name | Email | Password | Confirm password | "Create account" button | "Back to login" link
→ "Create account" → loading → success toast → modal closes → navbar shows avatar

---

MOBILE-SPECIFIC INTERACTIONS (375px frames):

For each page, show these mobile-specific states:
1. Home: tap hamburger → full-screen nav drawer slides in from right
2. Home: category tile horizontal scroll — show swipe affordance (partial right tile visible)
3. Map: bottom sheet collapsed → tap → expanded state
4. OTOP: filter chips horizontal scroll
5. Product detail: single column layout, thumbnail strip becomes horizontal scroll
6. Museum: artifact modal becomes full-screen page (not a modal on mobile)

---

LOADING STATES (wire these to specific interactions):

Show skeleton loading state for:
- OTOP Products grid: triggered when category filter chip is clicked
  → Show skeleton grid frame (1 frame with 6 skeleton cards)
  → 800ms delay → swap to loaded products grid
- Map results list: triggered when filter checkbox changes
  → Show skeleton list items (3–4 items)
  → 600ms delay → swap to results list

---

PROTOTYPE SETTINGS:
- Device: Custom (1280×800) for desktop flows, iPhone 14 (390×844) for mobile flows
- Prototype start point: 01.Home.Desktop
- Flow 1 name: "Tourist discovery — desktop"
- Flow 2 name: "OTOP browsing — desktop"
- Flow 3 name: "Events — desktop"
- Flow 4 name: "Museum — desktop"
- Flow 5 name: "Authentication — desktop"
- Flow 6 name: "Full mobile journey" (covers Flows 1–3 on mobile)
- Background: #F2F0EB (matches page background color)

---

ANNOTATION LAYER (use Figma annotation plugin or sticky notes):
Add annotations to these specific interactions:
- Map filter → results update: "Live API call to GET /api/locations?category=X"
- Save to itinerary: "Requires auth — redirect to login modal if not logged in"
- Contact form submit: "POST /api/visitors/inquiries with email notification"
- Accreditation badge: "Pulled from /api/accreditation/status/:businessId"
- Bottom sheet on mobile: "Uses Leaflet.js + custom sheet component in Vue"

---

HANDOFF NOTES (add to each page frame):
Format each frame description with:
- Route: /path
- API endpoints used: GET /api/...
- Auth required: Yes/No
- Vue component: ModuleName/PageName.vue