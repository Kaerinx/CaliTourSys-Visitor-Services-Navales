const assert = require('node:assert/strict')

const { closeDatabasePool, query } = require('../src/config/db')

const EXPECTED_TABLES = [
  'emergency_facilities',
  'map_location_details',
  'map_location_gallery_images',
  'map_location_activity_links',
  'map_location_package_links',
  'map_location_overnight_options',
]

const EXPECTED_INDEXES = [
  'ux_map_location_gallery_images_primary',
  'ux_map_location_package_links_primary',
]

const EXPECTED_CONSTRAINTS = [
  'map_location_overnight_options_capacity_range',
  'map_location_overnight_options_currency_php',
  'map_location_overnight_options_rate_unit_valid',
]

async function run() {
  const tables = await query(
    `
      SELECT name, to_regclass('public.' || name) IS NOT NULL AS present
      FROM unnest($1::text[]) AS expected(name)
      ORDER BY name
    `,
    [EXPECTED_TABLES],
  )
  assert.deepEqual(
    tables.rows.filter((row) => !row.present),
    [],
    'Migration 031 tables are missing.',
  )

  const indexes = await query(
    `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname = ANY($1::text[])`,
    [EXPECTED_INDEXES],
  )
  assert.deepEqual(
    new Set(indexes.rows.map((row) => row.indexname)),
    new Set(EXPECTED_INDEXES),
    'Primary gallery/package uniqueness indexes are missing.',
  )

  const constraints = await query(
    `SELECT conname FROM pg_constraint WHERE conname = ANY($1::text[])`,
    [EXPECTED_CONSTRAINTS],
  )
  assert.deepEqual(
    new Set(constraints.rows.map((row) => row.conname)),
    new Set(EXPECTED_CONSTRAINTS),
    'Overnight pricing constraints are missing.',
  )

  const auditEnum = await query(`
    SELECT EXISTS (
      SELECT 1
      FROM pg_type type
      JOIN pg_enum value ON value.enumtypid = type.oid
      WHERE type.typname = 'cms_entity_type'
        AND value.enumlabel = 'emergency_facility'
    ) AS present
  `)
  assert.equal(
    auditEnum.rows[0]?.present,
    true,
    'cms_entity_type does not include emergency_facility.',
  )

  console.log('Map experience schema smoke checks passed.')
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(closeDatabasePool)
