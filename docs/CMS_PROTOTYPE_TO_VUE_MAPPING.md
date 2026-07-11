# CMS Prototype to Vue Mapping

Project: CaliTourSys / CallTourSys  
Phase: CMS Design Reference Analysis and Design Lock  
Scope: Tourism Staff CMS only

This mapping translates the approved Figmake/React CMS prototype into future Vue pages and reusable Vue components. It is a planning document only. Do not paste React code into Vue.

## Route Mapping

| Prototype Screen/Component | Future Vue Component/Page |
|---|---|
| App shell with fixed sidebar and main content | `frontend/src/modules/cms/layouts/CmsLayout.vue` |
| Desktop sidebar navigation | `frontend/src/modules/cms/components/CmsSidebar.vue` |
| Mobile CMS header | `frontend/src/modules/cms/components/CmsMobileHeader.vue` |
| Mobile navigation drawer | `frontend/src/modules/cms/components/CmsMobileDrawer.vue` |
| Mobile bottom navigation | `frontend/src/modules/cms/components/CmsBottomNav.vue` |
| Dashboard Home | `frontend/src/modules/cms/views/CmsDashboardView.vue` mapped to `/cms/dashboard` |
| Welcome dashboard header | `frontend/src/modules/cms/components/CmsDashboardHeader.vue` |
| Dashboard stat cards | `frontend/src/modules/cms/components/CmsMetricCard.vue` |
| Quick Access panel | `frontend/src/modules/cms/components/CmsQuickAccessPanel.vue` |
| Quick Access item | `frontend/src/modules/cms/components/CmsQuickActionCard.vue` |
| Recent Activity panel | `frontend/src/modules/cms/components/CmsRecentActivityPanel.vue` |
| System Overview section | `frontend/src/modules/cms/components/CmsSystemOverview.vue` |
| Login screen, future planned | `frontend/src/modules/cms/views/CmsLoginView.vue` mapped to `/cms/login` |
| Content Management dashboard | `frontend/src/modules/cms/views/CmsContentManagementView.vue` mapped to `/cms/content-management` |
| Cultural & Heritage Content list | `frontend/src/modules/cms/views/content/CulturalContentListView.vue` |
| Cultural Content editor | `frontend/src/modules/cms/views/content/CulturalContentFormView.vue` |
| Museums & Landmarks list | `frontend/src/modules/cms/views/content/MuseumListView.vue` |
| Museum editor | `frontend/src/modules/cms/views/content/MuseumFormView.vue` |
| Tourist Spots Information list | `frontend/src/modules/cms/views/content/TouristSpotListView.vue` |
| Tourist Spot editor | `frontend/src/modules/cms/views/content/TouristSpotFormView.vue` |
| Announcements & Highlights list | `frontend/src/modules/cms/views/content/AnnouncementListView.vue` |
| Announcement editor | `frontend/src/modules/cms/views/content/AnnouncementFormView.vue` |
| OTOP Product Management catalog | `frontend/src/modules/cms/views/otop/OtopProductListView.vue` mapped under `/cms/otop-support` |
| OTOP product detail | `frontend/src/modules/cms/views/otop/OtopProductDetailView.vue` |
| Add OTOP product | `frontend/src/modules/cms/views/otop/OtopProductFormView.vue` |
| Edit OTOP product | `frontend/src/modules/cms/views/otop/OtopProductFormView.vue` |
| Manage OTOP categories | `frontend/src/modules/cms/views/otop/OtopCategoryManagementView.vue` |
| Business Directory | `frontend/src/modules/cms/views/accreditation/BusinessDirectoryView.vue` mapped under `/cms/business-accreditation` |
| New Accreditation Application | `frontend/src/modules/cms/views/accreditation/BusinessApplicationFormView.vue` |
| Business detail | `frontend/src/modules/cms/views/accreditation/BusinessDetailView.vue` |
| Edit Business | `frontend/src/modules/cms/views/accreditation/BusinessFormView.vue` |
| Manage Business Types | `frontend/src/modules/cms/views/accreditation/BusinessTypeManagementView.vue` |
| Document Upload Repository | `frontend/src/modules/cms/components/CmsDocumentRepository.vue` |
| Confirm Officer Action dialog | `frontend/src/modules/cms/components/CmsConfirmDialog.vue` |
| Product Development calendar | `frontend/src/modules/cms/views/development/EventCalendarView.vue` mapped under `/cms/product-development` |
| Event detail | `frontend/src/modules/cms/views/development/EventDetailView.vue` |
| Create Event | `frontend/src/modules/cms/views/development/EventFormView.vue` |
| Tourism Packages | `frontend/src/modules/cms/views/development/TourismPackageListView.vue` |
| Create/Edit Package | `frontend/src/modules/cms/views/development/TourismPackageFormView.vue` |
| Preview Package | `frontend/src/modules/cms/views/development/TourismPackagePreviewView.vue` |
| Resource Library | `frontend/src/modules/cms/views/development/ResourceLibraryView.vue` |
| Front Desk Dashboard | `frontend/src/modules/cms/views/visitor/VisitorServicesDashboardView.vue` mapped under `/cms/visitor-services` |
| Tourist Spots Guide | `frontend/src/modules/cms/views/visitor/VisitorTouristSpotGuideView.vue` |
| Tourist Spot Detail | `frontend/src/modules/cms/views/visitor/VisitorTouristSpotDetailView.vue` |
| Visitor Inquiry & Feedback | `frontend/src/modules/cms/views/visitor/VisitorInquiryView.vue` |
| Reports & Analytics | `frontend/src/modules/cms/views/reports/CmsReportsView.vue` mapped to `/cms/reports` |
| Visitor Arrival Trends chart | `frontend/src/modules/cms/components/charts/VisitorTrendChart.vue` |
| Business Distribution chart | `frontend/src/modules/cms/components/charts/BusinessDistributionChart.vue` |
| Heatmap report | `frontend/src/modules/cms/components/charts/VisitorHeatmap.vue` |
| Recent Reports list | `frontend/src/modules/cms/components/CmsRecentReports.vue` |

