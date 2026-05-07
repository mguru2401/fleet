const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../utils/password');

// Only admin can add/update working days
router.post('/', authMiddleware, isAdmin, attendanceController.upsertWorkingDays);

// View working days
router.get('/:driver_id', authMiddleware, attendanceController.getWorkingDays);

module.exports = router;
