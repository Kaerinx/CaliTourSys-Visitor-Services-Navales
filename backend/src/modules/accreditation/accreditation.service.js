const bcrypt = require("bcrypt");
const crypto = require("crypto");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const path = require("path");
const model = require("./accreditation.model");
const { getJwtSecret } = require("../../config/authConfig");

const COMMON_PERMIT_DOCUMENTS = [
  "Business Permit",
  "DTI/SEC Registration",
  "Barangay Clearance",
  "Zoning/Location Clearance",
  "BIR Certificate of Registration",
  "Fire Safety Inspection Certificate",
  "Sanitary Permit",
];
const PERMIT_DOCUMENTS_BY_BUSINESS_TYPE = {
  "Travel and Tour Agency": [
    "DOT Travel Agency Accreditation / Application Proof",
    "DOT Tour Operator Accreditation / Application Proof",
    "Destination / Environmental Permit Matrix",
  ],
  "Travel Agency": [
    "DOT Travel Agency Accreditation / Application Proof",
  ],
  "Tour Operator": [
    "DOT Tour Operator Accreditation / Application Proof",
    "Destination / Environmental Permit Matrix",
  ],
  "Online Travel Agency": [
    "DOT Online Travel Agency Accreditation / Application Proof",
    "Privacy Notice / Data Protection Policy",
  ],
  "Tourist Land Transport Operator": [
    "DOT Tourist Transport Operator Accreditation / Application Proof",
    "LTFRB Franchise / Certificate of Public Convenience",
    "Vehicle OR/CR and Insurance",
  ],
  "Tourist Water Transport Operator": [
    "DOT Tourist Transport Operator Accreditation / Application Proof",
    "MARINA Registration / Safety Compliance",
    "Philippine Coast Guard Clearance",
    "Passenger Insurance",
  ],
  "Tourist Air Transport Operator": [
    "DOT Tourist Transport Operator Accreditation / Application Proof",
    "CAAP Operator Approval",
    "Passenger Insurance",
  ],
  "Motorized Banca": [
    "DOT Tourist Transport Operator Accreditation / Application Proof",
    "MARINA Registration / Safety Compliance",
    "Philippine Coast Guard Clearance",
    "Passenger Insurance",
  ],
  "MICE Organizer": [
    "DOT MICE Organizer Accreditation / Application Proof",
  ],
  "MICE Facility/ Venue": [
    "DOT MICE Facility Accreditation / Application Proof",
    "Occupancy Permit",
  ],
  "Adventure/ Sports and Ecotourism Facility": [
    "DOT Adventure / Ecotourism Accreditation / Application Proof",
    "Environmental / Protected Area Permit",
    "Public Liability Insurance",
  ],
  Restaurant: [
    "Food Establishment Permit",
  ],
  "Food / Local Cuisine": [
    "Food Establishment Permit",
    "Sanitary Permit",
  ],
  "Tourism Training Center": [
    "Training Program / Instructor Credentials",
  ],
  "Target Shooting Range": [
    "Range Operation Permit",
    "Public Liability Insurance",
  ],
  "Department Store/ Shopping Mall/ Tourist Shop/ Specialty Shop": [
    "Signage Permit",
  ],
  "Farm Tourism Camp": [
    "DOT Farm Tourism Accreditation / Application Proof",
    "Environmental / Protected Area Permit",
  ],
  "Gallery/ Museum": [
    "Occupancy Permit",
  ],
  "Tourism Entertainment Complex": [
    "Occupancy Permit",
    "Public Liability Insurance",
  ],
  "Tourism Recreation Center": [
    "Occupancy Permit",
    "Public Liability Insurance",
  ],
  Zoo: [
    "Wildlife Farm / Zoo Permit",
    "Public Liability Insurance",
  ],
  "Rest Area/ Restroom": [
    "Occupancy Permit",
  ],
  "Surfing Camp": [
    "DOT Adventure / Ecotourism Accreditation / Application Proof",
    "Public Liability Insurance",
  ],
  "Ambulatory Clinic": [
    "Health Facility License / Permit",
  ],
  Spa: [
    "Health and Wellness Service Permit",
  ],
  "Tertiary Hospital": [
    "DOH Hospital License",
  ],
  Hotel: [
    "DOT Accommodation Accreditation / Application Proof",
    "Occupancy Permit",
  ],
  Resort: [
    "DOT Accommodation Accreditation / Application Proof",
    "Occupancy Permit",
  ],
  "Apartment Hotel": [
    "DOT Accommodation Accreditation / Application Proof",
    "Occupancy Permit",
  ],
  "Mabuhay Accommodation": [
    "DOT Accommodation Accreditation / Application Proof",
    "Occupancy Permit",
  ],
  Homestay: [
    "DOT Homestay Accreditation / Application Proof",
  ],
};
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

