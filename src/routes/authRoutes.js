const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../utils/password');

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================
router.post('/login', authController.login);

// ============================================
// PROTECTED ROUTES (Require Auth)
// ============================================
router.get('/profile', authMiddleware, authController.getProfile);
router.post('/logout', authMiddleware, authController.logout);

// ============================================
// ADMIN ONLY ROUTES
// ============================================
// Create User
router.post('/users', authMiddleware, isAdmin, authController.createUser);

// Get All Users
router.get('/users', authMiddleware, isAdmin, authController.getAllUsers);

// Get User by ID
router.get('/users/:userId', authMiddleware, authController.getUserById);

// Update User
router.put('/users/:userId', authMiddleware, authController.updateUser);

// Delete User (Admin only)
router.delete('/users/:userId', authMiddleware, isAdmin, authController.deleteUser);

// ============================================
// HEALTH CHECK ROUTES
// ============================================
router.get('/health', authController.health);
router.get('/health/detailed', authController.healthDetailed);

module.exports = router;
