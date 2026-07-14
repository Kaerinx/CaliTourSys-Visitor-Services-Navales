const bcrypt = require('bcryptjs');
const model = require('./visitor.model');
const { signToken } = require('../../middleware/auth');
const { query: pgQuery } = require('../../config/db');
const { hashPassword } = require('../../utils/password');
const { requireGender } = require('../booking/bookingRules');

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function required(payload, fields) {
  const missing = fields.filter((field) => payload[field] === undefined || payload[field] === null || payload[field] === '');
  if (missing.length) {
    throw httpError(422, `Missing required field(s): ${missing.join(', ')}`);
  }
}

function normalizeType(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeVisitorGenders(payload) {
  return {
    ...payload,
    gender: payload.gender ? requireGender(payload.gender) : payload.gender,
    companions: Array.isArray(payload.companions)
      ? payload.companions.map((companion, index) => ({
          ...companion,
          gender: companion.gender
            ? requireGender(companion.gender, `Companion ${index + 1} gender`)
            : companion.gender,
        }))
      : payload.companions,
  };
}

function classifyVisitor(payload) {
  if (payload.visitor_type) return normalizeType(payload.visitor_type);

  const nationality = normalizeType(payload.nationality || 'Filipino');
  const address = normalizeType(payload.address);
  const province = normalizeType(payload.province);
  const country = normalizeType(payload.country);

  if (nationality && nationality !== 'filipino') return 'international';
  if (country && country !== 'philippines') return 'international';
  if (address.includes('calabanga') || province.includes('camarines sur')) return 'local';
  return 'domestic';
}

function sourceTypeFromEstablishment(establishment) {
  const type = normalizeType(establishment?.type);
  if (!type) return '';
  if (type.includes('museum') || type.includes('cultural')) return 'museum';
  if (type.includes('heritage')) return 'heritage';
  if (type.includes('resort')) return 'resort';
  return type.replace(/\s+/g, '_');
}

async function sourceTypeForEstablishment(establishmentId) {
  if (!establishmentId) return '';
  const establishments = await model.listEstablishments();
  return sourceTypeFromEstablishment(establishments.find((item) => Number(item.id) === Number(establishmentId)));
}

function scopedFilters(filters, user) {
  const next = { ...filters };
  const assignedId = user.assigned_establishment_id || user.assigned_resort_id;
  if (user.role === 'receptionist') {
    if (assignedId) {
      next.establishment_id = assignedId;
    } else {
      delete next.establishment_id;
    }
  }
  return next;
}

function normalizeRole(value) {
  const role = String(value || '').trim().toLowerCase();
  if (role === 'system administrator') return 'admin';
  if (role === 'tourism staff') return 'tourism_staff';
  if (role === 'receptionist desk') return 'receptionist';
  return role || 'tourism_staff';
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : '',
  };
}

let cmsUserColumnCache = null;

async function cmsUserColumns() {
  if (cmsUserColumnCache) return cmsUserColumnCache;
  const result = await pgQuery(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users'`
  );
  cmsUserColumnCache = new Set(result.rows.map((row) => row.column_name));
  return cmsUserColumnCache;
}