## Expected CMS Pages

| Future Route | Purpose | Primary Prototype Reference |
|---|---|---|
| `/cms/login` | Staff login and protected CMS entry | Not shown directly; derive visual style from CMS shell |
| `/cms/dashboard` | Staff overview, metrics, quick access, activity | Dashboard Home |
| `/cms/content-management` | Manage public content blocks and website records | Content Management System |
| `/cms/otop-support` | Manage OTOP products, producers, and product categories | OTOP Product Management |
| `/cms/product-development` | Manage events, tourism packages, and resources | Product Development |
| `/cms/business-accreditation` | Manage business records and accreditation display/process prep | Business Accreditation |
| `/cms/visitor-services` | Support tourist inquiries, guides, fees, and front desk references | Visitor Services |
| `/cms/reports` | View tourism operational reports and exports | Reports & Analytics |

## Shared Component Mapping

| Prototype Pattern | Future Reusable Vue Component |
|---|---|
| Page title and description with action buttons | `CmsPageHeader.vue` |
| White bordered content panel | `CmsPanel.vue` |
| Dashboard metric card | `CmsMetricCard.vue` |
| Status badge | `CmsStatusBadge.vue` |
| Search input with icon | `CmsSearchInput.vue` |
| Filter controls row | `CmsFilterBar.vue` |
| Record card in list views | `CmsRecordCard.vue` |
| Three-dot actions menu | `CmsActionMenu.vue` |
| Confirmation modal | `CmsConfirmDialog.vue` |
| Empty result state | `CmsEmptyState.vue` |
| Loading spinner state | `CmsLoadingState.vue` |
| Error alert card | `CmsErrorState.vue` |
| Form group section | `CmsFormSection.vue` |
| Text input field | `CmsTextField.vue` |
| Textarea field | `CmsTextareaField.vue` |
| Select/dropdown field | `CmsSelectField.vue` |
| File upload and document checklist | `CmsFileUpload.vue`, `CmsDocumentChecklist.vue` |
| Data table/list container | `CmsDataTable.vue` or `CmsResponsiveRecordList.vue` |
| Pagination controls | `CmsPagination.vue` |
| Toast/success message | `CmsToast.vue` or shared notification store |
| Chart card shell | `CmsChartCard.vue` |

## Design Conversion Rules

- Preserve layout, information hierarchy, and interaction patterns.
- Rebuild styles in Vue/CSS using project conventions.
- Do not use React state, JSX, Supabase functions, or prototype mock persistence.
- Replace prototype local state with Vue composables/stores and backend API services.
- Use production CMS API routes under `/api/v1/cms/...`.
- Keep authentication under `/api/v1/auth/...`.
- Keep public website routes and public APIs untouched.
- Treat mobile drawer and bottom navigation as required CMS shell behavior.
- Treat search, filters, status badges, action menus, loading states, empty states, and confirmation dialogs as required CMS patterns.

## Implementation Readiness Notes

Before CMS coding begins:

- Finalize CMS route file structure.
- Finalize CMS auth and RBAC backend contract.
- Decide whether CMS state uses Pinia stores, composables, or a hybrid.
- Define shared design tokens for CMS blue/slate style.
- Decide chart library for Vue reports.
- Decide upload strategy for media and document files.
- Add UX case study documents to `docs/ux-case-study/` if they should influence implementation details.

