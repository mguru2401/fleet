const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// User Dashboard (Earnings/Trips)
router.get('/user', auth, dashboardController.getDriverDashboard);

// User Salary Dashboard (Preview settlement)
router.get('/user/salary', auth, dashboardController.getDriverSalaryDashboard);

// Admin Dashboard (Basic)
router.get('/admin', auth, admin, dashboardController.getAdminDashboard);

// Admin Salary Dashboard (Detailed for settlement)
router.get('/admin/salary', auth, admin, dashboardController.getAdminSalaryDashboard);

module.exports = router;
