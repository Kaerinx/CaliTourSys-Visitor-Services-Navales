const db = require("../../config/db");

const MAX_PAGE_SIZE = 100;

function pagination(filters = {}) {
  const page = Math.max(Number(filters.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(filters.pageSize || 0), 1), MAX_PAGE_SIZE);
  if (!filters.page && !filters.pageSize) return null;
  return { page, pageSize, offset: (page - 1) * pageSize };
}

function appendPagination(sql, params, pageInfo) {
  if (!pageInfo) return sql;
  params.push(pageInfo.pageSize, pageInfo.offset);
  return `${sql} LIMIT $${params.length - 1} OFFSET $${params.length}`;
}

function paginatedResponse(rows, total, pageInfo) {
  if (!pageInfo) return rows;
  return {
    items: rows,
    pagination: {
      page: pageInfo.page,
      pageSize: pageInfo.pageSize,
      total,
      totalPages: Math.ceil(total / pageInfo.pageSize),
    },
  };
}

function auditEventNumber() {
  return `AUD-${new Date().getFullYear()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function coordinate(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function textOrNull(value) {
  const text = String(value || "").trim();
  return text || null;
}

function normalizePartners(value) {
  if (!Array.isArray(value)) return [];
  return value.map((partner) => String(partner || "").trim()).filter(Boolean);
}

function organizationFields(profile = {}, user = {}) {
  const legalStructure = textOrNull(profile.legalStructure || profile.legal_structure);
  const company = profile.company || {};
  const representativeName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  return {
    legalStructure,
    partners: normalizePartners(profile.partners),
    authorizedRepresentativeName: textOrNull(
      profile.authorizedRepresentativeName ||
        profile.authorized_representative_name ||
        company.representativeName ||
        representativeName
    ),
    authorizedRepresentativePosition: textOrNull(
      profile.authorizedRepresentativePosition ||
        profile.authorized_representative_position ||
        company.representativePosition
    ),
    companyRegistrationNumber: textOrNull(
      profile.companyRegistrationNumber ||
        profile.company_registration_number ||
        company.registrationNumber ||
        profile.dtiSecRegistrationNumber
    ),
  };
}

async function createUser(user) {
  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const result = await db.query(
    `INSERT INTO users (
      display_name, first_name, middle_name, last_name, sex, email, password_hash, phone,
      telephone, role, status, verification_token
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING id, first_name, middle_name, last_name, sex, email, phone, telephone, role, status, created_at`,
    [
      displayName,
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
    const displayName = `${user.firstName} ${user.lastName}`.trim();
    const userResult = await client.query(
      `INSERT INTO users (
        display_name, first_name, middle_name, last_name, sex, email, password_hash, phone,
        telephone, role, status, verification_token
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id, first_name, middle_name, last_name, sex, email, phone, telephone, role, status, created_at`,
      [
        displayName,
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

    const organization = organizationFields(profile, user);

    await client.query(
      `INSERT INTO business_profiles (
        owner_id, business_name, business_type, business_permit_number,
        dti_sec_registration_number, region, province, city_municipality,
        barangay, street_address, zip_code, latitude, longitude,
        description, facebook_url, instagram_url, tiktok_url, twitter_url, website_url,
        legal_structure, partners, authorized_representative_name,
        authorized_representative_position, company_registration_number
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
      [
        createdUser.id,
        profile.businessName,
        profile.businessType || null,
        profile.businessPermitNumber || null,
        profile.dtiSecRegistrationNumber || profile.company?.registrationNumber || null,
        profile.region,
        profile.province,
        profile.cityMunicipality,
        profile.barangay,
        profile.streetAddress,
        profile.zipCode || null,
        coordinate(profile.latitude),
        coordinate(profile.longitude),
        textOrNull(profile.description),
        textOrNull(profile.facebookUrl),
        textOrNull(profile.instagramUrl),
        textOrNull(profile.tiktokUrl),
        textOrNull(profile.twitterUrl),
        textOrNull(profile.websiteUrl),
        organization.legalStructure,
        JSON.stringify(organization.partners),
        organization.authorizedRepresentativeName,
        organization.authorizedRepresentativePosition,
        organization.companyRegistrationNumber,
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
  const organization = organizationFields(profile);
  const result = await db.query(
    `INSERT INTO business_profiles (
      owner_id, business_name, business_type, business_permit_number,
      dti_sec_registration_number, region, province, city_municipality,
      barangay, street_address, zip_code, latitude, longitude,
      description, facebook_url, instagram_url, tiktok_url, twitter_url, website_url,
      legal_structure, partners, authorized_representative_name,
      authorized_representative_position, company_registration_number
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
    RETURNING *`,
    [
      ownerId,
      profile.businessName,
      profile.businessType || null,
      profile.businessPermitNumber || null,
      profile.dtiSecRegistrationNumber || profile.company?.registrationNumber || null,
      profile.region,
      profile.province,
      profile.cityMunicipality,
      profile.barangay,
      profile.streetAddress,
      profile.zipCode || null,
      coordinate(profile.latitude),
      coordinate(profile.longitude),
      textOrNull(profile.description),
      textOrNull(profile.facebookUrl),
      textOrNull(profile.instagramUrl),
      textOrNull(profile.tiktokUrl),
      textOrNull(profile.twitterUrl),
      textOrNull(profile.websiteUrl),
      organization.legalStructure,
      JSON.stringify(organization.partners),
      organization.authorizedRepresentativeName,
      organization.authorizedRepresentativePosition,
      organization.companyRegistrationNumber,
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
       latitude = $12,
       longitude = $13,
       description = $14,
       facebook_url = $15,
       instagram_url = $16,
       tiktok_url = $17,
       twitter_url = $18,
       website_url = $19,
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
      coordinate(profile.latitude),
      coordinate(profile.longitude),
      textOrNull(profile.description),
      textOrNull(profile.facebookUrl),
      textOrNull(profile.instagramUrl),
      textOrNull(profile.tiktokUrl),
      textOrNull(profile.twitterUrl),
      textOrNull(profile.websiteUrl),
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

async function updateBusinessProfileById(id, ownerId, profile) {
  const result = await db.query(
    `UPDATE business_profiles
     SET business_name = $3,
       business_type = $4,
       business_permit_number = $5,
       dti_sec_registration_number = $6,
       region = $7,
       province = $8,
       city_municipality = $9,
       barangay = $10,
       street_address = $11,
       zip_code = $12,
       latitude = $13,
       longitude = $14,
       updated_at = NOW()
     WHERE id = $1
       AND owner_id = $2
     RETURNING *`,
    [
      id,
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
      coordinate(profile.latitude),
      coordinate(profile.longitude),
    ]
  );

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
  const pageInfo = pagination(filters);

  if (filters.ownerId) {
    params.push(filters.ownerId);
    where.push(`a.owner_id = $${params.length}`);
  }

  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    where.push(`a.status = $${params.length}`);
  }

  if (filters.q) {
    params.push(`%${filters.q}%`);
    where.push(`(
      a.application_number ILIKE $${params.length}
      OR b.business_name ILIKE $${params.length}
      OR b.business_type ILIKE $${params.length}
      OR b.business_permit_number ILIKE $${params.length}
      OR u.first_name ILIKE $${params.length}
      OR u.last_name ILIKE $${params.length}
      OR u.email ILIKE $${params.length}
    )`);
  }

  if (filters.dateFrom) {
    params.push(filters.dateFrom);
    where.push(`COALESCE(a.submitted_at, a.created_at) >= $${params.length}::date`);
  }

  if (filters.dateTo) {
    params.push(filters.dateTo);
    where.push(`COALESCE(a.submitted_at, a.created_at) < ($${params.length}::date + INTERVAL '1 day')`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const countParams = [...params];
  const countResult = pageInfo
    ? await db.query(
        `SELECT COUNT(DISTINCT a.id)::int AS total
         FROM accreditation_applications a
         JOIN business_profiles b ON b.id = a.business_profile_id
         JOIN users u ON u.id = a.owner_id
         ${whereSql}`,
        countParams
      )
    : null;

  const sql = appendPagination(
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
       b.latitude,
       b.longitude,
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
     ${whereSql}
     GROUP BY a.id, b.id, u.id, reviewer.id
     ORDER BY COALESCE(a.submitted_at, a.updated_at) DESC`,
    params,
    pageInfo
  );
  const result = await db.query(sql, params);

  return paginatedResponse(result.rows, countResult?.rows[0]?.total || result.rows.length, pageInfo);
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
      b.*,
      a.id AS id,
      a.business_type AS business_type,
      b.business_type AS profile_business_type,
      b.id AS business_profile_id,
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

async function deleteDraftApplication(id, ownerId) {
  const result = await db.query(
    `DELETE FROM accreditation_applications
     WHERE (id::text = $1 OR application_number = $1)
       AND owner_id = $2
       AND status = 'draft'
     RETURNING *`,
    [id, ownerId]
  );
  return result.rows[0];
}

async function addApplicationDocument(applicationId, document) {
  const result = await db.query(
    `INSERT INTO application_documents (
      application_id, document_type, original_name, file_path, mime_type,
      file_size, file_checksum, uploaded_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (application_id, document_type)
    DO UPDATE SET
      original_name = EXCLUDED.original_name,
      file_path = EXCLUDED.file_path,
      mime_type = EXCLUDED.mime_type,
      file_size = EXCLUDED.file_size,
      file_checksum = EXCLUDED.file_checksum,
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
      document.fileChecksum || null,
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

async function getDocumentById(id) {
  const result = await db.query(
    `SELECT
       d.*,
       a.owner_id,
       a.application_number,
       b.business_name
     FROM application_documents d
     JOIN accreditation_applications a ON a.id = d.application_id
     JOIN business_profiles b ON b.id = a.business_profile_id
     WHERE d.id = $1`,
    [id]
  );
  return result.rows[0];
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

async function listAccreditationRecords(filters = {}) {
  const params = [];
  const where = [];
  const pageInfo = pagination(filters);

  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    where.push(`r.status = $${params.length}`);
  }

  if (filters.q) {
    params.push(`%${filters.q}%`);
    where.push(`(
      r.record_number ILIKE $${params.length}
      OR a.application_number ILIKE $${params.length}
      OR b.business_name ILIKE $${params.length}
      OR b.business_permit_number ILIKE $${params.length}
    )`);
  }

  if (filters.dateFrom) {
    params.push(filters.dateFrom);
    where.push(`r.issued_at >= $${params.length}::date`);
  }

  if (filters.dateTo) {
    params.push(filters.dateTo);
    where.push(`r.issued_at < ($${params.length}::date + INTERVAL '1 day')`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const countParams = [...params];
  const countResult = pageInfo
    ? await db.query(
        `SELECT COUNT(DISTINCT r.id)::int AS total
         FROM accreditation_records r
         JOIN accreditation_applications a ON a.id = r.application_id
         JOIN business_profiles b ON b.id = r.business_profile_id
         ${whereSql}`,
        countParams
      )
    : null;

  const sql = appendPagination(
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
       b.latitude,
       b.longitude,
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
     ${whereSql}
     GROUP BY r.id, a.id, b.id, u.id, issuer.id
     ORDER BY r.issued_at DESC`,
    params,
    pageInfo
  );
  const result = await db.query(sql, params);
  return paginatedResponse(result.rows, countResult?.rows[0]?.total || result.rows.length, pageInfo);
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

async function listBusinessProfileImages(profileId) {
  const result = await db.query(
    `SELECT *
     FROM business_profile_images
     WHERE business_profile_id = $1
     ORDER BY display_order ASC, uploaded_at ASC`,
    [profileId]
  );
  return result.rows;
}

async function countBusinessProfileImages(profileId) {
  const result = await db.query(
    "SELECT COUNT(*)::int AS count FROM business_profile_images WHERE business_profile_id = $1",
    [profileId]
  );
  return result.rows[0]?.count || 0;
}

async function addBusinessProfileImages(profileId, images) {
  const existingCount = await countBusinessProfileImages(profileId);
  const created = [];

  for (const [index, image] of images.entries()) {
    const result = await db.query(
      `INSERT INTO business_profile_images (
        business_profile_id, image_url, original_name, mime_type, file_size, display_order
      ) VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        profileId,
        image.imageUrl,
        image.originalName || null,
        image.mimeType || null,
        Number.isFinite(Number(image.fileSize)) ? Number(image.fileSize) : null,
        existingCount + index,
      ]
    );
    created.push(result.rows[0]);
  }

  return created;
}

async function deleteBusinessProfileImage(ownerId, imageId) {
  const result = await db.query(
    `DELETE FROM business_profile_images img
     USING business_profiles bp
     WHERE img.id = $1
       AND img.business_profile_id = bp.id
       AND bp.owner_id = $2
     RETURNING img.*`,
    [imageId, ownerId]
  );
  return result.rows[0] || null;
}

async function deactivateAccreditationRecordForApplication(applicationId, notes) {
  const result = await db.query(
    `UPDATE accreditation_records
     SET status = 'inactive',
       notes = COALESCE($2, notes)
     WHERE application_id = $1
       AND status = 'active'
     RETURNING *`,
    [applicationId, notes || null]
  );
  return result.rows[0] || null;
}

async function listUsers(filters = {}) {
  const params = [];
  const where = [];
  const pageInfo = pagination(filters);

  if (filters.role && filters.role !== "all") {
    params.push(filters.role);
    where.push(`role = $${params.length}`);
  }

  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    where.push(`status = $${params.length}`);
  }

  if (filters.q) {
    params.push(`%${filters.q}%`);
    where.push(`(
      first_name ILIKE $${params.length}
      OR last_name ILIKE $${params.length}
      OR email ILIKE $${params.length}
      OR phone ILIKE $${params.length}
    )`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const countParams = [...params];
  const countResult = pageInfo
    ? await db.query(`SELECT COUNT(*)::int AS total FROM users ${whereSql}`, countParams)
    : null;
  const sql = appendPagination(
    `SELECT id, first_name, middle_name, last_name, sex, email, phone, telephone, role, status, last_login_at, created_at
     FROM users ${whereSql} ORDER BY created_at DESC`,
    params,
    pageInfo
  );
  const result = await db.query(sql, params);
  return paginatedResponse(result.rows, countResult?.rows[0]?.total || result.rows.length, pageInfo);
}

async function updateUserStatus(id, status) {
  if (!["active", "inactive", "pending_verification"].includes(status)) {
    const error = new Error("Invalid user status.");
    error.statusCode = 400;
    throw error;
  }

  const result = await db.query(
    `UPDATE users
     SET status = $2::user_status,
       email_verified_at = CASE WHEN $2::text = 'active' THEN COALESCE(email_verified_at, NOW()) ELSE email_verified_at END,
       verification_token = CASE WHEN $2::text = 'active' THEN NULL ELSE verification_token END,
       updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, role, status`,
    [id, status]
  );
  return result.rows[0];
}

async function listAuditLogs(filters = {}) {
  const params = [];
  const where = [];
  const pageInfo = pagination(filters);

  if (filters.module && filters.module !== "all") {
    params.push(filters.module);
    where.push(`module = $${params.length}`);
  }

  if (filters.severity && filters.severity !== "all") {
    params.push(filters.severity);
    where.push(`severity = $${params.length}`);
  }

  if (filters.q) {
    params.push(`%${filters.q}%`);
    where.push(`(
      event_number ILIKE $${params.length}
      OR action ILIKE $${params.length}
      OR actor_name ILIKE $${params.length}
      OR reference_id ILIKE $${params.length}
      OR details ILIKE $${params.length}
    )`);
  }

  if (filters.dateFrom) {
    params.push(filters.dateFrom);
    where.push(`created_at >= $${params.length}::date`);
  }

  if (filters.dateTo) {
    params.push(filters.dateTo);
    where.push(`created_at < ($${params.length}::date + INTERVAL '1 day')`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const countParams = [...params];
  const countResult = pageInfo
    ? await db.query(
        `SELECT COUNT(*)::int AS total FROM audit_logs ${whereSql}`,
        countParams
      )
    : null;
  const baseSql = `SELECT * FROM audit_logs ${whereSql} ORDER BY created_at DESC`;
  const sql = pageInfo ? appendPagination(
    baseSql,
    params,
    pageInfo
  ) : `${baseSql} LIMIT 100`;
  const result = await db.query(sql, params);
  return paginatedResponse(result.rows, countResult?.rows[0]?.total || result.rows.length, pageInfo);
}

async function createAuditLog(log) {
  await db.query(
    `INSERT INTO audit_logs (
      event_number, actor_id, actor_name, actor_role, action, module, severity,
      reference_id, outcome, ip_address, user_agent, details
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      log.eventNumber || auditEventNumber(),
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
  addBusinessProfileImages,
  countBusinessProfileImages,
  createApplication,
  createAuditLog,
  createAccreditationRecord,
  createBusinessProfile,
  createBusinessOwnerWithProfile,
  createNotification,
  createUser,
  deactivateAccreditationRecordForApplication,
  deleteBusinessProfileImage,
  deleteDraftApplication,
  findUserByEmail,
  findUserById,
  findUserByVerificationToken,
  getApplicationById,
  getDocumentById,
  getBusinessProfile,
  listBusinessProfileImages,
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
  updateBusinessProfileById,
  updateLastLogin,
  updatePasswordHash,
  updateUserStatus,
  verifyUserEmail,
};
