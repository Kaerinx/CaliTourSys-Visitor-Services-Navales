const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = require("express").Router();
const controller = require("./accreditation.controller");
const { authenticate, authorize } = require("./accreditation.auth");

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
    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
      const error = new Error("Only PDF, JPG, and PNG documents are allowed.");
      error.statusCode = 400;
      return cb(error);
    }
    return cb(null, true);
  },
});

const profileImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = "uploads/accreditation-business-profiles";
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const safeName = path
      .basename(file.originalname || "business-photo", extension)
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .slice(0, 60);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}${extension}`);
  },
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
      const error = new Error("Only JPG, PNG, and WebP business photos are allowed.");
      error.statusCode = 400;
      return cb(error);
    }
    return cb(null, true);
  },
});

const registrationProofStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.resolve(__dirname, "../../../uploads/accreditation-registration-proofs");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const safeName = path
      .basename(file.originalname || "registration-proof", extension)
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .slice(0, 60);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}${extension}`);
  },
});

const registrationProofUpload = multer({
  storage: registrationProofStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png"];
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    const extension = path.extname(file.originalname || "").toLowerCase();
    if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(extension)) {
      const error = new Error("Registration proofs must be JPG or PNG images.");
      error.statusCode = 400;
      return cb(error);
    }
    return cb(null, true);
  },
});

router.post(
  "/auth/register",
  registrationProofUpload.fields([
    { name: "businessPermitProof", maxCount: 1 },
    { name: "registrationCertificateProof", maxCount: 1 },
    { name: "representativeValidId", maxCount: 1 },
  ]),
  controller.register
);
router.get("/auth/verify-email", controller.verifyEmail);
router.post("/auth/login", controller.login);
router.get("/auth/me", authenticate, controller.me);

router.get("/dashboard", authenticate, controller.dashboard);
router.patch("/account", authenticate, controller.updateAccount);
router.patch("/account/password", authenticate, controller.changePassword);
router
  .route("/profile")
  .get(authenticate, authorize("business_owner"), controller.getProfile)
  .patch(authenticate, authorize("business_owner"), controller.updateProfile);
router.post(
  "/profile/images",
  authenticate,
  authorize("business_owner"),
  profileImageUpload.array("photos", 5),
  controller.uploadProfileImages
);
router.delete(
  "/profile/images/:imageId",
  authenticate,
  authorize("business_owner"),
  controller.deleteProfileImage
);

router
  .route("/applications")
  .get(authenticate, controller.listApplications)
  .post(authenticate, authorize("business_owner"), controller.createApplication);

router
  .route("/applications/:id")
  .get(authenticate, controller.getApplication)
  .delete(authenticate, authorize("business_owner"), controller.deleteDraftApplication);
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
  authorize("tourism_staff", "admin"),
  controller.reviewApplication
);
router.get("/documents/:id/download", authenticate, controller.downloadDocument);
router.get(
  "/registration-documents/:id/download",
  authenticate,
  controller.downloadRegistrationDocument
);

router.get(
  "/records",
  authenticate,
  authorize("tourism_staff", "admin"),
  controller.listRecords
);
router.get("/notifications", authenticate, controller.listNotifications);
router.patch("/notifications/:id/read", authenticate, controller.markNotificationRead);

router
  .route("/admin/users")
  .get(authenticate, authorize("tourism_staff", "admin"), controller.listUsers)
  .post(authenticate, authorize("admin"), controller.createUser);
router.patch("/admin/users/:id/status", authenticate, authorize("tourism_staff", "admin"), controller.updateUserStatus);
router.get("/admin/audit-logs", authenticate, authorize("admin"), controller.listAuditLogs);

module.exports = router;
