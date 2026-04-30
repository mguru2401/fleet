const supabase = require('../config/supabase');

// ============================================
// EXPENSES CRUD ENDPOINTS
// ============================================

// Create Expense
const createExpense = async (req, res) => {
  try {
    const { date, description, reason, amount } = req.body;
    
    // Get user from token (attached by auth middleware)
    const userId = req.user.id;
    const userName = req.user.name;

    // Validate required fields
    if (!date || !amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing (date, amount, reason)'
      });
    }

    // Get user's car_no
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('car_no')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create expense
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        driver_id: userId,
        car_no: user.car_no || 'N/A',
        driver_name: userName,
        date: date,
        description: description || '',
        reason: reason,
        amount: parseFloat(amount),
        status: 'pending' // default status
      })
      .select();

    if (error) {
      console.error('Error creating expense:', error);
      return res.status(400).json({
        success: false,
        message: 'Error creating expense',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense[0]
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get All Expenses
const getAllExpenses = async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, driver_id, car_no } = req.query;

    let query = supabase.from('expenses').select('*');

    // Apply filters if provided
    if (status) {
      query = query.eq('status', status.toLowerCase());
    }
    if (driver_id) {
      query = query.eq('driver_id', driver_id);
    }
    if (car_no) {
      query = query.eq('car_no', car_no);
    }

    const { data: expenses, error } = await query
      .order('date', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error('Error fetching expenses:', error);
      return res.status(400).json({
        success: false,
        message: 'Error fetching expenses',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Expenses retrieved successfully',
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Expense by ID
const getExpenseById = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const { data: expense, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', expenseId)
      .single();

    if (error || !expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Expense retrieved successfully',
      data: expense
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update Expense
const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const updateData = req.body;

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const { data: expense, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', expenseId)
      .select();

    if (error) {
      console.error('Error updating expense:', error);
      return res.status(400).json({
        success: false,
        message: 'Error updating expense',
        error: error.message
      });
    }

    if (!expense || expense.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: expense[0]
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete Expense
const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      console.error('Error deleting expense:', error);
      return res.status(400).json({
        success: false,
        message: 'Error deleting expense',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Expense Breakdown by Car
const getExpenseBreakdownByCar = async (req, res) => {
  try {
    const now = new Date();
    let { month, year } = req.query;

    // Default to current month and year if not provided
    const filterMonth = month ? parseInt(month) : now.getMonth() + 1;
    const filterYear = year ? parseInt(year) : now.getFullYear();

    // Create date range for the specified month
    const startDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(filterYear, filterMonth, 0).getDate();
    const endDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Get expenses within the date range
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses breakdown:', error);
      return res.status(400).json({
        success: false,
        message: 'Error fetching expenses breakdown',
        error: error.message
      });
    }

    // Group expenses by car_no
    const breakdownMap = {};
    let grandTotal = 0;

    expenses.forEach(expense => {
      const carNo = expense.car_no || 'N/A';
      
      if (!breakdownMap[carNo]) {
        breakdownMap[carNo] = {
          car_no: carNo,
          total_amount: 0,
          entry_count: 0,
          entries: []
        };
      }
      
      const amount = parseFloat(expense.amount) || 0;
      breakdownMap[carNo].entries.push(expense);
      breakdownMap[carNo].total_amount += amount;
      breakdownMap[carNo].entry_count += 1;
      grandTotal += amount;
    });

    // Convert map to array for easier consumption
    const breakdownArray = Object.values(breakdownMap);

    return res.status(200).json({
      success: true,
      message: 'Expense breakdown retrieved successfully',
      period: {
        month: filterMonth,
        year: filterYear,
        startDate,
        endDate
      },
      summary: {
        total_amount: grandTotal,
        car_count: breakdownArray.length,
        total_entries: expenses.length
      },
      data: breakdownArray
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseBreakdownByCar
};
