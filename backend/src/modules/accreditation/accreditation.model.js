const db = require("../../config/db");

async function createUser(user) {
  const result = await db.query(
    `INSERT INTO users (
      first_name, middle_name, last_name, sex, email, password_hash, phone,
      telephone, role, status, verification_token
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING id, first_name, middle_name, last_name, sex, email, phone, telephone, role, status, created_at`,
    [
      user.firstName,
      user.middleName || null,
      user.lastName,
      user.sex || null,
      user.email,
      user.passwordHash,
      user.phone || null,
      user.telephone || null,
      user.role || "business_owner",
      user.status || "pending_verification",
      user.verificationToken || null,
    ]
  );

  return result.rows[0];
}

async function createBusinessOwnerWithProfile(user, profile) {
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `INSERT INTO users (
        first_name, middle_name, last_name, sex, email, password_hash, phone,
        telephone, role, status, verification_token
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id, first_name, middle_name, last_name, sex, email, phone, telephone, role, status, created_at`,
      [
        user.firstName,
        user.middleName || null,
        user.lastName,
        user.sex || null,
        user.email,
        user.passwordHash,
        user.phone || null,
        user.telephone || null,
        "business_owner",
        user.status || "pending_verification",
        user.verificationToken || null,
      ]
    );

    const createdUser = userResult.rows[0];

    await client.query(
      `INSERT INTO business_profiles (
        owner_id, business_name, business_type, business_permit_number,
        dti_sec_registration_number, region, province, city_municipality,
        barangay, street_address, zip_code
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        createdUser.id,
        profile.businessName,
        profile.businessType || null,
        profile.businessPermitNumber || null,
        profile.dtiSecRegistrationNumber || null,
        profile.region,
        profile.province,
        profile.cityMunicipality,
        profile.barangay,
        profile.streetAddress,
        profile.zipCode || null,
      ]
    );

    await client.query("COMMIT");
    return createdUser;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function findUserByEmail(email) {
  const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
}

async function findUserById(id) {
  const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0];
}

async function findUserByVerificationToken(token) {
  const result = await db.query("SELECT * FROM users WHERE verification_token = $1", [token]);
  return result.rows[0];
}

async function verifyUserEmail(userId) {
  const result = await db.query(
    `UPDATE users
     SET status = 'active', email_verified_at = NOW(), verification_token = NULL, updated_at = NOW()
     WHERE id = $1
     RETURNING id, first_name, middle_name, last_name, sex, email, phone, telephone, role, status`,
    [userId]
  );
  return result.rows[0];
}

async function updateLastLogin(userId) {
  await db.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [userId]);
}

async function updateAccountProfile(userId, profile) {
  const result = await db.query(
    `UPDATE users
     SET first_name = $2,
       middle_name = $3,
       last_name = $4,
       sex = $5,
       email = $6,
       phone = $7,
       telephone = $8,
       updated_at = NOW()
     WHERE id = $1
     RETURNING id, first_name, middle_name, last_name, sex, email, phone, telephone, role, status`,
    [
      userId,
      profile.firstName,
      profile.middleName || null,
      profile.lastName,
      profile.sex || null,
      profile.email.toLowerCase(),
      profile.phone || null,
      profile.telephone || null,
    ]
  );
  return result.rows[0];
}

async function updatePasswordHash(userId, passwordHash) {
  const result = await db.query(
    `UPDATE users
     SET password_hash = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, first_name, middle_name, last_name, sex, email, phone, telephone, role, status`,
    [userId, passwordHash]
  );
  return result.rows[0];
}

async function createBusinessProfile(ownerId, profile) {
  const result = await db.query(
    `INSERT INTO business_profiles (
      owner_id, business_name, business_type, business_permit_number,
      dti_sec_registration_number, region, province, city_municipality,
      barangay, street_address, zip_code
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`,
    [
      ownerId,
      profile.businessName,
      profile.businessType || null,
      profile.businessPermitNumber || null,
      profile.dtiSecRegistrationNumber || null,
      profile.region,
      profile.province,
      profile.cityMunicipality,
      profile.barangay,
      profile.streetAddress,
      profile.zipCode || null,
    ]
  );
  return result.rows[0];
}

async function getBusinessProfile(ownerId) {
  const result = await db.query(
    `SELECT b.*, u.email, u.phone
     FROM business_profiles b
     JOIN users u ON u.id = b.owner_id
     WHERE b.owner_id = $1
     ORDER BY b.created_at DESC
     LIMIT 1`,
    [ownerId]
  );
  return result.rows[0];
}

async function updateBusinessProfile(ownerId, profile) {
  const result = await db.query(
    `UPDATE business_profiles
     SET business_name = $2,
       business_type = $3,
       business_permit_number = $4,
       dti_sec_registration_number = $5,
       region = $6,
       province = $7,
       city_municipality = $8,
       barangay = $9,
       street_address = $10,
       zip_code = $11,
       updated_at = NOW()
     WHERE id = (
       SELECT id FROM business_profiles
       WHERE owner_id = $1
       ORDER BY created_at DESC
       LIMIT 1
     )
     RETURNING *`,
    [
      ownerId,
      profile.businessName,
      profile.businessType || null,
      profile.businessPermitNumber || null,
      profile.dtiSecRegistrationNumber || null,
      profile.region,
      profile.province,
      profile.cityMunicipality,
      profile.barangay,
      profile.streetAddress,
      profile.zipCode || null,
    ]
  );

  if (profile.phone !== undefined) {
    await db.query("UPDATE users SET phone = $2, updated_at = NOW() WHERE id = $1", [
      ownerId,
      profile.phone || null,
    ]);
  }

  return result.rows[0];
}

async function createApplication(ownerId, application) {
  const result = await db.query(
    `INSERT INTO accreditation_applications (
      application_number, owner_id, business_profile_id, accreditation_type,
      business_type, business_permit_number, dti_sec_registration_number,
      status, owner_remarks, remarks, submitted_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`,
    [
      application.applicationNumber,
      ownerId,
      application.businessProfileId,
      application.accreditationType,
      application.businessType,
      application.businessPermitNumber,
      application.dtiSecRegistrationNumber || null,
      application.status || "draft",
      application.remarks || null,
      application.remarks || null,
      application.status === "submitted" ? new Date() : null,
    ]
  );
  return result.rows[0];
}

async function updateApplicationDraft(id, ownerId, application) {
  const result = await db.query(
    `UPDATE accreditation_applications
     SET accreditation_type = $3,
       business_type = $4,
       business_permit_number = $5,
       dti_sec_registration_number = $6,
       owner_remarks = $7,
       remarks = $7,
       updated_at = NOW()
     WHERE (id::text = $1 OR application_number = $1)
       AND owner_id = $2
       AND status IN ('draft', 'for_revision')
     RETURNING *`,
    [
      id,
      ownerId,
      application.accreditationType,
      application.businessType,
      application.businessPermitNumber,
      application.dtiSecRegistrationNumber || null,
      application.remarks || null,
    ]
  );
  return result.rows[0];
}

async function listApplications(filters = {}) {
  const params = [];
  const where = [];

  if (filters.ownerId) {
    params.push(filters.ownerId);
    where.push(`a.owner_id = $${params.length}`);
  }

  if (filters.status) {
    params.push(filters.status);
    where.push(`a.status = $${params.length}`);
  }

  const result = await db.query(
    `SELECT
       a.*,
       COALESCE(
         a.owner_remarks,
         CASE WHEN a.status IN ('draft', 'submitted') THEN a.remarks END
       ) AS owner_remarks,
       COALESCE(
         a.review_remarks,
         CASE WHEN a.status IN ('under_review', 'for_revision', 'approved', 'rejected') THEN a.remarks END
       ) AS review_remarks,
       b.business_name,
       b.region,
       b.province,
       b.city_municipality,
       b.barangay,
       b.street_address,
       b.zip_code,
       u.first_name,
       u.last_name,
       reviewer.first_name AS reviewer_first_name,
       reviewer.last_name AS reviewer_last_name,
       COALESCE(
         json_agg(
           json_build_object(
             'id', d.id,
             'name', d.document_type,
             'document_type', d.document_type,
             'original_name', d.original_name,
             'file_path', d.file_path,
             'status', d.status,
             'uploaded_at', d.uploaded_at,
             'remarks', d.remarks
           )
           ORDER BY d.uploaded_at DESC
         ) FILTER (WHERE d.id IS NOT NULL),
         '[]'
       ) AS documents
     FROM accreditation_applications a
     JOIN business_profiles b ON b.id = a.business_profile_id
     JOIN users u ON u.id = a.owner_id
     LEFT JOIN users reviewer ON reviewer.id = a.reviewed_by
     LEFT JOIN application_documents d ON d.application_id = a.id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     GROUP BY a.id, b.id, u.id, reviewer.id
     ORDER BY COALESCE(a.submitted_at, a.updated_at) DESC`,
    params
  );

  return result.rows;
}

async function getApplicationById(id) {
  const result = await db.query(
    `SELECT a.*,
      COALESCE(
        a.owner_remarks,
        CASE WHEN a.status IN ('draft', 'submitted') THEN a.remarks END
      ) AS owner_remarks,
      COALESCE(
        a.review_remarks,
        CASE WHEN a.status IN ('under_review', 'for_revision', 'approved', 'rejected') THEN a.remarks END
      ) AS review_remarks,
      b.*, a.id AS id, b.id AS business_profile_id,
      u.first_name, u.last_name, u.email, u.phone
     FROM accreditation_applications a
     JOIN business_profiles b ON b.id = a.business_profile_id
     JOIN users u ON u.id = a.owner_id
     WHERE a.id::text = $1 OR a.application_number = $1`,
    [id]
  );
  return result.rows[0];
}

async function updateApplicationReview(id, reviewerId, review) {
  const result = await db.query(
    `UPDATE accreditation_applications
     SET status = $2,
       review_remarks = $3,
       remarks = $3,
       reviewed_by = $4,
       reviewed_at = NOW(),
       updated_at = NOW()
     WHERE id::text = $1 OR application_number = $1
     RETURNING *`,
    [id, review.status, review.remarks || null, reviewerId]
  );
  return result.rows[0];
}

async function submitApplication(id, ownerId) {
  const result = await db.query(
    `UPDATE accreditation_applications
     SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
     WHERE (id::text = $1 OR application_number = $1)
       AND owner_id = $2
       AND status IN ('draft', 'for_revision')
     RETURNING *`,
    [id, ownerId]
  );
  return result.rows[0];
}

async function addApplicationDocument(applicationId, document) {
  const result = await db.query(
    `INSERT INTO application_documents (
      application_id, document_type, original_name, file_path, mime_type,
      file_size, uploaded_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (application_id, document_type)
    DO UPDATE SET
      original_name = EXCLUDED.original_name,
      file_path = EXCLUDED.file_path,
      mime_type = EXCLUDED.mime_type,
      file_size = EXCLUDED.file_size,
      uploaded_by = EXCLUDED.uploaded_by,
      status = 'submitted',
      remarks = NULL,
      uploaded_at = NOW()
    RETURNING *`,
    [
      applicationId,
      document.documentType,
      document.originalName,
      document.filePath,
      document.mimeType,
      document.fileSize,
      document.uploadedBy || null,
    ]
  );
  return result.rows[0];
}

async function listDocuments(applicationId) {
  const result = await db.query(
    "SELECT * FROM application_documents WHERE application_id = $1 ORDER BY uploaded_at DESC",
    [applicationId]
  );
  return result.rows;
}

async function createNotification(notification) {
  const result = await db.query(
    `INSERT INTO notifications (
      user_id, role_target, title, message, type, reference_id, action_path, details
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *`,
    [
      notification.userId || null,
      notification.roleTarget || null,
      notification.title,
      notification.message,
      notification.type || "info",
      notification.referenceId || null,
      notification.actionPath || null,
      notification.details || null,
    ]
  );
  return result.rows[0];
}

async function listAccreditationRecords() {
  const result = await db.query(
    `SELECT
       r.*,
       a.application_number,
       a.accreditation_type,
       a.status AS application_status,
       COALESCE(a.review_remarks, a.remarks) AS review_remarks,
       b.business_name,
       b.business_type,
       b.business_permit_number,
       b.dti_sec_registration_number,
       b.region,
       b.province,
       b.city_municipality,
       b.barangay,
       b.street_address,
       u.first_name,
       u.last_name,
       issuer.first_name AS issuer_first_name,
       issuer.last_name AS issuer_last_name,
       COALESCE(
         json_agg(
           json_build_object(
             'id', d.id,
             'name', d.document_type,
             'document_type', d.document_type,
             'original_name', d.original_name,
             'file_path', d.file_path,
             'status', d.status,
             'uploaded_at', d.uploaded_at,
             'remarks', d.remarks
           )
           ORDER BY d.uploaded_at DESC
         ) FILTER (WHERE d.id IS NOT NULL),
         '[]'
       ) AS documents
     FROM accreditation_records r
     JOIN accreditation_applications a ON a.id = r.application_id
     JOIN business_profiles b ON b.id = r.business_profile_id
     JOIN users u ON u.id = b.owner_id
     LEFT JOIN users issuer ON issuer.id = r.issued_by
     LEFT JOIN application_documents d ON d.application_id = a.id
     GROUP BY r.id, a.id, b.id, u.id, issuer.id
     ORDER BY r.issued_at DESC`
  );
  return result.rows;
}

async function createAccreditationRecord(application, issuedBy) {
  const recordNumber = `ACC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const result = await db.query(
    `INSERT INTO accreditation_records (
      record_number, application_id, business_profile_id, issued_by,
      expires_at, status, notes
    ) VALUES ($1,$2,$3,$4,NOW() + INTERVAL '1 year','active',$5)
    ON CONFLICT (application_id)
    DO UPDATE SET
      issued_by = EXCLUDED.issued_by,
      issued_at = NOW(),
      expires_at = EXCLUDED.expires_at,
      status = 'active',
      notes = EXCLUDED.notes
    RETURNING *`,
    [
      recordNumber,
      application.id,
      application.business_profile_id,
      issuedBy,
      application.review_remarks || application.remarks || null,
    ]
  );
  return result.rows[0];
}

async function listUsers() {
  const result = await db.query(
    `SELECT id, first_name, middle_name, last_name, sex, email, phone, telephone, role, status, last_login_at, created_at
     FROM users ORDER BY created_at DESC`
  );
  return result.rows;
}

async function updateUserStatus(id, status) {
  const result = await db.query(
    "UPDATE users SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING id, email, role, status",
    [id, status]
  );
  return result.rows[0];
}

async function listAuditLogs() {
  const result = await db.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100");
  return result.rows;
}

async function createAuditLog(log) {
  await db.query(
    `INSERT INTO audit_logs (
      event_number, actor_id, actor_name, actor_role, action, module, severity,
      reference_id, outcome, ip_address, user_agent, details
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      log.eventNumber,
      log.actorId || null,
      log.actorName || null,
      log.actorRole || null,
      log.action,
      log.module,
      log.severity || "low",
      log.referenceId || null,
      log.outcome || null,
      log.ipAddress || null,
      log.userAgent || null,
      log.details || null,
    ]
  );
}

async function listNotifications({ userId, role }) {
  const result = await db.query(
    `SELECT * FROM notifications
     WHERE user_id = $1 OR role_target = $2
     ORDER BY created_at DESC`,
    [userId || null, role || null]
  );
  return result.rows;
}

async function markNotificationRead(id, { userId, role }) {
  const result = await db.query(
    `UPDATE notifications
     SET is_read = TRUE, read_at = COALESCE(read_at, NOW())
     WHERE id = $1 AND (user_id = $2 OR role_target = $3)
     RETURNING *`,
    [id, userId || null, role || null]
  );
  return result.rows[0];
}

module.exports = {
  addApplicationDocument,
  createApplication,
  createAuditLog,
  createAccreditationRecord,
  createBusinessProfile,
  createBusinessOwnerWithProfile,
  createNotification,
  createUser,
  findUserByEmail,
  findUserById,
  findUserByVerificationToken,
  getApplicationById,
  getBusinessProfile,
  listAccreditationRecords,
  listApplications,
  listAuditLogs,
  listDocuments,
  listNotifications,
  listUsers,
  markNotificationRead,
  submitApplication,
  updateAccountProfile,
  updateApplicationReview,
  updateApplicationDraft,
  updateBusinessProfile,
  updateLastLogin,
  updatePasswordHash,
  updateUserStatus,
  verifyUserEmail,
};
