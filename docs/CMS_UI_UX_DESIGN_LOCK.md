# CMS UI/UX Design Lock

Project: CaliTourSys / CallTourSys  
Phase: CMS Design Reference Analysis and Design Lock  
Scope: Tourism Staff CMS only  
Reference source: `figmake-react-reference/cms-tourism-staff/` and `reference-screenshots/cms-tourism-staff/`

This document locks the approved CMS visual and interaction direction before Vue implementation begins. The React/Figmake prototype is the official UX reference, but its source code must not be pasted into Vue. The Vue CMS should recreate the approved behavior, layout, hierarchy, and component patterns using the project's Vue architecture.

## 1. CMS Design Summary

The CMS is an operational dashboard for tourism office staff. Its design is clean, administrative, and task-oriented. The interface uses a fixed desktop sidebar, a compact dashboard header, summary metric cards, quick access module cards, recent activity, and module-specific list/detail/form workflows.

The design language is:

- Municipal and professional, not marketing-oriented.
- Card-based, but dense enough for office work.
- Sky-blue as the CMS identity color, separate from the public website's green tourism identity.
- Modular, with each major function represented as a dashboard module.
- Responsive, with a desktop sidebar and mobile drawer/bottom navigation.

## 2. Target Users

Primary users:

- Tourism Officer
- Tourism Staff
- Content Editor
- Front desk or visitor assistance staff
- Read-only staff or supervisors
- System Administrator for future CMS user management

User needs:

- Quickly see the tourism office operational status.
- Manage public website content without touching public-facing routes directly.
- Review OTOP products, businesses, events, tourist spots, museum content, and visitor information.
- Access status, counts, records, and recent actions with minimal navigation cost.
- Work comfortably on desktop, laptop, tablet, and limited mobile views.

## 3. Main Dashboard Layout

Locked layout:

- Full-height application shell.
- Fixed desktop sidebar at `w-64` equivalent width.
- Main content offset to the right of the sidebar on desktop.
- Mobile top header with brand and menu toggle.
- Mobile drawer menu for full navigation.
- Mobile bottom quick navigation for the first five major modules.
- Main content uses a constrained content width similar to `max-w-7xl`.
- Page padding should remain compact: roughly 16px mobile, 24px desktop.

Dashboard sections:

- Welcome header with date and system status.
- Four primary metric cards.
- Quick Access module panel.
- Recent Activity panel.
- System Overview panel.
- Additional summary cards for high-level totals.

## 4. Sidebar Navigation Structure

Locked desktop sidebar:

- Left fixed navigation.
- Sky-blue gradient brand header.
- Logo mark in a white rounded square.
- System name: `Calabanga Tourism`.
- Subtitle: `Management System`.
- Footer area: `Calabanga Tourism Office` and version label.

Locked navigation order:

1. Dashboard
2. Content Management
3. OTOP Support
4. Product Development
5. Business Accreditation
6. Visitor Services
7. Reports

Active state:

- Light sky-blue background.
- Sky-blue text and icon.
- Left accent border.
- Slight shadow.

Inactive state:

- Slate text.
- Subtle hover state using sky-blue tint.

## 5. Topbar/Header Structure

Desktop dashboard header:

- Horizontal sky-to-blue gradient band.
- Greeting: `Welcome, Tourism Officer`.
- Current date below the greeting.
- System status pill on the right.

Mobile header:

- Sticky top header.
- Brand mark and title.
- Menu toggle button.
- Sky-blue gradient background.

Module page headers:

- Page title.
- Short functional description.
- Action buttons aligned right on desktop.
- Stacked header actions on small screens when needed.

## 6. Dashboard Cards and Metrics

Locked dashboard metric cards:

- Four cards in a responsive grid.
- Metrics:
  - Visitor Arrivals
  - Active Businesses
  - OTOP Products
  - Upcoming Events
- Each card has:
  - Icon tile
  - Large numeric value
  - Small label
  - Trend/status pill when available
- Cards use white background, slate border, rounded corners, and subtle shadow.

System overview cards:

- System Health
- Active Records
- Recent Activities
- Events Planned

The CMS should not use public website statistics directly unless the backend explicitly provides CMS-safe metrics.

## 7. Quick Access Modules

Locked quick access cards:

- Displayed as a white panel with module count.
- Responsive two-column grid on medium/desktop.
- Each quick access item includes:
  - Colored icon tile
  - Module title
  - Short description
  - Arrow affordance
- The whole card is clickable.

Quick access modules:

- Content Management: update website content.
- OTOP Support: manage products and producers.
- Business Accreditation: process applications.
- Events & Products: plan tourism activities.
- Visitor Services: assist tourists and inquiries.

## 8. Recent Activity Panel

Locked behavior:

