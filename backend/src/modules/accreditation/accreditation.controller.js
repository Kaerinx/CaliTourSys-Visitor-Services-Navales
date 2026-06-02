const model = require("./accreditation.model");
const service = require("./accreditation.service");
const fs = require("fs");
const path = require("path");

async function audit(req, event) {
  try {
    const actor = event.actor || req.user || {};
    await model.createAuditLog({
      actorId: actor.id,
      actorName: actor.email || actor.name,
      actorRole: actor.role,
      action: event.action,
      module: event.module || "Accreditation",
      severity: event.severity || "low",
      referenceId: event.referenceId,
      outcome: event.outcome || "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      details: event.details,
    });
  } catch (error) {
    console.error("Unable to write audit log:", error.message);
  }
}

function listPayload(key, result) {
  if (Array.isArray(result)) return { [key]: result };
  return { [key]: result.items, pagination: result.pagination };
}

async function register(req, res, next) {
  try {
    const result = await service.registerBusinessOwner(req.body);
    await audit(req, {
      actor: result.user,
      action: "Registered business owner account",
      module: "Authentication",
      referenceId: result.user?.email,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const user = await service.verifyEmail(req.query.token);
    res.json({ message: "Email verified successfully.", user });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await service.login(req.body.email, req.body.password);
    await audit(req, {
      actor: result.user,
      action: "Logged in",
      module: "Authentication",
      referenceId: result.user?.email,
    });
    res.json(result);
  } catch (error) {
    await audit(req, {
      actor: { email: req.body?.email },
      action: "Failed login attempt",
      module: "Authentication",
      severity: "medium",
      referenceId: req.body?.email,
      outcome: "failed",
      details: error.message,
    });
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await service.getCurrentUser(req.user.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const profile = await model.getBusinessProfile(req.user.id);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const profile = await model.updateBusinessProfile(req.user.id, req.body);
    if (!profile) {
      return res.status(404).json({ message: "Business profile not found." });
    }
    await audit(req, {
      action: "Updated business profile",
      module: "Business Profile",
      referenceId: profile.id,
    });
    return res.json({ profile, message: "Business profile updated successfully." });
  } catch (error) {
    return next(error);
  }
}

async function createApplication(req, res, next) {
  try {
    const application = await service.saveApplicationDraft(req.user.id, req.body);
    res.status(201).json({ application, message: "Draft saved successfully." });
  } catch (error) {
    next(error);
  }
}

async function saveApplicationDraft(req, res, next) {
  try {
    const application = await service.saveApplicationDraft(req.user.id, {
      ...req.body,
      applicationId: req.params.id,
    });
    return res.json({ application, message: "Draft saved successfully." });
  } catch (error) {
    return next(error);
  }
}

async function listApplications(req, res, next) {
  try {
    const ownerId = req.user.role === "business_owner" ? req.user.id : null;
    const applications = await model.listApplications({
      ownerId,
      status: req.query.status,
      q: req.query.q,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });
    res.json(listPayload("applications", applications));
  } catch (error) {
    next(error);
  }
}

async function getApplication(req, res, next) {
  try {
    const application = await model.getApplicationById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }
    if (req.user.role === "business_owner" && application.owner_id !== req.user.id) {
      return res.status(403).json({ message: "You do not have permission to view this application." });
    }
    const documents = await model.listDocuments(application.id);
    return res.json({ application, documents });
  } catch (error) {
    return next(error);
  }
}

async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Document file is required." });
    }
    const document = await service.addDocument(
      req.params.id,
      req.file,
      req.body,
      req.user.id
    );
    await audit(req, {
      action: "Uploaded application document",
      module: "Documents",
      referenceId: document.id,
      details: `${document.document_type} uploaded for application ${req.params.id}.`,
    });
    return res.status(201).json({ document });
  } catch (error) {
    return next(error);
  }
}

async function submitApplication(req, res, next) {
  try {
    const application = await service.submitApplication(req.user.id, req.params.id);
    await audit(req, {
      action: "Submitted accreditation application",
      module: "Applications",
      referenceId: application.application_number,
    });
    return res.json({ application, message: "Application submitted successfully." });
  } catch (error) {
    return next(error);
  }
}

async function reviewApplication(req, res, next) {
  try {
    const application = await service.reviewApplication(req.user.id, req.params.id, req.body);
    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }
    await audit(req, {
      action: `Reviewed application as ${application.status}`,
      module: "Applications",
      referenceId: application.application_number,
      details: req.body.remarks || null,
    });
    return res.json({ application });
  } catch (error) {
    return next(error);
  }
}

