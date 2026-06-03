const { legacyQuery: query, legacyTransaction: transaction } = require('../../config/db');

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
    status: row.status || (row.is_active === 0 ? 'inactive' : 'active'),
  };
}

async function lookupRows() {
  const establishments = await query('SELECT id, name, type FROM establishments ORDER BY name').catch(() => []);
  const roles = await query('SELECT id, name FROM roles ORDER BY id').catch(() => []);
  return { establishments, roles };
}

async function findUserByUsername(username) {
  const rows = await query('SELECT * FROM users WHERE username = :username LIMIT 1', { username });
  const lookups = await lookupRows();
  return normalizeUser(rows[0], lookups.establishments, lookups.roles);
}

async function findUserById(id) {
  const rows = await query('SELECT * FROM users WHERE id = :id LIMIT 1', { id });
  const lookups = await lookupRows();
  return normalizeUser(rows[0], lookups.establishments, lookups.roles);
}

async function listUsers() {
  const rows = await query('SELECT * FROM users ORDER BY id ASC');
  const lookups = await lookupRows();
  return rows.map((row) => safeUser(normalizeUser(row, lookups.establishments, lookups.roles)));
}

async function tableColumns(tableName) {
  const rows = await query(`SHOW COLUMNS FROM ${tableName}`).catch(() => []);
  return rows.map((row) => row.Field);
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

function visitorSelectSql() {
  return `
    SELECT
      vr.*,
      DATE_FORMAT(vr.visit_date, '%Y-%m-%d') AS visit_date,
      e.name AS establishment_name,
      e.type AS establishment_type,
      u.full_name AS encoded_by,
      (
        SELECT COUNT(*)
        FROM visitor_companions vc
        WHERE vc.visitor_record_id = vr.id
      ) AS companion_count
    FROM visitor_records vr
    LEFT JOIN establishments e ON e.id = vr.establishment_id
    LEFT JOIN users u ON u.id = vr.recorded_by_user_id
  `;
}

function buildVisitorWhere(filters = {}) {
  const where = [];
  const params = {};

  if (filters.date_from) {
    where.push('DATE(vr.visit_date) >= :date_from');
    params.date_from = filters.date_from;
  }
  if (filters.date_to) {
    where.push('DATE(vr.visit_date) <= :date_to');
    params.date_to = filters.date_to;
  }
  if (filters.establishment_id) {
    where.push('vr.establishment_id = :establishment_id');
    params.establishment_id = filters.establishment_id;
  }
  if (filters.visitor_type) {
    where.push('vr.visitor_type = :visitor_type');
    params.visitor_type = filters.visitor_type;
  }
  if (filters.nationality) {
    where.push('vr.nationality = :nationality');
    params.nationality = filters.nationality;
  }
  if (filters.source_type) {
    where.push('vr.source_type = :source_type');
    params.source_type = filters.source_type;
  }
  if (filters.status) {
    where.push('vr.status = :status');
    params.status = filters.status;
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
}

async function companionsFor(visitorId) {
  return query(
    `SELECT id, visitor_record_id, full_name, age_group, gender, nationality, created_at
     FROM visitor_companions
     WHERE visitor_record_id = :visitorId
     ORDER BY id ASC`,
    { visitorId }
  );
}

async function createVisitor(payload) {
  const groupId = payload.group_id || `GRP-${Date.now()}`;
  const visitorId = await transaction(async (connection) => {
    const [result] = await connection.execute(
      `INSERT INTO visitor_records (
        group_id, establishment_id, recorded_by_user_id, full_name, contact_number, email,
        gender, age_group, visitor_type, nationality, province, country, address,
        purpose_of_visit, visit_date, check_in_time, check_out_time, status, source_type
      ) VALUES (
        :group_id, :establishment_id, :recorded_by_user_id, :full_name, :contact_number, :email,
        :gender, :age_group, :visitor_type, :nationality, :province, :country, :address,
        :purpose_of_visit, :visit_date, :check_in_time, :check_out_time, :status, :source_type
      )`,
      {
        group_id: groupId,
        establishment_id: payload.establishment_id || null,
        recorded_by_user_id: payload.recorded_by_user_id,
        full_name: payload.full_name,
        contact_number: payload.contact_number || '',
        email: payload.email || '',
        gender: payload.gender || '',
        age_group: payload.age_group || 'adult',
        visitor_type: payload.visitor_type || 'local',
        nationality: payload.nationality || 'Filipino',
        province: payload.province || '',
        country: payload.country || 'Philippines',
        address: payload.address || '',
        purpose_of_visit: payload.purpose_of_visit || '',
        visit_date: payload.visit_date,
        check_in_time: payload.check_in_time || null,
        check_out_time: payload.check_out_time || null,
        status: payload.status || 'recorded',
        source_type: payload.source_type || 'tourism_office',
      }
    );

    const createdVisitorId = result.insertId;
    for (const companion of payload.companions || []) {
      if (!companion.full_name) continue;
      await connection.execute(
        `INSERT INTO visitor_companions (
          visitor_record_id, full_name, age_group, gender, nationality
        ) VALUES (
          :visitor_record_id, :full_name, :age_group, :gender, :nationality
        )`,
        {
          visitor_record_id: createdVisitorId,
          full_name: companion.full_name,
          age_group: companion.age_group || 'adult',
          gender: companion.gender || '',
          nationality: companion.nationality || payload.nationality || 'Filipino',
        }
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
  const rows = await query(`${visitorSelectSql()} WHERE vr.id = :id LIMIT 1`, { id });
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
  const entries = allowed.filter((key) => payload[key] !== undefined).map((key) => [key, payload[key]]);
  if (!entries.length) return getVisitor(id);

  const setSql = entries.map(([key]) => `${key} = :${key}`).join(', ');
  await query(`UPDATE visitor_records SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`, {
    id,
    ...Object.fromEntries(entries),
  });
  return getVisitor(id);
}

async function updateVisitorStatus(id, status) {
  await query('UPDATE visitor_records SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id', { id, status });
  return getVisitor(id);
}

async function deleteVisitor(id) {
  const existing = await getVisitor(id);
  if (!existing) return false;
  await query('DELETE FROM visitor_records WHERE id = :id', { id });
  return true;
}

async function dashboardSummary() {
  const rows = await query(`
    SELECT
      MAX(d.report_date) AS report_date,
      COALESCE(SUM(DATE(vr.visit_date) = d.report_date), 0) AS total_visitors_today,
      COALESCE(SUM(vr.visitor_type = 'local'), 0) AS local_visitors,
      COALESCE(SUM(vr.visitor_type = 'domestic'), 0) AS domestic_tourists,
      COALESCE(SUM(vr.visitor_type = 'international'), 0) AS international_tourists,
      COALESCE(SUM(vr.source_type = 'museum' AND DATE(vr.visit_date) = d.report_date), 0) AS museum_visitors
    FROM visitor_records vr
    CROSS JOIN (
      SELECT COALESCE(
        MAX(CASE WHEN DATE(visit_date) = CURDATE() THEN DATE(visit_date) END),
        MAX(DATE(visit_date)),
        CURDATE()
      ) AS report_date
      FROM visitor_records
    ) d
  `);
  const inquiries = await query(`SELECT COUNT(*) AS pending_inquiries FROM inquiries WHERE status = 'pending'`);
  const establishments = await query(`SELECT COUNT(*) AS total_destinations FROM establishments WHERE is_active = 1`).catch(() => [
    { total_destinations: 0 },
  ]);
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
  const params = { establishment_id: user.assigned_establishment_id };
  const rows = await query(
    `
      SELECT
        MAX(d.report_date) AS report_date,
        COALESCE(SUM(DATE(vr.visit_date) = d.report_date), 0) AS total_guests_today,
        COALESCE(SUM(visitor_type = 'local'), 0) AS local_guests,
        COALESCE(SUM(visitor_type IN ('domestic', 'international')), 0) AS foreign_guests,
        COALESCE(SUM(group_id IS NOT NULL), 0) AS group_registrations,
        COALESCE(SUM(status = 'checked_in'), 0) AS checked_in_guests,
        COALESCE(SUM(status = 'pending'), 0) AS pending_arrivals,
        COALESCE(SUM(YEAR(vr.visit_date) = YEAR(d.report_date) AND MONTH(vr.visit_date) = MONTH(d.report_date)), 0) AS total_records_this_month
      FROM visitor_records vr
      CROSS JOIN (
        SELECT COALESCE(
          MAX(CASE WHEN DATE(visit_date) = CURDATE() THEN DATE(visit_date) END),
          MAX(DATE(visit_date)),
          CURDATE()
        ) AS report_date
        FROM visitor_records
        WHERE establishment_id = :establishment_id
      ) d
      WHERE vr.establishment_id = :establishment_id
    `,
    params
  );
  const recent_arrivals = await listVisitors({ establishment_id: user.assigned_establishment_id });
  return {
    ...rows[0],
    recent_arrivals: recent_arrivals.slice(0, 5),
  };
}

async function createInquiry(payload) {
  const result = await query(
    `INSERT INTO inquiries (full_name, email, contact_number, subject, message, status)
     VALUES (:full_name, :email, :contact_number, :subject, :message, 'pending')`,
    payload
  );
  return getInquiry(result.insertId);
}

async function listInquiries(filters = {}) {
  const where = [];
  const params = {};
  if (filters.status) {
    where.push('i.status = :status');
    params.status = filters.status;
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return query(
    `SELECT i.*, DATE_FORMAT(i.created_at, '%Y-%m-%d') AS inquiry_date
     FROM inquiries i
     ${whereSql}
     ORDER BY i.created_at DESC, i.id DESC`,
    params
  );
}

async function getInquiry(id) {
  const rows = await query('SELECT * FROM inquiries WHERE id = :id LIMIT 1', { id });
  if (!rows[0]) return null;
  const responses = await query(
    `SELECT ir.*, u.full_name AS responded_by
     FROM inquiry_responses ir
     LEFT JOIN users u ON u.id = ir.responded_by_user_id
     WHERE ir.inquiry_id = :id
     ORDER BY ir.created_at DESC`,
    { id }
  );
  return { ...rows[0], responses };
}

async function respondInquiry(id, responseMessage, userId) {
  await query(
    `INSERT INTO inquiry_responses (inquiry_id, responded_by_user_id, response_message)
     VALUES (:inquiry_id, :responded_by_user_id, :response_message)`,
    {
      inquiry_id: id,
      responded_by_user_id: userId,
      response_message: responseMessage,
    }
  );
  await updateInquiryStatus(id, 'responded');
  return getInquiry(id);
}

async function updateInquiryStatus(id, status) {
  await query('UPDATE inquiries SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id', { id, status });
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
    `SELECT DATE_FORMAT(vr.visit_date, '%Y-%m-%d') AS date, COUNT(*) AS count
     FROM visitor_records vr
     ${whereSql}
     GROUP BY DATE_FORMAT(vr.visit_date, '%Y-%m-%d')
     ORDER BY DATE(vr.visit_date) ASC
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
  return query('SELECT * FROM establishments ORDER BY name ASC');
}

async function findEstablishmentByName(name) {
  const rows = await query('SELECT * FROM establishments WHERE LOWER(name) = LOWER(:name) LIMIT 1', { name });
  return rows[0] || null;
}

async function findFirstEstablishmentByType(type) {
  const rows = await query(
    `SELECT * FROM establishments
     WHERE LOWER(type) IN (:type, :altType)
     ORDER BY id ASC
     LIMIT 1`,
    { type, altType: type === 'museum' ? 'cultural site' : type }
  );
  return rows[0] || null;
}

async function createEstablishment(payload) {
  const result = await query(
    `INSERT INTO establishments (name, type, address, contact_number, email, is_active)
     VALUES (:name, :type, :address, :contact_number, :email, :is_active)`,
    {
      name: payload.name,
      type: payload.type,
      address: payload.address || '',
      contact_number: payload.contact_number || '',
      email: payload.email || '',
      is_active: payload.is_active === undefined ? 1 : payload.is_active,
    }
  );
  const rows = await query('SELECT * FROM establishments WHERE id = :id', { id: result.insertId });
  return rows[0];
}

async function updateEstablishment(id, payload) {
  const allowed = ['name', 'type', 'address', 'contact_number', 'email', 'is_active'];
  const entries = allowed.filter((key) => payload[key] !== undefined).map((key) => [key, payload[key]]);
  if (entries.length) {
    const setSql = entries.map(([key]) => `${key} = :${key}`).join(', ');
    await query(`UPDATE establishments SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`, {
      id,
      ...Object.fromEntries(entries),
    });
  }
  const rows = await query('SELECT * FROM establishments WHERE id = :id', { id });
  return rows[0] || null;
}

async function createUser(payload) {
  const columns = await tableColumns('users');
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
      is_active: payload.status === 'inactive' ? 0 : 1,
    },
    columns,
    aliases
  );

  if (!columns.includes('role') && columns.includes('role_id')) {
    values.role_id = payload.role === 'admin' ? 1 : payload.role === 'receptionist' ? 2 : 3;
  }

  const keys = Object.keys(values);
  const sql = `INSERT INTO users (${keys.join(', ')}) VALUES (${keys.map((key) => `:${key}`).join(', ')})`;
  const result = await query(sql, values);
  const createdId = result.insertId || result[0]?.insertId;
  const rows = await query('SELECT * FROM users WHERE id = :id LIMIT 1', { id: createdId });
  const lookups = await lookupRows();
  return safeUser(normalizeUser(rows[0], lookups.establishments, lookups.roles));
}

async function updateUser(id, payload) {
  const columns = await tableColumns('users');
  const aliases = {
    assigned_establishment_id: columns.includes('assigned_establishment_id')
      ? 'assigned_establishment_id'
      : 'assigned_resort_id',
  };
  const values = pickColumns(payload, columns, aliases);

  if (payload.role && !columns.includes('role') && columns.includes('role_id')) {
    values.role_id = payload.role === 'admin' ? 1 : payload.role === 'receptionist' ? 2 : 3;
  }

  const keys = Object.keys(values);
  if (keys.length) {
    await query(`UPDATE users SET ${keys.map((key) => `${key} = :${key}`).join(', ')} WHERE id = :id`, {
      id,
      ...values,
    });
  }

  const rows = await query('SELECT * FROM users WHERE id = :id LIMIT 1', { id });
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
  listVisitors,
  getVisitor,
  updateVisitor,
  updateVisitorStatus,
  deleteVisitor,
  dashboardSummary,
  receptionistSummary,
  createInquiry,
  listInquiries,
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