- Right-side panel on dashboard desktop.
- Shows recent actions with status icons.
- Empty state displays a calm informational icon and `No recent activities`.
- Includes a refresh action.
- Activity entries should show action, detail, module, time ago, and status.

Future Vue implementation should use CMS audit logs once available.

## 9. System Overview Section

Locked purpose:

- Summarize system-level operational state.
- Use compact colored summary tiles.
- Avoid overloading this panel with charts.
- Keep it below quick access to preserve dashboard scanning order.

## 10. Color Palette

Primary CMS identity:

- Sky blue: `#0EA5E9` / Tailwind `sky-500`
- Deeper sky: `#0284C7` / Tailwind `sky-600`
- Blue action: `#2563EB` / Tailwind `blue-600`

Neutral system colors:

- Page background: `#F8FAFC` / slate-50
- Card background: `#FFFFFF`
- Border: `#E2E8F0` / slate-200
- Primary text: slate-900
- Secondary text: slate-600
- Muted text: slate-500

Module/status colors:

- Content Management: indigo/purple accent
- OTOP Support: purple accent
- Business Accreditation: green accent
- Product Development / Events: orange accent
- Visitor Services: blue accent
- Reports: blue/indigo chart accent
- Success/published/approved: green
- Pending/review/warning: amber/orange
- Draft/neutral: slate
- Rejected/destructive: red

Do not convert the CMS to the public website's green-dominant theme. The CMS must retain its sky-blue administrative identity.

## 11. Typography Style

Locked typography direction:

- Use a clean system sans-serif stack unless the app already standardizes another font.
- Base font size: 16px.
- H1/page hero inside CMS: compact, not public-site hero scale.
- Dashboard header title: around 24px on desktop.
- Module titles: 20px to 24px.
- Card titles: 16px to 18px.
- Supporting text: 13px to 14px.
- Labels: medium weight, readable, close to inputs.

Avoid oversized marketing typography inside the CMS.

## 12. Button Styles

Button categories:

- Primary action: solid blue or module color, white text, rounded 8px to 10px.
- Secondary action: white background, slate border, slate/blue text.
- Destructive action: red background or red text in menu, only for delete/reject.
- Icon action: square or compact button with visible hover state.
- Ghost action: transparent background with hover tint.

Locked behavior:

- Buttons should show loading state when submitting.
- Disabled states must reduce opacity and prevent interaction.
- Destructive actions require confirmation.
- Icon-only buttons need accessible labels.

## 13. Card Styles

Locked card style:

- White surface.
- Slate border.
- Rounded corners, typically 8px to 12px.
- Subtle `shadow-sm`; slightly stronger shadow on hover for clickable cards.
- Internal spacing around 16px to 24px.
- Use cards for repeated records, dashboard metrics, module shortcuts, and bounded panels.

Do not nest cards deeply. Use sections, lists, or tables when content becomes dense.

## 14. Form Style

Locked form conventions:

- Field labels above inputs.
- Inputs use white or very light slate background.
- Border is slate-300.
- Focus ring uses blue/sky.
- Required fields should be clearly marked.
- Textareas should have stable height.
- Forms should group related fields under clear section headings.
- Long forms should use card sections and clear footer actions.

Expected form types:

- Content editor forms.
- Product add/edit forms.
- Business application and edit forms.
- Event creation forms.
- Tourism package forms.
- Inquiry/visitor assistance forms.

## 15. Modal/Dialog Style

Locked dialog behavior:

- Use centered modal overlay for confirmations and document previews.
- Confirmation dialogs should show:
  - Clear title
  - Affected record name
  - Consequence text
  - Cancel button
  - Confirm button
- Destructive confirmation buttons must use red styling.
- Modal close controls must be keyboard accessible.
- Dialogs must trap focus in final implementation.

## 16. Table/List Style

Locked list/table patterns:

- Search bar appears above record lists.
- Filters appear below or beside search depending on width.
- Record cards are acceptable for responsive admin lists.
- Each record shows title/name, key metadata, status badge, and action menu.
- Action menu uses `View`, `Edit`, status changes, and delete/archive where appropriate.
- Empty state should appear after filters produce no results.

For large CMS datasets, Vue implementation may use tables on desktop and card lists on mobile.

## 17. Empty States

Locked empty state style:

- Centered icon or simple symbol.
- Short message.
- Optional recovery action.
- Calm tone, not error-like.

Examples:

- `No recent activities`
- `No products found matching your criteria.`
- `No businesses found matching your criteria.`
- `No business types yet. Add your first type above.`

## 18. Loading States

Locked loading behavior:

- Full module loading state uses centered spinner and short text.
- Button loading uses inline spinner.
- Avoid layout jumping when possible.
- Future implementation may use skeleton rows/cards for lists.

Examples:

- `Loading dashboard...`
- `Loading OTOP products...`
- `Loading business directory...`

## 19. Error States

Locked error behavior:

