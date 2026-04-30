const express = require('express');
const advanceController = require('../controllers/advanceController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// ============================================
// SALARY ADVANCE ROUTES (Admin Privileged)
// ============================================

// Create Advance (Admin Only)
router.post('/', authMiddleware, adminMiddleware, advanceController.createAdvance);

// Get All Advances (Available to authenticated users, filtered by role logic in controller if needed, but here simple retrieval)
router.get('/', authMiddleware, advanceController.getAllAdvances);

// Update Advance (Admin Only - e.g., to mark as deducted)
router.put('/:advanceId', authMiddleware, adminMiddleware, advanceController.updateAdvance);

// Delete Advance (Admin Only)
router.delete('/:advanceId', authMiddleware, adminMiddleware, advanceController.deleteAdvance);

module.exports = router;