function getRequiredDocumentsForBusinessType(businessType) {
  const selectedTypes = Array.isArray(businessType)
    ? businessType
    : String(businessType || "")
        .split(",")
        .map((type) => type.trim())
        .filter(Boolean);
  const documents = new Set(COMMON_PERMIT_DOCUMENTS);

  for (const type of selectedTypes) {
    for (const document of PERMIT_DOCUMENTS_BY_BUSINESS_TYPE[type] || []) {
      documents.add(document);
    }
  }

  return Array.from(documents);
}

function normalizeDocumentLabel(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function resolveRequiredDocumentType(value, requiredDocuments) {
  const normalized = normalizeDocumentLabel(value);
  return requiredDocuments.find((document) => normalizeDocumentLabel(document) === normalized);
}

function publicUser(user) {
  return {
    id: user.id,
    firstName: user.first_name,
    first_name: user.first_name,
    middleName: user.middle_name,
    middle_name: user.middle_name,
    lastName: user.last_name,
    last_name: user.last_name,
    sex: user.sex,
    email: user.email,
    phone: user.phone,
    telephone: user.telephone,
    role: user.role,
    status: user.status,
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

async function sendVerificationEmail(email, token) {
  const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/accreditation/verify-email?token=${token}`;

  if (!process.env.SMTP_HOST) {
    console.log(`Email verification link for ${email}: ${verifyUrl}`);
    return { verifyUrl, sent: false };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "LGU Tourism Accreditation <no-reply@calitoursys.local>",
    to: email,
    subject: "Verify your CaliTourSys business account",
    html: `<p>Please verify your business account by opening this link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });

  return { verifyUrl, sent: true };
}

async function registerBusinessOwner(payload) {
  const requiredFields = [
    ["firstName", "First name"],
    ["lastName", "Last name"],
    ["email", "Email address"],
    ["password", "Password"],
    ["phone", "Mobile number"],
  ];
  const requiredBusinessFields = [
    ["businessName", "Business name"],
    ["region", "Region"],
    ["province", "Province"],
    ["cityMunicipality", "City / Municipality"],
    ["barangay", "Barangay"],
    ["streetAddress", "Business address"],
    ["latitude", "Establishment latitude"],
    ["longitude", "Establishment longitude"],
  ];

  const missing = requiredFields
    .filter(([key]) => !payload[key])
    .map(([, label]) => label);

  const business = payload.business || {};
  const missingBusiness = requiredBusinessFields
    .filter(([key]) => !business[key])
    .map(([, label]) => label);

  if (missing.length || missingBusiness.length) {
    const error = new Error(`Please complete required fields: ${[...missing, ...missingBusiness].join(", ")}.`);
    error.statusCode = 400;
    throw error;
  }

  if (payload.password.length < 8) {
    const error = new Error("Password must be at least 8 characters.");
    error.statusCode = 400;
    throw error;
  }

  const latitude = Number(business.latitude);
  const longitude = Number(business.longitude);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    const error = new Error("Please provide valid establishment coordinates.");
    error.statusCode = 400;
    throw error;
  }

  const existing = await model.findUserByEmail(payload.email.toLowerCase());
  if (existing) {
    const error = new Error("A user with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await model.createBusinessOwnerWithProfile({
    ...payload,
    email: payload.email.toLowerCase(),
    passwordHash,
    status: "pending_verification",
    verificationToken,
  }, business);
  const verification = await sendVerificationEmail(user.email, verificationToken);

  return {
    user,
    message: "Account created. Please check your email for verification.",
    verificationUrl: verification.sent ? undefined : verification.verifyUrl,
  };
}

async function verifyEmail(token) {
  const user = await model.findUserByVerificationToken(token);
  if (!user) {
    const error = new Error("Invalid or expired verification token.");
    error.statusCode = 400;
    throw error;
  }
  return model.verifyUserEmail(user.id);
}

