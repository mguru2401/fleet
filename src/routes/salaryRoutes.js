const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Calculate Salary (Preview)
router.get('/calculate', auth, admin, salaryController.calculateSalary);

// Settle Salary
router.post('/settle', auth, admin, salaryController.settleSalary);

// All Salary History (Admin)
router.get('/history', auth, admin, salaryController.getSalaryHistory);

// My Salary History (Driver)
router.get('/my-history', auth, salaryController.getMySalaryHistory);

// Set Desired Salary (Driver)
router.post('/set-desired-salary', auth, salaryController.setDesiredSalary);

// Goal Progress Status (Driver)
router.get('/goal-status', auth, salaryController.getSalaryVsDesired);

// Daily Earnings History (Driver)
router.get('/daily-earnings', auth, salaryController.getDailyEarnings);

// Payslip Detail
router.get('/payslip/:history_id', auth, salaryController.getPayslip);

module.exports = router;
