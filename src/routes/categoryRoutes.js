const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// All category routes require authentication
router.use(auth);

// CRUD Endpoints
router.post('/', admin, categoryController.createCategory);
router.get('/', categoryController.getAllCategories);
router.put('/:id', admin, categoryController.updateCategory);
router.delete('/:id', admin, categoryController.deleteCategory);

module.exports = router;
