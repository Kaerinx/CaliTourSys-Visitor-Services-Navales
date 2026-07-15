const NAVIGATION_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/cms/dashboard',
    requiredAny: ['dashboard.view'],
  },
  {
    key: 'content-management',
    label: 'Content Management',
    path: '/cms/content-management',
    requiredAny: ['promotions.view', 'destinations.view', 'museum.view'],
  },
  {
    key: 'otop-support',
    label: 'OTOP Support',
    path: '/cms/otop-support',
    requiredAny: ['products.view', 'businesses.view'],
  },
  {
    key: 'events',
    label: 'Events',
    path: '/cms/events',
    requiredAny: ['events.view'],
  },
  {
    key: 'destinations',
    label: 'Destinations',
    path: '/cms/destinations',
    requiredAny: ['destinations.view'],
  },
  {
    key: 'map-locations',
    label: 'Map Locations',
    path: '/cms/map-locations',
    requiredAny: ['map_locations.view'],
  },
  {
    key: 'museum',
    label: 'Museum',
    path: '/cms/museum',
    requiredAny: ['museum.view'],
  },
  {
    key: 'business-accreditation',
    label: 'Business Accreditation',
    path: '/cms/business-accreditation',
    requiredAny: ['businesses.view'],
  },
  {
    key: 'visitor-services',
    label: 'Visitor Services',
    path: '/cms/visitor-services',
    requiredAny: ['inquiries.view', 'inquiries.respond'],
  },
  {
    key: 'package-bookings',
    label: 'Package Bookings',
    path: '/cms/package-bookings',
    requiredAny: ['package_bookings.view', 'package_bookings.review'],
  },
  {
    key: 'newsletter',
    label: 'Newsletter',
    path: '/cms/newsletter',
    requiredAny: ['newsletter.view'],
  },
  {
    key: 'media',
    label: 'Media',
    path: '/cms/media',
    requiredAny: ['media.view', 'media.upload'],
  },
  {
    key: 'reports',
    label: 'Reports',
    path: '/cms/reports',
    requiredAny: ['reports.view'],
  },
  {
    key: 'users-roles',
    label: 'Users & Roles',
    path: '/cms/users',
    requiredAny: ['users.manage', 'roles.manage'],
  },
]

function getAllowedNavigationItems(permissions = []) {
  const permissionSet = new Set(permissions)

  return NAVIGATION_ITEMS.filter((item) =>
    item.requiredAny.some((permission) => permissionSet.has(permission)),
  ).map(({ requiredAny, ...item }) => item)
}

module.exports = {
  getAllowedNavigationItems,
}

