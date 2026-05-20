const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = require("express").Router();
const controller = require("./accreditation.controller");
const { authenticate, authorize } = require("../../middleware/auth");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = "uploads/accreditation-documents";
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

router.post("/auth/register", controller.register);
router.get("/auth/verify-email", controller.verifyEmail);
router.post("/auth/login", controller.login);

router.get("/dashboard", authenticate, controller.dashboard);
router.patch("/account", authenticate, controller.updateAccount);
router.patch("/account/password", authenticate, controller.changePassword);
router
  .route("/profile")
  .get(authenticate, authorize("business_owner"), controller.getProfile)
  .patch(authenticate, authorize("business_owner"), controller.updateProfile);

router
  .route("/applications")
  .get(authenticate, controller.listApplications)
  .post(authenticate, authorize("business_owner"), controller.createApplication);

router.get("/applications/:id", authenticate, controller.getApplication);
router.patch(
  "/applications/:id/draft",
  authenticate,
  authorize("business_owner"),
  controller.saveApplicationDraft
);
router.post(
  "/applications/:id/documents",
  authenticate,
  authorize("business_owner"),
  upload.single("document"),
  controller.uploadDocument
);
router.patch(
  "/applications/:id/submit",
  authenticate,
  authorize("business_owner"),
  controller.submitApplication
);
router.patch(
  "/applications/:id/review",
  authenticate,
  authorize("tourism_staff", "tourism_officer", "admin"),
  controller.reviewApplication
);

router.get(
  "/records",
  authenticate,
  authorize("tourism_staff", "tourism_officer", "admin"),
  controller.listRecords
);
router.get("/notifications", authenticate, controller.listNotifications);
router.patch("/notifications/:id/read", authenticate, controller.markNotificationRead);

router
  .route("/admin/users")
  .get(authenticate, authorize("admin"), controller.listUsers)
  .post(authenticate, authorize("admin"), controller.createUser);
router.patch("/admin/users/:id/status", authenticate, authorize("admin"), controller.updateUserStatus);
router.get("/admin/audit-logs", authenticate, authorize("admin"), controller.listAuditLogs);

module.exports = router;
