const { pool, query: pgQuery } = require('../../config/db');

async function query(text, params = []) {
  const result = await pgQuery(text, params);
  return result.rows;
}

async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

const ROLE_BY_ID = {
  1: 'admin',
  2: 'receptionist',
  3: 'tourism_staff',
  4: 'lgu_official',
};

function safeUser(user) {
  if (!user) return null;
  const { password, password_hash, ...safe } = user;
  return safe;
}

function normalizeUser(row, establishments = [], roles = []) {
  if (!row) return null;
  const role =
    row.role ||
    roles.find((item) => Number(item.id) === Number(row.role_id))?.name ||
    ROLE_BY_ID[row.role_id] ||
    'tourism_staff';
  const assignedId = row.assigned_establishment_id ?? row.assigned_resort_id ?? null;
  const assigned = establishments.find((item) => Number(item.id) === Number(assignedId)) || null;

  return {
    ...row,
    full_name: row.full_name || row.name || row.username,
    email: row.email || row.email_address || '',
    role,
    assigned_establishment_id: assignedId,
    assigned_establishment_name: assigned?.name || row.assigned_establishment_name || null,
    assigned_establishment: assigned,
    status: row.status || (row.is_active === false || row.is_active === 0 ? 'inactive' : 'active'),
  };
}

async function lookupRows() {
  const establishments = await query('SELECT id, name, type FROM visitor_establishments ORDER BY name').catch(() => []);
  const roles = await query('SELECT id, name FROM roles ORDER BY id').catch(() => []);
  return { establishments, roles };
}

async function findUserByUsername(username) {
  const rows = await query('SELECT * FROM visitor_users WHERE username = $1 LIMIT 1', [username]);
  const lookups = await lookupRows();
  return normalizeUser(rows[0], lookups.establishments, lookups.roles);
}

async function findUserById(id) {
  const rows = await query('SELECT * FROM visitor_users WHERE id = $1 LIMIT 1', [id]);
  const lookups = await lookupRows();
  return normalizeUser(rows[0], lookups.establishments, lookups.roles);
}

async function listUsers() {
  const rows = await query('SELECT * FROM visitor_users ORDER BY id ASC');
  const lookups = await lookupRows();
  return rows.map((row) => safeUser(normalizeUser(row, lookups.establishments, lookups.roles)));
}

