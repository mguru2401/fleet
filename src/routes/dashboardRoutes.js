const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// User Dashboard
router.get('/user', auth, dashboardController.getDriverDashboard);

// Admin Dashboard
router.get('/admin', auth, admin, dashboardController.getAdminDashboard);

module.exports = router;
