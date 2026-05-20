const model = require("./accreditation.model");
const service = require("./accreditation.service");

async function register(req, res, next) {
  try {
    const result = await service.registerBusinessOwner(req.body);
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
    res.json(result);
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
    });
    res.json({ applications });
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
    return res.status(201).json({ document });
  } catch (error) {
    return next(error);
  }
}

async function submitApplication(req, res, next) {
  try {
    const application = await service.submitApplication(req.user.id, req.params.id);
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
    return res.json({ application });
  } catch (error) {
    return next(error);
  }
}

async function listRecords(_req, res, next) {
  try {
    const records = await model.listAccreditationRecords();
    res.json({ records });
  } catch (error) {
    next(error);
  }
}

async function listUsers(_req, res, next) {
  try {
    const users = await model.listUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const result = await service.createManagedUser(req.body);
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
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

async function listAuditLogs(_req, res, next) {
  try {
    const logs = await model.listAuditLogs();
    res.json({ logs });
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
    res.json({ notifications });
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
    return res.json({ user, message: "Personal information updated successfully." });
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    await service.changePassword(req.user.id, req.body);
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

module.exports = {
  changePassword,
  createApplication,
  createUser,
  dashboard,
  getApplication,
  getProfile,
  listApplications,
  listAuditLogs,
  listNotifications,
  listRecords,
  listUsers,
  login,
  markNotificationRead,
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