function buildInsertSql(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== undefined);
  const columns = entries.map(([column]) => column);
  const params = entries.map(([, value]) => value);
  const placeholders = params.map((_, index) => `$${index + 1}`);
  return {
    sql: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`,
    params,
  };
}

function buildUpdateSql(table, id, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== undefined);
  const sets = entries.map(([column], index) => `${column} = $${index + 1}`);
  const params = entries.map(([, value]) => value);
  params.push(id);
  return {
    sql: `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING id`,
    params,
  };
}

async function findCmsUserByEmail(email) {
  if (!email) return null;
  const result = await pgQuery('SELECT id, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
  return result.rows[0] || null;
}

function cmsRoleKey(role) {
  if (role === 'admin') return 'system_admin';
  return role;
}

async function assignCmsRole(userId, role) {
  const columns = await cmsUserColumns();
  if (columns.has('role')) return;

  const roleResult = await pgQuery('SELECT id FROM roles WHERE role_key = $1 LIMIT 1', [cmsRoleKey(role)]);
  const roleId = roleResult.rows[0]?.id;
  if (!roleId) return;

  await pgQuery('DELETE FROM user_roles WHERE user_id = $1', [userId]);
  await pgQuery(
    `INSERT INTO user_roles (user_id, role_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, role_id) DO NOTHING`,
    [userId, roleId]
  );
}

async function syncCmsUserAccount(payload, existingVisitorUser = null) {
  const email = normalizeEmail(payload.email || existingVisitorUser?.email);
  if (!email) throw httpError(422, 'Email is required for CMS login.');

  const columns = await cmsUserColumns();
  const fullName = String(payload.full_name || existingVisitorUser?.full_name || payload.username || '').trim();
  const { firstName, lastName } = splitName(fullName);
  const status = payload.status || existingVisitorUser?.status || 'active';
  const role = normalizeRole(payload.role || existingVisitorUser?.role || 'tourism_staff');
  const password = payload.password ? String(payload.password) : null;
  const password_hash = password ? await hashPassword(password) : undefined;

  const oldEmail = normalizeEmail(existingVisitorUser?.email);
  const currentCmsUser = oldEmail ? await findCmsUserByEmail(oldEmail) : null;
  const targetCmsUser = await findCmsUserByEmail(email);

  if (currentCmsUser && targetCmsUser && Number(currentCmsUser.id) !== Number(targetCmsUser.id)) {
    throw httpError(409, 'Email is already used by another CMS account.');
  }

  const cmsUser = currentCmsUser || targetCmsUser;
  const values = {
    email,
    password_hash,
    display_name: columns.has('display_name') ? fullName : undefined,
    first_name: columns.has('first_name') ? firstName : undefined,
    last_name: columns.has('last_name') ? lastName : undefined,
    role: columns.has('role') ? role : undefined,
    status: columns.has('status') ? status : undefined,
    email_verified_at: columns.has('email_verified_at') && !cmsUser ? new Date() : undefined,
    password_changed_at: columns.has('password_changed_at') && password_hash ? new Date() : undefined,
    updated_at: columns.has('updated_at') ? new Date() : undefined,
  };

  if (cmsUser) {
    const update = buildUpdateSql('users', cmsUser.id, values);
    await pgQuery(update.sql, update.params);
    await assignCmsRole(cmsUser.id, role);
    return cmsUser.id;
  }

  if (!password_hash) {
    throw httpError(422, 'Password is required when creating a CMS login account.');
  }

  const insert = buildInsertSql('users', {
    ...values,
    created_at: columns.has('created_at') ? new Date() : undefined,
  });
  const result = await pgQuery(insert.sql, insert.params);
  const userId = result.rows[0]?.id || null;
  if (userId) await assignCmsRole(userId, role);
  return userId;
}

async function login(payload) {
  required(payload, ['username', 'password']);

  const username = String(payload.username || '').trim();
  const loginAliases = {
    staff: 'tourism_staff',
    tourismstaff: 'tourism_staff',
    tourism_staff: 'tourism_staff',
    beachreceptionist: 'beach_reception',
    beach_receptionist: 'beach_reception',
    beach_reception: 'beach_reception',
    ecoreceptionist: 'ecopark_reception',
    eco_receptionist: 'ecopark_reception',
    ecopark_reception: 'ecopark_reception',
  };
  const lookupUsername = loginAliases[username.toLowerCase().replace(/\s+/g, '_')] || username;

  const user = await model.findUserByUsername(lookupUsername);
  if (!user) {
    throw httpError(401, 'Invalid username or password.');
  }

  const passwordOk = user.password_hash
    ? await bcrypt.compare(payload.password, user.password_hash)
    : payload.password === user.password;

  if (!passwordOk) {
    throw httpError(401, 'Invalid username or password.');
  }

  const inactive = user.status === 'inactive' || Number(user.is_active) === 0;
  if (inactive) {
    throw httpError(403, 'Your account has been deactivated. Please contact the system administrator.');
  }

  const safeUser = model.safeUser(user);
  const token = signToken(safeUser);
  return { token, user: safeUser };
}

async function updateProfile(payload, currentUser) {
  const id = currentUser?.id;
  if (!id) throw httpError(401, 'Authentication required.');

  const allowed = {
    full_name: payload.full_name,
    email: payload.email || payload.email_address,
    contact_number: payload.contact_number,
  };

  Object.keys(allowed).forEach((key) => {
    if (allowed[key] === undefined) {
      delete allowed[key];
    } else if (typeof allowed[key] === 'string') {
      allowed[key] = allowed[key].trim();
    }
  });

  if (!Object.keys(allowed).length) {
    throw httpError(422, 'No editable profile fields were provided.');
  }

  const user = await model.updateUser(id, allowed);
  if (!user) throw httpError(404, 'User not found.');
  return user;
}

async function changePassword(payload, currentUser) {
  const id = currentUser?.id;
  if (!id) throw httpError(401, 'Authentication required.');

  const currentPassword = payload.current_password || payload.currentPassword;
  const newPassword = payload.new_password || payload.newPassword;
  required({ current_password: currentPassword, new_password: newPassword }, ['current_password', 'new_password']);

  if (String(newPassword).length < 6) {
    throw httpError(422, 'New password must be at least 6 characters long.');
  }

  const storedUser = await model.findUserById(id);
  if (!storedUser) throw httpError(404, 'User not found.');

  const passwordHash = storedUser.password_hash;
  const passwordMatches = passwordHash
    ? await bcrypt.compare(String(currentPassword), passwordHash)
    : String(currentPassword) === String(storedUser.password || '');

  if (!passwordMatches) {
    throw httpError(401, 'Current password is incorrect.');
  }

  await model.updateUser(id, {
    password: newPassword,
    password_hash: await bcrypt.hash(String(newPassword), 10),
  });

  return { message: 'Password changed successfully.' };
}

async function dashboardSummary(user) {
  return model.dashboardSummary(user);
}

async function receptionistSummary(user) {
  let assignedId = user.assigned_establishment_id || user.assigned_resort_id;
  if (!assignedId && user.role === 'receptionist') {
    const resort = await model.findFirstEstablishmentByType('resort');
    assignedId = resort?.id || null;
  }
  if (!assignedId && user.role === 'receptionist') {
    throw httpError(403, 'No resort establishment is available for this receptionist account.');
  }
  return model.receptionistSummary({ ...user, assigned_establishment_id: assignedId });
}

async function createVisitor(payload, user) {
  required(payload, ['full_name', 'visit_date']);

  payload = normalizeVisitorGenders(payload);

  const visitor = {
    ...payload,
    visitor_type: classifyVisitor(payload),
    status: normalizeType(payload.status || 'recorded'),
    source_type: normalizeType(payload.source_type || 'tourism_office'),
    recorded_by_user_id: user.id,
  };

  if (user.role === 'receptionist') {
    const assignedId = user.assigned_establishment_id || user.assigned_resort_id || payload.establishment_id;
    if (assignedId) {
      visitor.establishment_id = assignedId;
      visitor.source_type = (await sourceTypeForEstablishment(assignedId)) || visitor.source_type;
    } else {
      const resort = await model.findFirstEstablishmentByType('resort');
      visitor.establishment_id = resort?.id || null;
      visitor.source_type = sourceTypeFromEstablishment(resort) || 'resort';
    }
  }

  if (visitor.source_type === 'museum' && !visitor.establishment_id) {
    const museum = await model.findFirstEstablishmentByType('museum');
    visitor.establishment_id = museum?.id || visitor.establishment_id;
  }

  return model.createVisitor(visitor);
}

async function listVisitors(filters, user) {
  return model.listVisitors(scopedFilters(filters, user));
}

async function getVisitor(id, user) {
  const visitor = await model.getVisitor(id);
  if (!visitor) throw httpError(404, 'Visitor record not found.');
  const assignedId = user.assigned_establishment_id || user.assigned_resort_id;
  if (user.role === 'receptionist' && Number(visitor.establishment_id) !== Number(assignedId)) {
    throw httpError(404, 'Visitor record not found.');
  }
  return visitor;
}

async function updateVisitor(id, payload, user) {
  await getVisitor(id, user);
  payload = normalizeVisitorGenders(payload);
  const next = {
    ...payload,
    visitor_type: payload.visitor_type ? normalizeType(payload.visitor_type) : undefined,
    status: payload.status ? normalizeType(payload.status) : undefined,
    source_type: payload.source_type ? normalizeType(payload.source_type) : undefined,
  };
  if (user.role === 'receptionist') {
    delete next.establishment_id;
    delete next.source_type;
  }
  return model.updateVisitor(id, next);
}

async function updateVisitorStatus(id, status, user) {
  required({ status }, ['status']);
  await getVisitor(id, user);
  return model.updateVisitorStatus(id, normalizeType(status));
}

async function deleteVisitor(id) {
  const deleted = await model.deleteVisitor(id);
  if (!deleted) throw httpError(404, 'Visitor record not found.');
  return { message: 'Visitor record deleted.' };
}

async function createInquiry(payload) {
  required(payload, ['full_name', 'email', 'contact_number', 'subject', 'message']);
  return model.createInquiry(payload);
}

async function listInquiries(filters) {
  const nextFilters = { ...filters };
  if (nextFilters.status) nextFilters.status = normalizeInquiryStatus(nextFilters.status);
  return model.listInquiries(nextFilters);
}

async function getInquiry(id) {
  const inquiry = await model.getInquiry(id);
  if (!inquiry) throw httpError(404, 'Inquiry not found.');
  return inquiry;
}

async function respondInquiry(id, payload, user) {
  required(payload, ['response_message']);
  await getInquiry(id);
  return model.respondInquiry(id, payload.response_message, user.id);
}

async function updateInquiryStatus(id, status) {
  required({ status }, ['status']);
  const inquiry = await model.getPublicInquiry(id);
  if (!inquiry) throw httpError(404, 'Inquiry not found.');
  return model.updatePublicInquiryStatus(id, normalizeInquiryStatus(status));
}

function normalizeInquiryStatus(status) {
  const normalized = normalizeType(status);
  const aliases = {
    pending: 'new',
    reviewed: 'read',
  };
  const resolved = aliases[normalized] || normalized;
  if (!['new', 'read', 'responded', 'archived'].includes(resolved)) {
    throw httpError(422, 'Invalid inquiry status.');
  }
  return resolved;
}

async function visitorSummary(filters, user) {
  return model.visitorSummary(scopedFilters(filters, user));
}

async function visitorTrend(filters, user) {
  return model.visitorTrend(scopedFilters(filters, user));
}

async function classification(filters, user) {
  return model.classification(scopedFilters(filters, user));
}

async function exportVisitorSummary(filters, user) {
  const rows = await model.listVisitors(scopedFilters(filters, user));
  const headers = ['ID', 'Full Name', 'Visitor Type', 'Nationality', 'Establishment', 'Visit Date', 'Status', 'Source Type'];
  const body = rows.map((row) =>
    [
      row.id,
      row.full_name,
      row.visitor_type,
      row.nationality,
      row.establishment_name,
      row.visit_date,
      row.status,
      row.source_type,
    ]
      .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return [headers.join(','), ...body].join('\n');
}

async function listEstablishments() {
  return model.listEstablishments();
}

async function createEstablishment(payload) {
  required(payload, ['name', 'type']);
  const duplicate = await model.findEstablishmentByName(payload.name);
  if (duplicate) {
    throw httpError(409, 'Establishment name already exists.');
  }
  return model.createEstablishment(payload);
}

async function updateEstablishment(id, payload) {
  const establishment = await model.updateEstablishment(id, payload);
  if (!establishment) throw httpError(404, 'Establishment not found.');
  return establishment;
}

async function deactivateEstablishment(id) {
  const establishment = await model.updateEstablishment(id, { is_active: 0 });
  if (!establishment) throw httpError(404, 'Establishment not found.');
  return establishment;
}

async function listUsers() {
  return model.listUsers();
}

async function createUser(payload) {
  required(payload, ['full_name', 'username', 'email', 'role']);
  const role = normalizeRole(payload.role);
  if (role === 'receptionist' && !payload.assigned_establishment_id && !payload.assigned_resort_id) {
    throw httpError(422, 'Receptionist accounts must be assigned to a resort or establishment.');
  }

  const email = normalizeEmail(payload.email);
  const existing = await model.findUserByUsername(payload.username);
  if (existing) {
    throw httpError(409, 'Username already exists.');
  }

  const password = payload.password || 'password123';
  const password_hash = await bcrypt.hash(password, 10);
  const userPayload = {
    ...payload,
    email,
    role,
    password,
    password_hash,
    assigned_establishment_id: payload.assigned_establishment_id || payload.assigned_resort_id || null,
    status: payload.status || 'active',
    is_active: payload.is_active ?? (payload.status === 'inactive' ? 0 : 1),
  };
  const user = await model.createUser(userPayload);
  await syncCmsUserAccount(userPayload);
  return user;
}

async function updateUser(id, payload) {
  const existingUser = await model.findUserById(id);
  if (!existingUser) throw httpError(404, 'User not found.');

  const role = payload.role ? normalizeRole(payload.role) : undefined;
  const assigned_establishment_id = payload.assigned_establishment_id || payload.assigned_resort_id;
  if (role === 'receptionist' && !assigned_establishment_id) {
    throw httpError(422, 'Receptionist accounts must be assigned to a resort or establishment.');
  }

  const next = {
    ...payload,
    role,
    assigned_establishment_id,
  };

  if (payload.email !== undefined) {
    next.email = normalizeEmail(payload.email);
    if (!next.email) throw httpError(422, 'Email is required for CMS login.');
  }

  if (payload.status) {
    next.is_active = payload.status === 'inactive' ? 0 : 1;
  }

  if (payload.is_active !== undefined) {
    next.is_active = payload.is_active ? 1 : 0;
  }

  if (payload.password) {
    next.password = payload.password;
    next.password_hash = await bcrypt.hash(payload.password, 10);
  }

  const user = await model.updateUser(id, next);
  if (!user) throw httpError(404, 'User not found.');
  if (next.email || existingUser.email) {
    await syncCmsUserAccount({ ...next, full_name: user.full_name, username: user.username }, existingUser);
  }
  return user;
}

async function deactivateUser(id) {
  const user = await model.updateUser(id, { status: 'inactive', is_active: 0 });
  if (!user) throw httpError(404, 'User not found.');
  return user;
}

module.exports = {
  login,
  updateProfile,
  changePassword,
  dashboardSummary,
  receptionistSummary,
  createVisitor,
  listVisitors,
  getVisitor,
  updateVisitor,
  updateVisitorStatus,
  deleteVisitor,
  createInquiry,
  listInquiries,
  getInquiry,
  respondInquiry,
  updateInquiryStatus,
  visitorSummary,
  visitorTrend,
  classification,
  exportVisitorSummary,
  listEstablishments,
  createEstablishment,
  updateEstablishment,
  deactivateEstablishment,
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
};
