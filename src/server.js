require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const advanceRoutes = require('./routes/advanceRoutes');
const carRoutes = require('./routes/carRoutes');
const revenueRoutes = require('./routes/revenueRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// GLOBAL HEALTH CHECK
// ============================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Fleet API - Welcome',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      health: '/api/auth/health',
      healthDetailed: '/api/auth/health/detailed'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/advances', advanceRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`\nAPI Server running on http://localhost:${PORT}`);
});