async function listRecords(req, res, next) {
  try {
    const records = await model.listAccreditationRecords(req.query);
    res.json(listPayload("records", records));
  } catch (error) {
    next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await model.listUsers(req.query);
    res.json(listPayload("users", users));
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const result = await service.createManagedUser(req.body);
    await audit(req, {
      action: "Created managed user",
      module: "User Management",
      referenceId: result.user.email,
      details: `Role: ${result.user.role}`,
    });
    return res.status(201).json({
      user: result.user,
      temporaryPassword: result.temporaryPassword,
      message: "User created successfully.",
    });
  } catch (error) {
    return next(error);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const user = await model.updateUserStatus(req.params.id, req.body.status);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    await audit(req, {
      action: "Updated user status",
      module: "User Management",
      referenceId: user?.email || req.params.id,
      details: `New status: ${user?.status}`,
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

async function listAuditLogs(req, res, next) {
  try {
    const logs = await model.listAuditLogs(req.query);
    res.json(listPayload("logs", logs));
  } catch (error) {
    next(error);
  }
}

async function listNotifications(req, res, next) {
  try {
    const notifications = await model.listNotifications({
      userId: req.user.id,
      role: req.user.role,
    });
    res.json({
      notifications,
      unreadCount: notifications.filter((item) => !item.is_read).length,
    });
  } catch (error) {
    next(error);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const notification = await model.markNotificationRead(req.params.id, {
      userId: req.user.id,
      role: req.user.role,
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }
    return res.json({ notification });
  } catch (error) {
    return next(error);
  }
}

async function updateAccount(req, res, next) {
  try {
    const user = await service.updateAccountProfile(req.user.id, req.body);
    await audit(req, {
      action: "Updated account profile",
      module: "Account",
      referenceId: user.email,
    });
    return res.json({ user, message: "Personal information updated successfully." });
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    await service.changePassword(req.user.id, req.body);
    await audit(req, {
      action: "Changed password",
      module: "Account",
      severity: "medium",
    });
    return res.json({ message: "Password updated successfully." });
  } catch (error) {
    return next(error);
  }
}

async function dashboard(req, res, next) {
  try {
    const ownerId = req.user.role === "business_owner" ? req.user.id : null;
    const [applications, users, logs] = await Promise.all([
      model.listApplications({ ownerId }),
      req.user.role === "admin" ? model.listUsers() : Promise.resolve([]),
      req.user.role === "admin" ? model.listAuditLogs() : Promise.resolve([]),
    ]);

    res.json({
      role: req.user.role,
      totals: {
        applications: applications.length,
        draft: applications.filter((app) => app.status === "draft").length,
        submitted: applications.filter((app) => app.status === "submitted").length,
        underReview: applications.filter((app) => app.status === "under_review").length,
        forRevision: applications.filter((app) => app.status === "for_revision").length,
        approved: applications.filter((app) => app.status === "approved").length,
        users: users.length,
        auditEvents: logs.length,
      },
      recentApplications: applications.slice(0, 5),
      recentAuditLogs: logs.slice(0, 5),
    });
  } catch (error) {
    next(error);
  }
}

async function downloadDocument(req, res, next) {
  try {
    const document = await model.getDocumentById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    const canAccess =
      ["tourism_staff", "admin"].includes(req.user.role) ||
      (req.user.role === "business_owner" && document.owner_id === req.user.id);

    if (!canAccess) {
      return res.status(403).json({ message: "You do not have permission to view this document." });
    }

    const uploadsRoot = path.resolve("uploads");
    const documentPath = path.resolve(document.file_path);
    if (!documentPath.startsWith(uploadsRoot) || !fs.existsSync(documentPath)) {
      return res.status(404).json({ message: "Document file not found." });
    }

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${String(document.original_name || "document").replace(/"/g, "")}"`
    );
    if (document.mime_type) res.type(document.mime_type);
    return res.sendFile(documentPath);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  changePassword,
  createApplication,
  createUser,
  dashboard,
  downloadDocument,
  getApplication,
  getProfile,
  listApplications,
  listAuditLogs,
  listNotifications,
  listRecords,
  listUsers,
  login,
  markNotificationRead,
  me,
  register,
  reviewApplication,
  saveApplicationDraft,
  submitApplication,
  updateAccount,
  updateProfile,
  updateUserStatus,
  uploadDocument,
  verifyEmail,
};