- Error messages should be user-friendly.
- Do not expose backend stack traces or raw SQL errors.
- Use alert cards or inline field errors.
- Retry/refresh actions should be available for recoverable API failures.
- Confirmation and destructive actions should fail gracefully without losing the user's context.

## 20. Responsive Behavior

Desktop:

- Fixed sidebar remains visible.
- Main content uses multi-column dashboard layouts.
- Dashboard metrics use four columns.
- Quick access and recent activity sit side by side.

Tablet:

- Sidebar may remain if enough width, otherwise switch to drawer.
- Cards reduce to two columns.
- Action buttons may wrap.

Mobile:

- Sticky top header.
- Drawer for full navigation.
- Bottom navigation for core modules.
- Cards stack vertically.
- List filters become horizontally scrollable or stacked.
- Tables should become cards or scroll containers.
- Main content needs bottom padding to avoid the bottom navigation.

## 21. Accessibility Notes

Required accessibility rules for Vue conversion:

- Use semantic `button`, `nav`, `main`, `header`, `aside`, `section`, and form elements.
- Preserve visible focus states.
- Icon-only buttons need `aria-label`.
- Sidebar active item should expose current page state where practical.
- Mobile drawer must be keyboard reachable and dismissible.
- Dialogs should trap focus and restore focus on close.
- Form fields need programmatic labels.
- Status badges must not rely on color alone.
- Charts need text summaries.
- Loading and error states should be announced where practical.
- Avoid non-button clickable `div` elements.

## 22. UX Case Study Insights

The folder `docs/ux-case-study/` was not found in the workspace during this analysis. No case study findings were copied or invented.

Locked inference from the professor-checked prototype:

- Staff need fast module switching.
- Staff need dashboard-level status before entering records.
- Content and operational tasks should be separated by module.
- Search, filter, status badges, and action menus are core patterns.
- Mobile support matters, but the primary working surface remains desktop/laptop.

If UX case study files are added later, this document should be updated with direct findings before CMS coding begins.

## 23. Reusable Vue Components

The Vue CMS should create reusable components instead of duplicating layouts in every page.

Recommended reusable components:

- `CmsShell`
- `CmsSidebar`
- `CmsMobileHeader`
- `CmsBottomNav`
- `CmsPageHeader`
- `CmsMetricCard`
- `CmsQuickActionCard`
- `CmsActivityList`
- `CmsStatusBadge`
- `CmsRecordCard`
- `CmsSearchInput`
- `CmsFilterBar`
- `CmsActionMenu`
- `CmsConfirmDialog`
- `CmsFormSection`
- `CmsTextField`
- `CmsTextareaField`
- `CmsSelectField`
- `CmsSubmitBar`
- `CmsEmptyState`
- `CmsLoadingState`
- `CmsErrorState`
- `CmsTable`
- `CmsPagination`
- `CmsChartCard`
- `CmsFileUpload`

## 24. Pages/Modules Shown in the Prototype

Observed prototype modules:

- Dashboard
- Content Management
- OTOP Support
- Product Development
- Business Accreditation
- Visitor Services
- Reports

Observed sub-screens:

- Content Management dashboard
- Cultural & Heritage Content list/editor
- Museums & Landmarks list/editor
- Tourist Spots Information list/editor
- Announcements & Highlights list/editor
- OTOP Product Management catalog
- OTOP product detail
- Add/Edit OTOP product
- Manage OTOP product categories
- Business Directory
- New Accreditation Application
- Manage Business Types
- Business detail/edit
- Document Upload Repository
- Product Development calendar
- Event detail
- Create Event
- Tourism Packages
- Resource Library
- Create/Preview Package
- Front Desk Dashboard
- Tourist Spots Guide
- Tourist Spot Detail
- Visitor Inquiry & Feedback
- Reports & Analytics

Expected future route pages:

- `/cms/login`
- `/cms/dashboard`
- `/cms/content-management`
- `/cms/otop-support`
- `/cms/product-development`
- `/cms/business-accreditation`
- `/cms/visitor-services`
- `/cms/reports`

## 25. What Must Not Be Changed When Converting to Vue

Do not change:

- The core sidebar navigation order.
- The sky-blue CMS identity.
- The dashboard summary-first information architecture.
- The quick access module pattern.
- The recent activity panel pattern.
- The white card, slate border, compact admin style.
- The status badge system.
- The search/filter/action-menu pattern for record lists.
- The confirmation dialog pattern for destructive or officer actions.
- The mobile header, drawer, and bottom quick navigation concept.
- The separation between public website and CMS routes.
- The public website design, routes, or API behavior.

Do not copy:

- React component code.
- Supabase-specific client or function patterns.
- Prototype mock data as production data.
- Prototype localStorage data storage for CMS records.

Vue implementation should preserve the approved UX while using the production Node/Express API, PostgreSQL database, and Vue module architecture.