async function tableColumns(tableName) {
  const rows = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = $1
     ORDER BY ordinal_position`,
    [tableName]
  ).catch(() => []);
  return rows.map((row) => row.column_name);
}

function pickColumns(payload, columns, aliases = {}) {
  const next = {};
  Object.entries(payload).forEach(([key, value]) => {
    const mapped = aliases[key] || key;
    if (value !== undefined && columns.includes(mapped)) {
      next[mapped] = value;
    }
  });
  return next;
}

function placeholder(params, value) {
  params.push(value);
  return `$${params.length}`;
}

function insertSql(tableName, values) {
  const keys = Object.keys(values);
  const params = [];
  const placeholders = keys.map((key) => placeholder(params, values[key]));
  return {
    sql: `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`,
    params,
  };
}

function updateSql(tableName, id, values) {
  const keys = Object.keys(values);
  const params = [];
  const setSql = keys.map((key) => `${key} = ${placeholder(params, values[key])}`).join(', ');
  const idPlaceholder = placeholder(params, id);
  return {
    sql: `UPDATE ${tableName} SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = ${idPlaceholder}`,
    params,
  };
}

function visitorSelectSql() {
  return `
    SELECT
      vr.*,
      TO_CHAR(vr.visit_date, 'YYYY-MM-DD') AS visit_date,
      e.name AS establishment_name,
      e.type AS establishment_type,
      u.full_name AS encoded_by,
      (
        SELECT COUNT(*)
        FROM visitor_companions vc
        WHERE vc.visitor_record_id = vr.id
      ) AS companion_count
    FROM visitor_records vr
    LEFT JOIN visitor_establishments e ON e.id = vr.establishment_id
    LEFT JOIN visitor_users u ON CAST(u.id AS text) = vr.recorded_by_user_id
  `;
}

function buildVisitorWhere(filters = {}) {
  const where = [];
  const params = [];

  if (filters.date_from) {
    where.push(`CAST(vr.visit_date AS date) >= ${placeholder(params, filters.date_from)}`);
  }
  if (filters.date_to) {
    where.push(`CAST(vr.visit_date AS date) <= ${placeholder(params, filters.date_to)}`);
  }
  if (filters.establishment_id) {
    where.push(`vr.establishment_id = ${placeholder(params, filters.establishment_id)}`);
  }
  if (filters.visitor_type) {
    where.push(`vr.visitor_type = ${placeholder(params, filters.visitor_type)}`);
  }
  if (filters.nationality) {
    where.push(`vr.nationality = ${placeholder(params, filters.nationality)}`);
  }
  if (filters.source_type) {
    where.push(`vr.source_type = ${placeholder(params, filters.source_type)}`);
  }
  if (filters.status) {
    where.push(`vr.status = ${placeholder(params, filters.status)}`);
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
}

function buildTouristCountLogWhere(filters = {}) {
  const where = [];
  const params = [];

  if (filters.search) {
    where.push(`bp.business_name ILIKE ${placeholder(params, `%${filters.search}%`)}`);
  }
  if (filters.date) {
    where.push(`tcl.log_date = ${placeholder(params, filters.date)}::date`);
  }

  const touristType = String(filters.touristType || filters.tourist_type || 'all').toLowerCase();
  if (touristType === 'local') {
    where.push('tcl.local_count > 0');
  } else if (touristType === 'domestic') {
    where.push('tcl.domestic_count > 0');
  } else if (touristType === 'international') {
    where.push('tcl.international_count > 0');
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
}

async function listTouristCountLogs(filters = {}) {
  const { whereSql, params } = buildTouristCountLogWhere(filters);
  return query(
    `SELECT
       tcl.id,
       tcl.business_profile_id,
       bp.business_name AS establishment_name,
       TO_CHAR(tcl.log_date, 'YYYY-MM-DD') AS log_date,
       tcl.adult_count,
       tcl.senior_count,
       tcl.children_count,
       (tcl.adult_count + tcl.senior_count + tcl.children_count) AS total_count,
       tcl.local_count,
       tcl.domestic_count,
       tcl.international_count,
       tcl.visit_context,
       tcl.status,
       tcl.submitted_by_user_id,
       COALESCE(u.display_name, NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), ''), u.email) AS submitted_by,
       TO_CHAR(tcl.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at,
       TO_CHAR(tcl.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS updated_at
     FROM tourist_count_logs tcl
     JOIN business_profiles bp ON bp.id = tcl.business_profile_id
     LEFT JOIN users u ON u.id = tcl.submitted_by_user_id
     ${whereSql}
     ORDER BY tcl.log_date DESC, tcl.created_at DESC`,
    params
  );
}

async function companionsFor(visitorId) {
  return query(
    `SELECT id, visitor_record_id, full_name, age_group, gender, nationality, created_at
     FROM visitor_companions
     WHERE visitor_record_id = $1
     ORDER BY id ASC`,
    [visitorId]
  );
}

async function createVisitor(payload) {
  const groupId = payload.group_id || `GRP-${Date.now()}`;
  const visitorId = await transaction(async (client) => {
    const visitorResult = await client.query(
      `INSERT INTO visitor_records (
        group_id, establishment_id, recorded_by_user_id, full_name, contact_number, email,
        gender, age_group, visitor_type, nationality, province, country, address,
        purpose_of_visit, visit_date, check_in_time, check_out_time, status, source_type
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19
      ) RETURNING id`,
      [
        groupId,
        payload.establishment_id || null,
        payload.recorded_by_user_id,
        payload.full_name,
        payload.contact_number || '',
        payload.email || '',
        payload.gender || '',
        payload.age_group || 'adult',
        payload.visitor_type || 'local',
        payload.nationality || 'Filipino',
        payload.province || '',
        payload.country || 'Philippines',
        payload.address || '',
        payload.purpose_of_visit || '',
        payload.visit_date,
        payload.check_in_time || null,
        payload.check_out_time || null,
        payload.status || 'recorded',
        payload.source_type || 'tourism_office',
      ]
    );

    const createdVisitorId = visitorResult.rows[0].id;
    for (const companion of payload.companions || []) {
      if (!companion.full_name) continue;
      await client.query(
        `INSERT INTO visitor_companions (
          visitor_record_id, full_name, age_group, gender, nationality
        ) VALUES (
          $1, $2, $3, $4, $5
        )`,
        [
          createdVisitorId,
          companion.full_name,
          companion.age_group || 'adult',
          companion.gender || '',
          companion.nationality || payload.nationality || 'Filipino',
        ]
      );
    }

    return createdVisitorId;
  });
  return getVisitor(visitorId);
}

async function listVisitors(filters = {}) {
  const { whereSql, params } = buildVisitorWhere(filters);
  return query(`${visitorSelectSql()} ${whereSql} ORDER BY vr.visit_date DESC, vr.id DESC`, params);
}

async function getVisitor(id) {
  const rows = await query(`${visitorSelectSql()} WHERE vr.id = $1 LIMIT 1`, [id]);
  if (!rows[0]) return null;
  return {
    ...rows[0],
    companions: await companionsFor(id),
  };
}

async function updateVisitor(id, payload) {
  const allowed = [
    'establishment_id',
    'full_name',
    'contact_number',
    'email',
    'gender',
    'age_group',
    'visitor_type',
    'nationality',
    'province',
    'country',
    'address',
    'purpose_of_visit',
    'visit_date',
    'check_in_time',
    'check_out_time',
    'status',
    'source_type',
  ];
  const values = Object.fromEntries(allowed.filter((key) => payload[key] !== undefined).map((key) => [key, payload[key]]));
  if (!Object.keys(values).length) return getVisitor(id);

  const update = updateSql('visitor_records', id, values);
  await query(update.sql, update.params);
  return getVisitor(id);
}

async function updateVisitorStatus(id, status) {
  await query('UPDATE visitor_records SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);
  return getVisitor(id);
}

async function deleteVisitor(id) {
  const existing = await getVisitor(id);
  if (!existing) return false;
  await query('DELETE FROM visitor_records WHERE id = $1', [id]);
  return true;
}

async function dashboardSummary() {
  const rows = await query(`
    SELECT
      MAX(d.report_date) AS report_date,
      COALESCE(COUNT(*) FILTER (WHERE CAST(vr.visit_date AS date) = d.report_date), 0) AS total_visitors_today,
      COALESCE(COUNT(*) FILTER (WHERE vr.visitor_type = 'local'), 0) AS local_visitors,
      COALESCE(COUNT(*) FILTER (WHERE vr.visitor_type = 'domestic'), 0) AS domestic_tourists,
      COALESCE(COUNT(*) FILTER (WHERE vr.visitor_type = 'international'), 0) AS international_tourists,
      COALESCE(COUNT(*) FILTER (WHERE vr.source_type = 'museum' AND CAST(vr.visit_date AS date) = d.report_date), 0) AS museum_visitors
    FROM visitor_records vr
    CROSS JOIN (
      SELECT COALESCE(
        MAX(CASE WHEN CAST(visit_date AS date) = CURRENT_DATE THEN CAST(visit_date AS date) END),
        MAX(CAST(visit_date AS date)),
        CURRENT_DATE
      ) AS report_date
      FROM visitor_records
    ) d
  `);
  const inquiries = await query(
    `SELECT COUNT(*) AS pending_inquiries
     FROM tourism_inquiries
     WHERE status IN ('new', 'read')`
  );
  const establishments = await query(
    `SELECT COUNT(*) AS total_destinations
     FROM visitor_establishments
     WHERE COALESCE(is_active, true) = true`
  ).catch(() => [{ total_destinations: 0 }]);
  const trend = await visitorTrend({});
  const classificationRows = await classification({});
  const recent_arrivals = await query(`${visitorSelectSql()} ORDER BY vr.visit_date DESC, vr.id DESC LIMIT 5`);

  return {
    ...rows[0],
    pending_inquiries: inquiries[0]?.pending_inquiries || 0,
    total_destinations: establishments[0]?.total_destinations || 0,
    upcoming_events: 3,
    trend,
    classification: classificationRows,
    recent_arrivals,
  };
}

async function receptionistSummary(user) {
  const rows = await query(
    `
      SELECT
        MAX(d.report_date) AS report_date,
        COALESCE(COUNT(*) FILTER (WHERE CAST(vr.visit_date AS date) = d.report_date), 0) AS total_guests_today,
        COALESCE(COUNT(*) FILTER (WHERE visitor_type = 'local'), 0) AS local_guests,
        COALESCE(COUNT(*) FILTER (WHERE visitor_type IN ('domestic', 'international')), 0) AS foreign_guests,
        COALESCE(COUNT(*) FILTER (WHERE group_id IS NOT NULL), 0) AS group_registrations,
        COALESCE(COUNT(*) FILTER (WHERE status = 'checked_in'), 0) AS checked_in_guests,
        COALESCE(COUNT(*) FILTER (WHERE status = 'pending'), 0) AS pending_arrivals,
        COALESCE(COUNT(*) FILTER (
          WHERE EXTRACT(YEAR FROM vr.visit_date) = EXTRACT(YEAR FROM d.report_date)
            AND EXTRACT(MONTH FROM vr.visit_date) = EXTRACT(MONTH FROM d.report_date)
        ), 0) AS total_records_this_month
      FROM visitor_records vr
      CROSS JOIN (
        SELECT COALESCE(
          MAX(CASE WHEN CAST(visit_date AS date) = CURRENT_DATE THEN CAST(visit_date AS date) END),
          MAX(CAST(visit_date AS date)),
          CURRENT_DATE
        ) AS report_date
        FROM visitor_records
        WHERE establishment_id = $1
      ) d
      WHERE vr.establishment_id = $1
    `,
    [user.assigned_establishment_id]
  );
  const recent_arrivals = await listVisitors({ establishment_id: user.assigned_establishment_id });
  return {
    ...rows[0],
    recent_arrivals: recent_arrivals.slice(0, 5),
  };
}

async function createInquiry(payload) {
  const rows = await query(
    `INSERT INTO visitor_inquiries (full_name, email, contact_number, subject, message, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING id`,
    [payload.full_name, payload.email, payload.contact_number, payload.subject, payload.message]
  );
  return getInquiry(rows[0].id);
}

async function listInquiries(filters = {}) {
  const where = [];
  const params = [];
  if (filters.status) {
    where.push(`i.status = ${placeholder(params, filters.status)}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return query(
    `SELECT i.*, TO_CHAR(i.created_at, 'YYYY-MM-DD') AS inquiry_date
     FROM tourism_inquiries i
     ${whereSql}
     ORDER BY i.created_at DESC, i.id DESC`,
    params
  );
}

async function getPublicInquiry(id) {
  const rows = await query(
    `SELECT i.*, TO_CHAR(i.created_at, 'YYYY-MM-DD') AS inquiry_date
     FROM tourism_inquiries i
     WHERE i.id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function updatePublicInquiryStatus(id, status) {
  await query(
    `UPDATE tourism_inquiries
     SET status = $1
     WHERE id = $2`,
    [status, id]
  );
  return getPublicInquiry(id);
}

async function getInquiry(id) {
  const rows = await query('SELECT * FROM visitor_inquiries WHERE id = $1 LIMIT 1', [id]);
  if (!rows[0]) return null;
  const responses = await query(
    `SELECT ir.*, u.full_name AS responded_by
     FROM visitor_inquiry_responses ir
     LEFT JOIN visitor_users u ON CAST(u.id AS text) = ir.responded_by_user_id
     WHERE ir.inquiry_id = $1
     ORDER BY ir.created_at DESC`,
    [id]
  );
  return { ...rows[0], responses };
}

async function respondInquiry(id, responseMessage, userId) {
  await query(
    `INSERT INTO visitor_inquiry_responses (inquiry_id, responded_by_user_id, response_message)
     VALUES ($1, $2, $3)`,
    [id, userId, responseMessage]
  );
  await updateInquiryStatus(id, 'responded');
  return getInquiry(id);
}

async function updateInquiryStatus(id, status) {
  await query('UPDATE visitor_inquiries SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);
  return getInquiry(id);
}

async function visitorSummary(filters = {}) {
  const rows = await listVisitors(filters);
  const totals = rows.reduce(
    (acc, row) => {
      acc.total_visitors += 1;
      if (row.visitor_type === 'local') acc.local_visitors += 1;
      if (row.visitor_type === 'domestic') acc.domestic_tourists += 1;
      if (row.visitor_type === 'international') acc.international_tourists += 1;
      if (row.source_type === 'museum') acc.museum_visitors += 1;
      return acc;
    },
    {
      total_visitors: 0,
      local_visitors: 0,
      domestic_tourists: 0,
      international_tourists: 0,
      museum_visitors: 0,
    }
  );
  return {
    ...totals,
    rows,
  };
}

async function visitorTrend(filters = {}) {
  const { whereSql, params } = buildVisitorWhere(filters);
  return query(
    `SELECT TO_CHAR(vr.visit_date, 'YYYY-MM-DD') AS date, COUNT(*) AS count
     FROM visitor_records vr
     ${whereSql}
     GROUP BY TO_CHAR(vr.visit_date, 'YYYY-MM-DD'), CAST(vr.visit_date AS date)
     ORDER BY CAST(vr.visit_date AS date) ASC
     LIMIT 30`,
    params
  );
}

async function classification(filters = {}) {
  const { whereSql, params } = buildVisitorWhere(filters);
  const rows = await query(
    `SELECT vr.visitor_type, COUNT(*) AS count
     FROM visitor_records vr
     ${whereSql}
     GROUP BY vr.visitor_type`,
    params
  );
  return {
    local: rows.find((row) => row.visitor_type === 'local')?.count || 0,
    domestic: rows.find((row) => row.visitor_type === 'domestic')?.count || 0,
    international: rows.find((row) => row.visitor_type === 'international')?.count || 0,
  };
}

async function listEstablishments() {
  return query('SELECT * FROM visitor_establishments ORDER BY name ASC');
}

async function findEstablishmentByName(name) {
  const rows = await query('SELECT * FROM visitor_establishments WHERE LOWER(name) = LOWER($1) LIMIT 1', [name]);
  return rows[0] || null;
}

async function findFirstEstablishmentByType(type) {
  const rows = await query(
    `SELECT * FROM visitor_establishments
     WHERE LOWER(type) IN ($1, $2)
     ORDER BY id ASC
     LIMIT 1`,
    [type, type === 'museum' ? 'cultural site' : type]
  );
  return rows[0] || null;
}

async function createEstablishment(payload) {
  const values = {
    name: payload.name,
    type: payload.type,
    address: payload.address || '',
    contact_number: payload.contact_number || '',
    email: payload.email || '',
    is_active: payload.is_active === undefined ? true : Boolean(payload.is_active),
  };
  const insert = insertSql('visitor_establishments', values);
  const rows = await query(insert.sql, insert.params);
  const created = await query('SELECT * FROM visitor_establishments WHERE id = $1', [rows[0].id]);
  return created[0];
}

async function updateEstablishment(id, payload) {
  const allowed = ['name', 'type', 'address', 'contact_number', 'email', 'is_active'];
  const values = Object.fromEntries(allowed.filter((key) => payload[key] !== undefined).map((key) => [key, payload[key]]));
  if (values.is_active !== undefined) {
    values.is_active = Boolean(values.is_active);
  }
  if (Object.keys(values).length) {
    const update = updateSql('visitor_establishments', id, values);
    await query(update.sql, update.params);
  }
  const rows = await query('SELECT * FROM visitor_establishments WHERE id = $1', [id]);
  return rows[0] || null;
}

async function createUser(payload) {
  const columns = await tableColumns('visitor_users');
  const aliases = {
    assigned_establishment_id: columns.includes('assigned_establishment_id')
      ? 'assigned_establishment_id'
      : 'assigned_resort_id',
  };
  const values = pickColumns(
    {
      full_name: payload.full_name,
      username: payload.username,
      password: payload.password,
      password_hash: payload.password_hash,
      role: payload.role,
      assigned_establishment_id: payload.assigned_establishment_id,
      email: payload.email || '',
      status: payload.status || 'active',
      is_active: payload.status === 'inactive' ? false : true,
    },
    columns,
    aliases
  );

  if (!columns.includes('role') && columns.includes('role_id')) {
    values.role_id = payload.role === 'admin' ? 1 : payload.role === 'receptionist' ? 2 : 3;
  }

  const insert = insertSql('visitor_users', values);
  const result = await query(insert.sql, insert.params);
  const rows = await query('SELECT * FROM visitor_users WHERE id = $1 LIMIT 1', [result[0].id]);
  const lookups = await lookupRows();
  return safeUser(normalizeUser(rows[0], lookups.establishments, lookups.roles));
}

async function updateUser(id, payload) {
  const columns = await tableColumns('visitor_users');
  const aliases = {
    assigned_establishment_id: columns.includes('assigned_establishment_id')
      ? 'assigned_establishment_id'
      : 'assigned_resort_id',
  };
  const values = pickColumns(payload, columns, aliases);

  if (values.is_active !== undefined) {
    values.is_active = Boolean(values.is_active);
  }
  if (payload.role && !columns.includes('role') && columns.includes('role_id')) {
    values.role_id = payload.role === 'admin' ? 1 : payload.role === 'receptionist' ? 2 : 3;
  }

  if (Object.keys(values).length) {
    const update = updateSql('visitor_users', id, values);
    await query(update.sql, update.params);
  }

  const rows = await query('SELECT * FROM visitor_users WHERE id = $1 LIMIT 1', [id]);
  const lookups = await lookupRows();
  return rows[0] ? safeUser(normalizeUser(rows[0], lookups.establishments, lookups.roles)) : null;
}

module.exports = {
  safeUser,
  findUserByUsername,
  findUserById,
  listUsers,
  createUser,
  updateUser,
  createVisitor,
  listTouristCountLogs,
  listVisitors,
  getVisitor,
  updateVisitor,
  updateVisitorStatus,
  deleteVisitor,
  dashboardSummary,
  receptionistSummary,
  createInquiry,
  listInquiries,
  getPublicInquiry,
  updatePublicInquiryStatus,
  getInquiry,
  respondInquiry,
  updateInquiryStatus,
  visitorSummary,
  visitorTrend,
  classification,
  listEstablishments,
  findEstablishmentByName,
  findFirstEstablishmentByType,
  createEstablishment,
  updateEstablishment,
};
