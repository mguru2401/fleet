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

    const { driver_id: providedDriverId, car_id: providedCarId } = req.body;
    const targetDriverId = providedDriverId || userId;
    let resolvedCarNo = 'N/A';
    let resolvedCarId = providedCarId || null;

    if (resolvedCarId) {
      // Resolve from provided car_id
      const { data: car } = await supabase.from('cars').select('car_no').eq('id', resolvedCarId).single();
      if (car) resolvedCarNo = car.car_no;
    } else {
      // Resolve from driver's profile
      const { data: user } = await supabase
        .from('users')
        .select('car_id, cars(car_no)')
        .eq('id', targetDriverId)
        .single();
      
      if (user) {
        resolvedCarId = user.car_id;
        if (user.cars) resolvedCarNo = user.cars.car_no;
      }
    }

    // Create expense
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        driver_id: targetDriverId,
        car_no: resolvedCarNo,
        driver_name: providedDriverId ? (req.body.driver_name || 'Driver') : userName,
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

    // If driver_id or car_id is updated, resolve new car_no
    if (updateData.driver_id || updateData.car_id) {
      let resolvedCarId = updateData.car_id;
      if (!resolvedCarId && updateData.driver_id) {
        const { data: user } = await supabase.from('users').select('car_id').eq('id', updateData.driver_id).single();
        if (user) resolvedCarId = user.car_id;
      }

      if (resolvedCarId) {
        const { data: car } = await supabase.from('cars').select('car_no').eq('id', resolvedCarId).single();
        if (car) updateData.car_no = car.car_no;
      }
    }

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

// Get Expense Breakdown by Car (with Trip Revenue and Salary Advances)
const getExpenseBreakdownByCar = async (req, res) => {
  try {
    const now = new Date();
    let { month, year } = req.query;

    const filterMonth = month ? parseInt(month) : now.getMonth() + 1;
    const filterYear = year ? parseInt(year) : now.getFullYear();

    const startDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(filterYear, filterMonth, 0).getDate();
    const endDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // 1. Fetch expenses
    const { data: expenses, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    // 2. Fetch trips for revenue
    const { data: trips, error: tripError } = await supabase
      .from('trips')
      .select('car_no, trip_rate')
      .gte('pick_up_date', startDate)
      .lte('pick_up_date', endDate);

    // 3. Fetch advances
    const { data: advances, error: advanceError } = await supabase
      .from('advances')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (expenseError || tripError) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching financial data',
        error: expenseError?.message || tripError?.message
      });
    }

    const breakdownMap = {};
    let grandTotalExpense = 0;
    let grandTotalRevenue = 0;
    let grandTotalAdvances = 0;

    const initCar = (carNo) => {
      if (!breakdownMap[carNo]) {
        breakdownMap[carNo] = {
          car_no: carNo,
          total_expense: 0,
          total_revenue: 0,
          total_advances: 0,
          expense_entries: [],
          advance_entries: []
        };
      }
    };

    expenses.forEach(e => {
      const carNo = e.car_no || 'N/A';
      initCar(carNo);
      const amount = parseFloat(e.amount) || 0;
      breakdownMap[carNo].expense_entries.push(e);
      breakdownMap[carNo].total_expense += amount;
      grandTotalExpense += amount;
    });

    trips.forEach(t => {
      const carNo = t.car_no || 'N/A';
      initCar(carNo);
      const rate = parseFloat(t.trip_rate) || 0;
      breakdownMap[carNo].total_revenue += rate;
      grandTotalRevenue += rate;
    });

    if (advances) {
      advances.forEach(a => {
        const carNo = a.car_no || 'N/A';
        initCar(carNo);
        const amount = parseFloat(a.amount) || 0;
        breakdownMap[carNo].advance_entries.push(a);
        breakdownMap[carNo].total_advances += amount;
        grandTotalAdvances += amount;
      });
    }

    const breakdownArray = Object.values(breakdownMap).map(item => ({
      ...item,
      total_out: item.total_expense + item.total_advances,
      net_profit: item.total_revenue - (item.total_expense + item.total_advances)
    }));

    return res.status(200).json({
      success: true,
      message: 'Expense and Revenue breakdown retrieved successfully',
      period: { month: filterMonth, year: filterYear, startDate, endDate },
      summary: {
        total_revenue: grandTotalRevenue,
        total_expense: grandTotalExpense,
        total_advances: grandTotalAdvances,
        total_out: grandTotalExpense + grandTotalAdvances,
        net_profit: grandTotalRevenue - (grandTotalExpense + grandTotalAdvances),
        car_count: breakdownArray.length
      },
      data: breakdownArray
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
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
