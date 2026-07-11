# CMS Media Page Audit Report

## 1. Executive Summary

The CMS Media page is ready for frontend implementation, with one minor backend behavior to account for during UX design: the current backend supports media metadata records only, not binary file upload.

The backend API, permissions, validators, pagination envelope, status values, storage-provider filtering, and audit logging are already present. The frontend CMS shell exposes a permission-aware Media sidebar item, but the actual `/cms/media` route, view, API service methods, form, media preview, and page workflow are not implemented yet.

Recommended readiness decision: Ready for implementation.

## 2. Current Status

The CMS shell is implemented and protected by auth. The Media navigation item exists in `frontend/src/modules/cms/layouts/CmsLayout.vue` and is filtered through `CmsSidebar.vue` using `media.view`.

However, `frontend/src/modules/cms/routes.js` does not define a `/cms/media` child route. In the audited repo state, selecting `/cms/media` would fall through to the CMS catch-all not-found route rather than a real media page. No `CmsMediaView.vue` or media-specific placeholder view exists under `frontend/src/modules/cms/views/`.

Frontend media API methods are also missing. `cmsContentApi.js` contains content CRUD methods for promotions, events, products, destinations, businesses, museum artifacts, and map locations, but no `getMedia`, `createMedia`, `updateMedia`, or `archiveMedia` methods. There is no separate `cmsOperationsApi` service.

## 3. Backend API Availability

Available and usable endpoints:

- `GET /api/v1/cms/media`
- `POST /api/v1/cms/media`
- `GET /api/v1/cms/media/:id`
- `PATCH /api/v1/cms/media/:id`
- `PATCH /api/v1/cms/media/:id/archive`

These routes are mounted through `backend/src/modules/cms/cms.routes.js`, which applies `authenticate` to all CMS routes, then mounts `operations.routes.js`.

Permission enforcement:

- `GET /media`, `GET /media/:id`: `media.view`
- `POST /media`: `media.upload`
- `PATCH /media/:id`: `media.upload`
- `PATCH /media/:id/archive`: `media.archive`

Permissions exist in `backend/database/seeds/002_cms_roles_permissions_seed.sql`:

- `media.view`
- `media.upload`
- `media.archive`

