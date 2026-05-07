const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenueController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, revenueController.recordRevenue);
router.get('/driver/:driver_id', authMiddleware, revenueController.getDriverRevenue);

module.exports = router;