async function login(email, password) {
  const user = await model.findUserByEmail(email.toLowerCase());
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  if (user.status === "pending_verification") {
    if (!process.env.SMTP_HOST) {
      const verifiedUser = await model.verifyUserEmail(user.id);
      return { token: signToken(verifiedUser), user: publicUser(verifiedUser) };
    }

    const error = new Error("Please verify your email before logging in.");
    error.statusCode = 403;
    if (!process.env.SMTP_HOST && user.verification_token) {
      error.verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/accreditation/verify-email?token=${user.verification_token}`;
    }
    throw error;
  }

  if (user.status === "inactive") {
    const error = new Error("This account is inactive. Contact the system administrator.");
    error.statusCode = 403;
    throw error;
  }

  await model.updateLastLogin(user.id);
  return { token: signToken(user), user: publicUser(user) };
}

async function getCurrentUser(userId) {
  const user = await model.findUserById(userId);
  if (!user) {
    const error = new Error("Account not found.");
    error.statusCode = 404;
    throw error;
  }
  return publicUser(user);
}

async function createApplication(ownerId, payload) {
  return saveApplicationDraft(ownerId, payload);
}

function businessProfileFromPayload(payload, fallback = {}) {
  return {
    businessName: payload.businessName || fallback.business_name,
    businessType: payload.businessType || fallback.business_type,
    businessPermitNumber: payload.businessPermitNumber || fallback.business_permit_number,
    dtiSecRegistrationNumber:
      payload.dtiSecRegistrationNumber || fallback.dti_sec_registration_number,
    region: payload.region || fallback.region,
    province: payload.province || fallback.province,
    cityMunicipality: payload.cityMunicipality || fallback.city_municipality,
    barangay: payload.barangay || fallback.barangay,
    streetAddress: payload.streetAddress || fallback.street_address,
    zipCode: payload.zipCode || fallback.zip_code,
    latitude: payload.latitude ?? fallback.latitude,
    longitude: payload.longitude ?? fallback.longitude,
  };
}

function validateApplicationBusinessProfile(profile) {
  const required = [
    ["businessName", "Business name"],
    ["businessType", "Business type"],
    ["region", "Region"],
    ["province", "Province"],
    ["cityMunicipality", "City / Municipality"],
    ["barangay", "Barangay"],
    ["streetAddress", "Business address"],
  ];
  const missing = required.filter(([key]) => !profile[key]).map(([, label]) => label);

  if (missing.length) {
    const error = new Error(`Please complete business details: ${missing.join(", ")}.`);
    error.statusCode = 400;
    throw error;
  }
}

async function saveApplicationDraft(ownerId, payload) {
  const existingApplication = payload.applicationId
    ? await model.getApplicationById(payload.applicationId)
    : null;

  if (payload.applicationId && !existingApplication) {
    const error = new Error("Draft application not found or already submitted.");
    error.statusCode = 404;
    throw error;
  }

  if (existingApplication && existingApplication.owner_id !== ownerId) {
    const error = new Error("Draft application not found or already submitted.");
    error.statusCode = 404;
    throw error;
  }

  if (existingApplication && !["draft", "for_revision"].includes(existingApplication.status)) {
    const error = new Error("Draft application not found or already submitted.");
    error.statusCode = 404;
    throw error;
  }

  const defaultProfile = await model.getBusinessProfile(ownerId);
  const profile = businessProfileFromPayload(payload, existingApplication || defaultProfile || {});
  validateApplicationBusinessProfile(profile);

  const businessProfile = existingApplication
    ? await model.updateBusinessProfileById(existingApplication.business_profile_id, ownerId, profile)
    : await model.createBusinessProfile(ownerId, profile);

  if (!businessProfile) {
    const error = new Error("Business profile is required before applying for accreditation.");
    error.statusCode = 400;
    throw error;
  }

  const draft = {
    businessProfileId: businessProfile.id,
    accreditationType: payload.accreditationType || "New Accreditation",
    businessType: profile.businessType,
    businessPermitNumber: profile.businessPermitNumber,
    dtiSecRegistrationNumber:
      profile.dtiSecRegistrationNumber,
    remarks: payload.remarks,
    status: "draft",
  };

  if (payload.applicationId) {
    const updated = await model.updateApplicationDraft(payload.applicationId, ownerId, draft);
    if (!updated) {
      const error = new Error("Draft application not found or already submitted.");
      error.statusCode = 404;
      throw error;
    }
    return updated;
  }

  const applicationNumber = `APP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  return model.createApplication(ownerId, {
    applicationNumber,
    ...draft,
  });
}

async function addDocument(applicationId, file, body, userId) {
  const application = await model.getApplicationById(applicationId);
  if (!application) {
    const error = new Error("Application not found.");
    error.statusCode = 404;
    throw error;
  }

  if (application.owner_id !== userId) {
    const error = new Error("You do not have permission to upload documents for this application.");
    error.statusCode = 403;
    throw error;
  }

  if (application.status !== "draft" && application.status !== "for_revision") {
    const error = new Error("Documents can only be uploaded while the application is a draft or for revision.");
    error.statusCode = 400;
    throw error;
  }

  const requiredDocuments = getRequiredDocumentsForBusinessType(application.business_type);
  const requestedDocumentType = body.documentType || body.document_type || body.type || body.name;
  const documentType = resolveRequiredDocumentType(requestedDocumentType, requiredDocuments);
  if (!documentType) {
    const error = new Error(
      `Invalid document type "${requestedDocumentType || "not provided"}" for ${application.business_type || "this business type"}.`,
    );
    error.statusCode = 400;
    throw error;
  }

  if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.mimetype)) {
    const error = new Error("Invalid document file type. Upload PDF, JPG, or PNG files only.");
    error.statusCode = 400;
    throw error;
  }

  return model.addApplicationDocument(application.id, {
    documentType,
    originalName: file.originalname,
    filePath: file.path,
    mimeType: file.mimetype,
    fileSize: file.size,
    fileChecksum: crypto.createHash("sha256").update(fs.readFileSync(file.path)).digest("hex"),
    uploadedBy: userId,
  });
}

