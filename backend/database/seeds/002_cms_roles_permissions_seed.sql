-- ============================================================================
-- CaliTourSys / CallTourSys
-- Seed: 002_cms_roles_permissions_seed.sql
-- Scope: CMS Foundation roles and permissions only
--
-- Development/initial configuration seed.
-- This file intentionally does NOT create users, passwords, or default admins.
-- Create the first CMS user through a controlled administrative process later.
-- ============================================================================

BEGIN;

-- ============================================================================
-- Roles
-- ============================================================================

INSERT INTO roles (id, role_key, name, description, is_system_role)
VALUES
  ('20000000-0000-4000-8000-000000000001', 'system_admin', 'System Administrator', 'Full CMS administration including users, roles, permissions, audit logs, and all content modules.', true),
  ('20000000-0000-4000-8000-000000000002', 'tourism_officer', 'Tourism Officer', 'Senior tourism office role that can manage and publish public website content and review operational records.', true),
  ('20000000-0000-4000-8000-000000000003', 'tourism_staff', 'Tourism Staff', 'Operational staff role for managing records and responding to visitor service needs without system administration.', true),
  ('20000000-0000-4000-8000-000000000004', 'content_editor', 'Content Editor', 'Content-focused role for drafting and updating public website content and media.', true),
  ('20000000-0000-4000-8000-000000000005', 'read_only_staff', 'Viewer / Read-only Staff', 'Read-only CMS access for supervisors or support staff.', true)
ON CONFLICT (role_key) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system_role = EXCLUDED.is_system_role,
  updated_at = now();

-- ============================================================================
-- Permissions
-- ============================================================================

INSERT INTO permissions (id, permission_key, name, description)
VALUES
  ('21000000-0000-4000-8000-000000000001', 'dashboard.view', 'View Dashboard', 'View CMS dashboard metrics and summaries.'),
  ('21000000-0000-4000-8000-000000000002', 'promotions.view', 'View Promotions', 'View CMS promotion records.'),
  ('21000000-0000-4000-8000-000000000003', 'promotions.create', 'Create Promotions', 'Create promotion records.'),
  ('21000000-0000-4000-8000-000000000004', 'promotions.update', 'Update Promotions', 'Update promotion records.'),
  ('21000000-0000-4000-8000-000000000005', 'promotions.publish', 'Publish Promotions', 'Publish promotion records to the public website.'),
  ('21000000-0000-4000-8000-000000000006', 'promotions.archive', 'Archive Promotions', 'Archive promotion records.'),
  ('21000000-0000-4000-8000-000000000007', 'events.view', 'View Events', 'View CMS event records.'),
  ('21000000-0000-4000-8000-000000000008', 'events.create', 'Create Events', 'Create event records.'),
  ('21000000-0000-4000-8000-000000000009', 'events.update', 'Update Events', 'Update event records.'),
  ('21000000-0000-4000-8000-000000000010', 'events.publish', 'Publish Events', 'Publish event records to the public website.'),
  ('21000000-0000-4000-8000-000000000011', 'events.archive', 'Archive Events', 'Archive event records.'),
  ('21000000-0000-4000-8000-000000000012', 'products.view', 'View Products', 'View CMS product records.'),
  ('21000000-0000-4000-8000-000000000013', 'products.create', 'Create Products', 'Create OTOP/public product records.'),
  ('21000000-0000-4000-8000-000000000014', 'products.update', 'Update Products', 'Update OTOP/public product records.'),
  ('21000000-0000-4000-8000-000000000015', 'products.publish', 'Publish Products', 'Publish products to the public website.'),
  ('21000000-0000-4000-8000-000000000016', 'products.archive', 'Archive Products', 'Archive product records.'),
  ('21000000-0000-4000-8000-000000000017', 'destinations.view', 'View Destinations', 'View destination records.'),
  ('21000000-0000-4000-8000-000000000018', 'destinations.create', 'Create Destinations', 'Create destination records.'),
  ('21000000-0000-4000-8000-000000000019', 'destinations.update', 'Update Destinations', 'Update destination records.'),
  ('21000000-0000-4000-8000-000000000020', 'destinations.publish', 'Publish Destinations', 'Publish destinations to the public website.'),
  ('21000000-0000-4000-8000-000000000021', 'destinations.archive', 'Archive Destinations', 'Archive destination records.'),
  ('21000000-0000-4000-8000-000000000022', 'businesses.view', 'View Businesses', 'View business and producer records.'),
  ('21000000-0000-4000-8000-000000000023', 'businesses.create', 'Create Businesses', 'Create business and producer records.'),
  ('21000000-0000-4000-8000-000000000024', 'businesses.update', 'Update Businesses', 'Update business and producer records.'),
  ('21000000-0000-4000-8000-000000000025', 'map_locations.view', 'View Map Locations', 'View public map location records.'),
  ('21000000-0000-4000-8000-000000000026', 'map_locations.create', 'Create Map Locations', 'Create public map location records.'),
  ('21000000-0000-4000-8000-000000000027', 'map_locations.update', 'Update Map Locations', 'Update public map location records.'),
  ('21000000-0000-4000-8000-000000000028', 'museum.view', 'View Museum Artifacts', 'View museum artifact records.'),
  ('21000000-0000-4000-8000-000000000029', 'museum.create', 'Create Museum Artifacts', 'Create museum artifact records.'),
  ('21000000-0000-4000-8000-000000000030', 'museum.update', 'Update Museum Artifacts', 'Update museum artifact records.'),
  ('21000000-0000-4000-8000-000000000031', 'museum.publish', 'Publish Museum Artifacts', 'Publish museum artifacts to the public website.'),
  ('21000000-0000-4000-8000-000000000032', 'museum.archive', 'Archive Museum Artifacts', 'Archive museum artifact records.'),
  ('21000000-0000-4000-8000-000000000033', 'media.view', 'View Media', 'View CMS media assets.'),
  ('21000000-0000-4000-8000-000000000034', 'media.upload', 'Upload Media', 'Upload CMS media assets.'),
  ('21000000-0000-4000-8000-000000000035', 'media.archive', 'Archive Media', 'Archive CMS media assets.'),
  ('21000000-0000-4000-8000-000000000036', 'inquiries.view', 'View Inquiries', 'View public tourism inquiries.'),
  ('21000000-0000-4000-8000-000000000037', 'inquiries.respond', 'Respond to Inquiries', 'Prepare or record staff responses to public inquiries.'),
  ('21000000-0000-4000-8000-000000000038', 'newsletter.view', 'View Newsletter Subscribers', 'View newsletter subscriber records.'),
  ('21000000-0000-4000-8000-000000000039', 'users.view', 'View Users', 'View CMS users.'),
  ('21000000-0000-4000-8000-000000000040', 'users.manage', 'Manage Users', 'Create, update, lock, or deactivate CMS users.'),
  ('21000000-0000-4000-8000-000000000041', 'roles.view', 'View Roles', 'View CMS roles and permissions.'),
  ('21000000-0000-4000-8000-000000000042', 'roles.manage', 'Manage Roles', 'Manage CMS roles and permission assignments.'),
  ('21000000-0000-4000-8000-000000000043', 'audit_logs.view', 'View Audit Logs', 'View CMS audit log records.'),
  ('21000000-0000-4000-8000-000000000044', 'reports.view', 'View Reports', 'View CMS reports and analytics.')