GET `/cms/media` response shape:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fileUrl": "https://example.com/image.jpg",
      "fileName": "image.jpg",
      "mimeType": "image/jpeg",
      "altText": "Accessible description",
      "caption": "Display caption",
      "credit": "Photographer or source",
      "width": 1200,
      "height": 800,
      "status": "active",
      "storageProvider": "external",
      "storageKey": null,
      "fileSizeBytes": null,
      "checksumSha256": null,
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp",
      "createdBy": "uuid",
      "updatedBy": "uuid",
      "uploadedBy": "uuid"
    }
  ],
  "meta": {
    "requestId": "string",
    "timestamp": "ISO timestamp",
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 0,
      "totalPages": 0,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

Supported list query params:

- `page`
- `limit`, capped at 100
- `search`, matches `file_name`, `file_url`, and `alt_text`
- `status`: `active`, `archived`
- `mimeType`
- `storageProvider`: `local`, `cloudinary`, `s3`, `supabase`, `external`
- `sort`: current shared sort schema, including `createdAt`, `-createdAt`, `updatedAt`, `-updatedAt`, `status`, `name`, `-name`

Create/update supports metadata only:

- Required: `fileUrl`
- Optional: `fileName`, `mimeType`, `altText`, `caption`, `credit`, `width`, `height`, `status`, `storageProvider`, `storageKey`, `fileSizeBytes`, `checksumSha256`
- Defaults: `status = active`, `storageProvider = external`
- There is no multipart upload handler, local binary upload, cloud storage processing, or CDN integration.

Audit logs are created for media `create`, `update`, and `archive` with `entityType = media_asset`.

Backend gaps to account for:

- Nullable fields cannot currently be cleared back to `NULL` because `updateMedia` uses SQL `COALESCE`.
- Validator allows `width` and `height` as nonnegative, but the database checks require positive values when present.
- `media.upload` is the write permission name even though the current API only creates metadata.

## 4. Frontend Route and Navigation Review

`/cms/media` route status: missing.

`/cms/media` auth protection: the parent `/cms` layout route is protected with `meta.requiresAuth`, but there is no media child route yet. When added, it should use `meta: { permission: 'media.view' }`.

Media sidebar item: present and permission-aware.

- Fallback frontend navigation has `{ key: 'media', label: 'Media', path: '/cms/media', permission: 'media.view' }`.
- Backend navigation also includes a Media item gated by `requiredAny: ['media.view', 'media.upload']`.
- `CmsSidebar.vue` filters items with `auth.hasPermission` or `auth.hasAnyPermission`.

Frontend API service status:

- `cmsContentApi.js` has no media methods.
- `cmsApi.js` has dashboard/navigation/audit-log methods only.
- No `cmsOperationsApi.js` exists.
- `frontend/src/services/http.js` already supports authenticated `GET`, `POST`, and `PATCH` JSON requests, which is sufficient for the metadata-only API.

## 5. Existing Reusable Components

Reusable now:

- `CmsDataTable.vue`: desktop table, mobile cards, loading skeletons, empty state, error state, retry/sign-in behavior.
- `CmsContentToolbar.vue`: search, status filter, create button, and existing content filters. It can be reused partly but needs media-specific filter support or a small media toolbar wrapper.
- `CmsPagination.vue`: matches backend pagination envelope.
- `CmsStatusBadge.vue`: already supports `active` and `archived`.
- `CmsConfirmDialog.vue`: usable for archive confirmation.
- `CmsPermissionGate.vue`: usable for permission-aware regions, although current content pages mostly call `auth.hasPermission` directly.
- `useCmsList.js`: reusable for list loading and pagination, but its watcher does not currently include `mimeType` or `storageProvider`.
- `cms-content-page.css`: reusable page header, notice, responsive content-page spacing.

Partially reusable:

- Existing content page patterns such as `CmsProductsView.vue` and `CmsPromotionsView.vue` provide the correct list/form/archive workflow.
- Existing form modal CSS in `cms-form-modal.css` can be reused for a media metadata form.
- `CmsImagePreviewField.vue` is not a real image/media preview. It previews a color block and should not be used as the media asset preview.

Missing components:

- `CmsMediaView.vue`
- Media API methods in a service, preferably `cmsOperationsApi.js` or media methods added deliberately to `cmsContentApi.js`
- `CmsMediaForm.vue`
- Actual media preview component for images and non-image files
- Copy URL action
- Media-specific toolbar filters for MIME type and storage provider
- Optional grid/list media layout component

## 6. Required Media Page Features

Implement now:

- Protected `/cms/media` route with `media.view`
- Media sidebar remains unchanged, but route target must be real
- Authenticated media API service methods:
  - `getMedia(params)`
  - `getMediaById(id)`
  - `createMedia(payload)`
  - `updateMedia(id, payload)`
  - `archiveMedia(id)`
- Paginated media list using `GET /cms/media`
- Search by URL/name/alt text
- Status filter: all, active, archived
- MIME type filter
- Storage provider filter
- Pagination
- Create media metadata using `fileUrl` or external URL first
- Edit media metadata
- Archive media with confirmation
- Image preview for image MIME types or image-looking URLs
- Non-image preview fallback showing MIME type/file name
- Copy media URL button
- Fields:
  - File URL
  - File name
  - MIME type
  - Alt text
  - Caption
  - Credit
  - Width
  - Height
  - Status
  - Storage provider
  - Storage key
  - File size bytes
  - Checksum SHA-256, optional and advanced
- Status badge
- Empty, loading, and error states
- Permission-aware buttons:
  - View/list: `media.view`
  - Create/edit metadata: `media.upload`
  - Archive: `media.archive`

Recommended UX framing: call the create action "Add media URL" or "Add media metadata", not "Upload media", because no binary upload exists yet.

## 7. What Should Be Postponed

Postpone:

- Real binary upload
- Multipart/form-data frontend handling
- Local disk storage
- Cloudinary/S3/Supabase upload integration
- CDN optimization
- Image cropping
- Image resizing/transcoding
- Bulk upload
- Folder/album management
- Drag-and-drop upload
- Media picker integration inside product/event/destination forms
- Usage tracking across products, events, destinations, museum artifacts, promotions, and businesses
- Automatic MIME/dimension extraction from remote URLs
- Virus scanning or file safety scanning

## 8. Risks

Critical:

- None found for metadata-only implementation.

High:

- The sidebar links to `/cms/media`, but the frontend route is missing. Users with `media.view` can see a navigation item that currently leads to not-found/unimplemented behavior.

Medium:

- Product wording risk: calling the action "upload" would mislead users because the backend only stores metadata/external URLs.
- `useCmsList.js` does not watch `mimeType` or `storageProvider`; media filters will not auto-refresh unless the composable is extended or the media page handles those filters manually.
- Nullable metadata fields cannot be cleared once set due to backend `COALESCE` update behavior.

Low:

- Validator/database mismatch for `width` and `height`: API allows `0`, database requires positive values when present.
- `CmsContentToolbar.vue` is content-centric and does not directly support media-specific filters.
- `CmsImagePreviewField.vue` name could mislead implementers because it is a color preview, not an image URL preview.

## 9. Recommended Implementation Plan

Phase 07G-3B steps:

1. Add a CMS media route in `frontend/src/modules/cms/routes.js`:
   - path: `media`
   - name: `cms-media`
   - component: `./views/content/CmsMediaView.vue`
   - meta permission: `media.view`

2. Add media API methods:
   - Prefer a new `frontend/src/modules/cms/services/cmsOperationsApi.js` for media/inquiries/newsletter/users/audit operations.
   - Alternatively add media methods to `cmsContentApi.js` if the project wants one CMS CRUD service for now.

3. Build `CmsMediaView.vue` using existing CMS page patterns:
   - `useCmsList`
   - `CmsDataTable`
   - `CmsPagination`
   - `CmsStatusBadge`
   - `CmsConfirmDialog`
   - `cms-content-page.css`

4. Extend filter support:
   - Add `mimeType` and `storageProvider` to the media list filters.
   - Either update `useCmsList` watcher to include those keys or implement a media-specific filter watcher.

5. Add `CmsMediaForm.vue`:
   - Metadata-only JSON form.
   - Require `fileUrl`.
   - Default `status = active`.
   - Default `storageProvider = external`.
   - Use positive numeric validation for width/height to match the database.
   - Avoid promising file upload.

6. Add preview and URL actions:
   - Show image preview for image assets.
   - Show file metadata fallback for non-images.
   - Add copy URL action using the Clipboard API with a fallback notice/error.

7. Add permission-aware controls:
   - Create/edit visible only with `media.upload`.
   - Archive visible only with `media.archive` and hidden for already archived assets.
   - List route remains guarded by `media.view`.

8. QA:
   - Verify route guard redirects users without `media.view`.
   - Verify `media.view` users cannot create/archive if missing write/archive permissions.
   - Verify filters generate backend params correctly.
   - Verify paginated response handling.
   - Verify validation and error states.
   - Verify mobile card layout and desktop table layout.

## 10. Readiness Decision

Ready for implementation.

The backend media metadata API exists, is authenticated, permission-protected, paginated, validated, and audited. The frontend implementation should proceed as a metadata-first Media Assets page using external `fileUrl` records. Real file upload must remain a later phase unless backend upload processing is explicitly added first.