async function deleteDraftApplication(ownerId, applicationId) {
  const application = await model.getApplicationById(applicationId);
  if (!application) {
    const error = new Error("Draft application not found.");
    error.statusCode = 404;
    throw error;
  }

  if (application.owner_id !== ownerId) {
    const error = new Error("You do not have permission to delete this application.");
    error.statusCode = 403;
    throw error;
  }

  if (application.status !== "draft") {
    const error = new Error("Only draft applications can be deleted.");
    error.statusCode = 400;
    throw error;
  }

  const documents = await model.listDocuments(application.id);
  const deleted = await model.deleteDraftApplication(application.id, ownerId);
  if (!deleted) {
    const error = new Error("Draft application not found.");
    error.statusCode = 404;
    throw error;
  }

  await removeApplicationDocumentFiles(documents);
  return deleted;
}

async function removeApplicationDocumentFiles(documents) {
  const uploadsRoot = path.resolve("uploads");
  await Promise.allSettled(
    documents
      .map((document) => document.file_path)
      .filter(Boolean)
      .map(async (filePath) => {
        const resolvedPath = path.resolve(filePath);
        if (!resolvedPath.startsWith(uploadsRoot)) return;
        await fs.promises.unlink(resolvedPath);
      })
  );
}

async function submitApplication(ownerId, applicationId) {
  const application = await model.getApplicationById(applicationId);
  if (!application) {
    const error = new Error("Application not found.");
    error.statusCode = 404;
    throw error;
  }

  if (application.owner_id !== ownerId) {
    const error = new Error("You do not have permission to submit this application.");
    error.statusCode = 403;
    throw error;
  }

  if (application.status !== "draft" && application.status !== "for_revision") {
    const error = new Error("Only draft or revision applications can be submitted.");
    error.statusCode = 400;
    throw error;
  }

  const documents = await model.listDocuments(application.id);
  const uploadedTypes = new Set(documents.map((document) => document.document_type));
  const requiredDocuments = getRequiredDocumentsForBusinessType(application.business_type);
  const missing = requiredDocuments.filter((document) => !uploadedTypes.has(document));

  if (missing.length) {
    const error = new Error(`Please upload required documents: ${missing.join(", ")}.`);
    error.statusCode = 400;
    throw error;
  }

  const submitted = await model.submitApplication(application.id, ownerId);

  await model.createNotification({
    roleTarget: "tourism_staff",
    title: "New Application Submitted",
    message: `${submitted.application_number} is ready for review.`,
    type: "action_needed",
    referenceId: submitted.application_number,
    actionPath: `/cms/businesses/review?application=${submitted.application_number}`,
    details: "A business owner submitted an accreditation application with required documents.",
  });
  return submitted;
}

async function updateAccountProfile(userId, payload) {
  if (!payload.firstName || !payload.lastName || !payload.email) {
    const error = new Error("First name, last name, and email are required.");
    error.statusCode = 400;
    throw error;
  }

  const email = payload.email.toLowerCase();
  const existing = await model.findUserByEmail(email);
  if (existing && existing.id !== userId) {
    const error = new Error("A user with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const user = await model.updateAccountProfile(userId, {
    firstName: payload.firstName,
    middleName: payload.middleName,
    lastName: payload.lastName,
    sex: payload.sex,
    email,
    phone: payload.phone,
    telephone: payload.telephone,
  });

  return publicUser(user);
}