ON CONFLICT (permission_key) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

-- ============================================================================
-- Role Permission Assignments
-- ============================================================================

WITH role_permission_keys(role_key, permission_key) AS (
  VALUES
    -- System Administrator: all permissions.
    ('system_admin', 'dashboard.view'),
    ('system_admin', 'promotions.view'),
    ('system_admin', 'promotions.create'),
    ('system_admin', 'promotions.update'),
    ('system_admin', 'promotions.publish'),
    ('system_admin', 'promotions.archive'),
    ('system_admin', 'events.view'),
    ('system_admin', 'events.create'),
    ('system_admin', 'events.update'),
    ('system_admin', 'events.publish'),
    ('system_admin', 'events.archive'),
    ('system_admin', 'products.view'),
    ('system_admin', 'products.create'),
    ('system_admin', 'products.update'),
    ('system_admin', 'products.publish'),
    ('system_admin', 'products.archive'),
    ('system_admin', 'destinations.view'),
    ('system_admin', 'destinations.create'),
    ('system_admin', 'destinations.update'),
    ('system_admin', 'destinations.publish'),
    ('system_admin', 'destinations.archive'),
    ('system_admin', 'businesses.view'),
    ('system_admin', 'businesses.create'),
    ('system_admin', 'businesses.update'),
    ('system_admin', 'map_locations.view'),
    ('system_admin', 'map_locations.create'),
    ('system_admin', 'map_locations.update'),
    ('system_admin', 'museum.view'),
    ('system_admin', 'museum.create'),
    ('system_admin', 'museum.update'),
    ('system_admin', 'museum.publish'),
    ('system_admin', 'museum.archive'),
    ('system_admin', 'media.view'),
    ('system_admin', 'media.upload'),
    ('system_admin', 'media.archive'),
    ('system_admin', 'inquiries.view'),
    ('system_admin', 'inquiries.respond'),
    ('system_admin', 'newsletter.view'),
    ('system_admin', 'users.view'),
    ('system_admin', 'users.manage'),
    ('system_admin', 'roles.view'),
    ('system_admin', 'roles.manage'),
    ('system_admin', 'audit_logs.view'),
    ('system_admin', 'reports.view'),

    -- Tourism Officer: full content operations and audit visibility, no user/role management.
    ('tourism_officer', 'dashboard.view'),
    ('tourism_officer', 'promotions.view'),
    ('tourism_officer', 'promotions.create'),
    ('tourism_officer', 'promotions.update'),
    ('tourism_officer', 'promotions.publish'),
    ('tourism_officer', 'promotions.archive'),
    ('tourism_officer', 'events.view'),
    ('tourism_officer', 'events.create'),
    ('tourism_officer', 'events.update'),
    ('tourism_officer', 'events.publish'),
    ('tourism_officer', 'events.archive'),
    ('tourism_officer', 'products.view'),
    ('tourism_officer', 'products.create'),
    ('tourism_officer', 'products.update'),
    ('tourism_officer', 'products.publish'),
    ('tourism_officer', 'products.archive'),
    ('tourism_officer', 'destinations.view'),
    ('tourism_officer', 'destinations.create'),
    ('tourism_officer', 'destinations.update'),
    ('tourism_officer', 'destinations.publish'),
    ('tourism_officer', 'destinations.archive'),
    ('tourism_officer', 'businesses.view'),
    ('tourism_officer', 'businesses.create'),
    ('tourism_officer', 'businesses.update'),
    ('tourism_officer', 'map_locations.view'),
    ('tourism_officer', 'map_locations.create'),
    ('tourism_officer', 'map_locations.update'),
    ('tourism_officer', 'museum.view'),
    ('tourism_officer', 'museum.create'),
    ('tourism_officer', 'museum.update'),
    ('tourism_officer', 'museum.publish'),
    ('tourism_officer', 'museum.archive'),
    ('tourism_officer', 'media.view'),
    ('tourism_officer', 'media.upload'),
    ('tourism_officer', 'media.archive'),
    ('tourism_officer', 'inquiries.view'),
    ('tourism_officer', 'inquiries.respond'),
    ('tourism_officer', 'newsletter.view'),
    ('tourism_officer', 'audit_logs.view'),
    ('tourism_officer', 'reports.view'),

    -- Tourism Staff: operational create/update/view, no publish/archive.
    ('tourism_staff', 'dashboard.view'),
    ('tourism_staff', 'promotions.view'),
    ('tourism_staff', 'promotions.create'),
    ('tourism_staff', 'promotions.update'),
    ('tourism_staff', 'events.view'),
    ('tourism_staff', 'events.create'),
    ('tourism_staff', 'events.update'),
    ('tourism_staff', 'products.view'),
    ('tourism_staff', 'products.create'),
    ('tourism_staff', 'products.update'),
    ('tourism_staff', 'destinations.view'),
    ('tourism_staff', 'destinations.create'),
    ('tourism_staff', 'destinations.update'),
    ('tourism_staff', 'businesses.view'),
    ('tourism_staff', 'businesses.create'),
    ('tourism_staff', 'businesses.update'),
    ('tourism_staff', 'map_locations.view'),
    ('tourism_staff', 'map_locations.create'),
    ('tourism_staff', 'map_locations.update'),
    ('tourism_staff', 'museum.view'),
    ('tourism_staff', 'museum.create'),
    ('tourism_staff', 'museum.update'),
    ('tourism_staff', 'media.view'),
    ('tourism_staff', 'media.upload'),
    ('tourism_staff', 'inquiries.view'),
    ('tourism_staff', 'inquiries.respond'),
    ('tourism_staff', 'newsletter.view'),
    ('tourism_staff', 'reports.view'),

    -- Content Editor: content and media drafting/updating, no publish/archive.
    ('content_editor', 'dashboard.view'),
    ('content_editor', 'promotions.view'),
    ('content_editor', 'promotions.create'),
    ('content_editor', 'promotions.update'),
    ('content_editor', 'events.view'),
    ('content_editor', 'events.create'),
    ('content_editor', 'events.update'),
    ('content_editor', 'products.view'),
    ('content_editor', 'products.create'),
    ('content_editor', 'products.update'),
    ('content_editor', 'destinations.view'),
    ('content_editor', 'destinations.create'),
    ('content_editor', 'destinations.update'),
    ('content_editor', 'businesses.view'),
    ('content_editor', 'businesses.update'),
    ('content_editor', 'map_locations.view'),
    ('content_editor', 'map_locations.create'),
    ('content_editor', 'map_locations.update'),
    ('content_editor', 'museum.view'),
    ('content_editor', 'museum.create'),
    ('content_editor', 'museum.update'),
    ('content_editor', 'media.view'),
    ('content_editor', 'media.upload'),
    ('content_editor', 'inquiries.view'),

    -- Read-only Staff: view-only operational access.
    ('read_only_staff', 'dashboard.view'),
    ('read_only_staff', 'promotions.view'),
    ('read_only_staff', 'events.view'),
    ('read_only_staff', 'products.view'),
    ('read_only_staff', 'destinations.view'),
    ('read_only_staff', 'businesses.view'),
    ('read_only_staff', 'map_locations.view'),
    ('read_only_staff', 'museum.view'),
    ('read_only_staff', 'media.view'),
    ('read_only_staff', 'inquiries.view'),
    ('read_only_staff', 'newsletter.view'),
    ('read_only_staff', 'reports.view')
),
resolved AS (
  SELECT r.id AS role_id, p.id AS permission_id
  FROM role_permission_keys rpk
  JOIN roles r ON r.role_key = rpk.role_key
  JOIN permissions p ON p.permission_key = rpk.permission_key
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, permission_id
FROM resolved
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;

