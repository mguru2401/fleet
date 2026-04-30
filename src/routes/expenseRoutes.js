const express = require('express');
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ============================================
// EXPENSE ROUTES
// ============================================

// Create Expense
router.post('/', authMiddleware, expenseController.createExpense);

// Get All Expenses
router.get('/', authMiddleware, expenseController.getAllExpenses);

// Get Expense Breakdown by Car (Stats)
router.get('/stats/breakdown', authMiddleware, expenseController.getExpenseBreakdownByCar);

// Get Expense by ID
router.get('/:expenseId', authMiddleware, expenseController.getExpenseById);

// Update Expense
router.put('/:expenseId', authMiddleware, expenseController.updateExpense);

// Delete Expense
router.delete('/:expenseId', authMiddleware, expenseController.deleteExpense);

module.exports = router;