async function reviewApplication(reviewerId, applicationId, payload) {
  const allowedStatuses = ["under_review", "for_revision", "rejected", "approved"];
  if (!allowedStatuses.includes(payload.status)) {
    const error = new Error("Invalid review status.");
    error.statusCode = 400;
    throw error;
  }

  const existing = await model.getApplicationById(applicationId);
  if (!existing) return null;

  const transitions = {
    submitted: ["under_review", "for_revision", "rejected", "approved"],
    under_review: ["for_revision", "rejected", "approved"],
    for_revision: [],
    approved: [],
    rejected: [],
  };
  const allowedNext = transitions[existing.status] || [];
  if (!allowedNext.includes(payload.status)) {
    const error = new Error(`Cannot change application from ${existing.status} to ${payload.status}.`);
    error.statusCode = 400;
    throw error;
  }

  if (["for_revision", "rejected"].includes(payload.status) && !String(payload.remarks || "").trim()) {
    const error = new Error("Review remarks are required when requesting revision or rejecting an application.");
    error.statusCode = 400;
    throw error;
  }

  const application = await model.updateApplicationReview(applicationId, reviewerId, payload);
  if (!application) return null;

  if (payload.status === "approved") {
    await model.createAccreditationRecord(application, reviewerId);
  }

  const notificationMap = {
    under_review: {
      title: "Application Under Review",
      type: "info",
      message: `Your application ${application.application_number} is now under review.`,
    },
    for_revision: {
      title: "Revision Needed",
      type: "action_needed",
      message: `Please revise your application ${application.application_number}.`,
    },
    rejected: {
      title: "Application Rejected",
      type: "urgent",
      message: `Your application ${application.application_number} was rejected.`,
    },
    approved: {
      title: "Application Approved",
      type: "info",
      message: `Your application ${application.application_number} was approved.`,
    },
  };

  const notification = notificationMap[payload.status];
  await model.createNotification({
    userId: application.owner_id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    referenceId: application.application_number,
    actionPath: `/accreditation/app/applications?application=${application.application_number}`,
    details: payload.remarks || "The tourism office updated your application status.",
  });

  return application;
}

async function changePassword(userId, payload) {
  if (!payload.currentPassword || !payload.newPassword) {
    const error = new Error("Current password and new password are required.");
    error.statusCode = 400;
    throw error;
  }

  if (payload.newPassword.length < 8) {
    const error = new Error("New password must be at least 8 characters.");
    error.statusCode = 400;
    throw error;
  }

  const user = await model.findUserById(userId);
  if (!user) {
    const error = new Error("Account not found.");
    error.statusCode = 404;
    throw error;
  }

  const validPassword = await bcrypt.compare(payload.currentPassword, user.password_hash);
  if (!validPassword) {
    const error = new Error("Current password is incorrect.");
    error.statusCode = 401;
    throw error;
  }

  const passwordHash = await bcrypt.hash(payload.newPassword, 10);
  const updatedUser = await model.updatePasswordHash(userId, passwordHash);
  return publicUser(updatedUser);
}

async function createManagedUser(payload) {
  if (!payload.firstName || !payload.lastName || !payload.email || !payload.role) {
    const error = new Error("First name, last name, email, and role are required.");
    error.statusCode = 400;
    throw error;
  }

  const allowedRoles = ["business_owner", "tourism_staff", "admin"];
  if (!allowedRoles.includes(payload.role)) {
    const error = new Error("Invalid role.");
    error.statusCode = 400;
    throw error;
  }

  const email = payload.email.toLowerCase();
  const existing = await model.findUserByEmail(email);
  if (existing) {
    const error = new Error("A user with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const temporaryPassword = payload.password || "password123";
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  const user = await model.createUser({
    firstName: payload.firstName,
    middleName: payload.middleName,
    lastName: payload.lastName,
    sex: payload.sex,
    email,
    phone: payload.phone,
    telephone: payload.telephone,
    passwordHash,
    role: payload.role,
    status: payload.status || "active",
  });

  return { user: publicUser(user), temporaryPassword };
}

module.exports = {
  addDocument,
  changePassword,
  createManagedUser,
  createApplication,
  deleteDraftApplication,
  getCurrentUser,
  login,
  registerBusinessOwner,
  reviewApplication,
  saveApplicationDraft,
  submitApplication,
  updateAccountProfile,
  verifyEmail,
};
