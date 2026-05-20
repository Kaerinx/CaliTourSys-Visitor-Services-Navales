const router = require("express").Router();
const accreditationRoutes = require("../modules/accreditation/accreditation.route");

router.use("/accreditation", accreditationRoutes);

module.exports = router;
