const express = require('express');

const visitorRoutes = require('../modules/visitor/visitor.route');

const router = express.Router();

router.use(visitorRoutes);

module.exports = router;
