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

    // 2. Fetch trips with extra fields for salary calculation (driver_id, net_amount, category, pick_up_date)
    const { data: trips, error: tripError } = await supabase
      .from('trips')
      .select('car_no, trip_rate, category, net_amount, pick_up_date, driver_id')
      .gte('pick_up_date', startDate)
      .lte('pick_up_date', endDate);

    // 3. Fetch advances
    const { data: advances, error: advanceError } = await supabase
      .from('advances')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    // 4. Fetch all drivers (non-admins) along with their car details
    const { data: drivers, error: driversError } = await supabase
      .from('users')
      .select('id, name, role, revenue_per_day, desired_salary, car_id, cars(car_no)')
      .neq('role', 'admin');

    // 5. Fetch salary history for the month
    const { data: salaryHistory, error: historyError } = await supabase
      .from('salary_history')
      .select('driver_id, basic_pay, final_salary')
      .eq('month', filterMonth)
      .eq('year', filterYear);

    if (expenseError || tripError || advanceError || driversError || historyError) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching financial data',
        error: expenseError?.message || tripError?.message || advanceError?.message || driversError?.message || historyError?.message
      });
    }

    // --- Helper to calculate salary for a driver for the month ---
    const BASE_SALARY_PER_DAY = 1136.36;
    const INCENTIVE_PERCENTAGE = 0.30;

    const calculateDriverSalary = (driverTrips, revenuePerDay) => {
      const dailyEarnings = {};
      
      (driverTrips || []).forEach(trip => {
        const date = trip.pick_up_date;
        if (!dailyEarnings[date]) {
          dailyEarnings[date] = {
            total_revenue: 0,
            working_day: false
          };
        }
        
        const amount = (trip.net_amount !== undefined && trip.net_amount !== null) 
          ? parseFloat(trip.net_amount) 
          : parseFloat(trip.trip_rate);
        const val = amount || 0;
        
        dailyEarnings[date].total_revenue += val;

        const category = trip.category ? trip.category.toLowerCase() : '';
        if (category !== 'ola' && category !== 'uber') {
          dailyEarnings[date].working_day = true;
        }
      });

      let totalRevenue = 0;
      let totalTargetedRevenue = 0;
      let totalBase = 0;

      Object.values(dailyEarnings).forEach(dayData => {
        totalRevenue += dayData.total_revenue;
        if (dayData.working_day) {
          totalBase += BASE_SALARY_PER_DAY;
          totalTargetedRevenue += revenuePerDay;
        }
      });

      const eligibleIncentiveAmount = Math.max(0, totalRevenue - totalTargetedRevenue);
      const totalIncentive = eligibleIncentiveAmount * INCENTIVE_PERCENTAGE;
      const totalSalary = totalBase + totalIncentive;

      return totalSalary;
    };

    // --- Process driver salaries and associate with cars ---
    const carSalariesMap = {};
    (drivers || []).forEach(driver => {
      const driverTrips = (trips || []).filter(t => t.driver_id === driver.id);
      const historyRecord = (salaryHistory || []).find(h => h.driver_id === driver.id);
      
      const driverSalary = historyRecord 
        ? parseFloat(historyRecord.basic_pay) 
        : calculateDriverSalary(driverTrips, parseFloat(driver.revenue_per_day) || 0);

      // Determine car_no for driver
      let driverCarNo = 'N/A';
      if (driver.cars && driver.cars.car_no) {
        driverCarNo = driver.cars.car_no;
      } else {
        // Fallback: Find the most frequent car_no in driver's trips
        if (driverTrips.length > 0) {
          const carCounts = {};
          driverTrips.forEach(t => {
            if (t.car_no) {
              carCounts[t.car_no] = (carCounts[t.car_no] || 0) + 1;
            }
          });
          const sortedCars = Object.keys(carCounts).sort((a, b) => carCounts[b] - carCounts[a]);
          if (sortedCars.length > 0) {
            driverCarNo = sortedCars[0];
          }
        }
      }

      if (!carSalariesMap[driverCarNo]) {
        carSalariesMap[driverCarNo] = {
          driver_salaries: 0,
          salary_entries: []
        };
      }
      carSalariesMap[driverCarNo].driver_salaries += driverSalary;
      carSalariesMap[driverCarNo].salary_entries.push({
        driver_id: driver.id,
        driver_name: driver.name,
        salary: Math.round(driverSalary),
        is_settled: !!historyRecord
      });
    });

    const breakdownMap = {};

    const initCar = (carNo) => {
      if (!breakdownMap[carNo]) {
        breakdownMap[carNo] = {
          car_no: carNo,
          total_revenue: 0,
          driver_expenses: 0, // regular expenses from expenses table
          total_advances: 0,
          driver_salaries: 0,
          total_expense: 0, // driver_expenses + total_advances + driver_salaries
          net_profit: 0,
          expense_entries: [],
          advance_entries: [],
          salary_entries: []
        };
      }
    };

    // Group expenses by car_no
    (expenses || []).forEach(e => {
      const carNo = e.car_no || 'N/A';
      initCar(carNo);
      const amount = parseFloat(e.amount) || 0;
      breakdownMap[carNo].expense_entries.push(e);
      breakdownMap[carNo].driver_expenses += amount;
    });

    // Group trips (revenue) by car_no
    (trips || []).forEach(t => {
      const carNo = t.car_no || 'N/A';
      initCar(carNo);
      // Prefer net_amount if available, otherwise trip_rate
      const amount = (t.net_amount !== undefined && t.net_amount !== null) ? parseFloat(t.net_amount) : parseFloat(t.trip_rate);
      const rate = amount || 0;
      breakdownMap[carNo].total_revenue += rate;
    });

    // Group advances by car_no
    if (advances) {
      advances.forEach(a => {
        const carNo = a.car_no || 'N/A';
        initCar(carNo);
        const amount = parseFloat(a.amount) || 0;
        breakdownMap[carNo].advance_entries.push(a);
        breakdownMap[carNo].total_advances += amount;
      });
    }

    // Merge driver salaries into breakdown map
    Object.keys(carSalariesMap).forEach(carNo => {
      initCar(carNo);
      breakdownMap[carNo].driver_salaries = carSalariesMap[carNo].driver_salaries;
      breakdownMap[carNo].salary_entries = carSalariesMap[carNo].salary_entries;
    });

    // Calculate final totals and array
    let grandTotalRevenue = 0;
    let grandTotalDriverExpenses = 0;
    let grandTotalAdvances = 0;
    let grandTotalSalaries = 0;
    let grandTotalExpense = 0;
    let grandTotalNetProfit = 0;

    const breakdownArray = Object.values(breakdownMap).map(item => {
      const driver_expenses = Math.round(item.driver_expenses * 100) / 100;
      const total_advances = Math.round(item.total_advances * 100) / 100;
      const driver_salaries = Math.round(item.driver_salaries * 100) / 100;
      const total_revenue = Math.round(item.total_revenue * 100) / 100;
      
      const total_expense = Math.round((driver_expenses + total_advances + driver_salaries) * 100) / 100;
      const net_profit = Math.round((total_revenue - total_expense) * 100) / 100;

      // Update grand totals
      grandTotalRevenue += total_revenue;
      grandTotalDriverExpenses += driver_expenses;
      grandTotalAdvances += total_advances;
      grandTotalSalaries += driver_salaries;
      grandTotalExpense += total_expense;
      grandTotalNetProfit += net_profit;

      return {
        car_no: item.car_no,
        total_revenue,
        driver_expenses,
        total_advances,
        driver_salaries,
        total_expense,
        total_out: total_expense, // alias for backwards compatibility
        net_profit,
        expense_entries: item.expense_entries,
        advance_entries: item.advance_entries,
        salary_entries: item.salary_entries
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Expense and Revenue breakdown retrieved successfully',
      period: { month: filterMonth, year: filterYear, startDate, endDate },
      summary: {
        total_revenue: Math.round(grandTotalRevenue * 100) / 100,
        driver_expenses: Math.round(grandTotalDriverExpenses * 100) / 100,
        total_expense: Math.round(grandTotalExpense * 100) / 100,
        total_advances: Math.round(grandTotalAdvances * 100) / 100,
        driver_salaries: Math.round(grandTotalSalaries * 100) / 100,
        total_out: Math.round(grandTotalExpense * 100) / 100, // alias for backwards compatibility
        net_profit: Math.round(grandTotalNetProfit * 100) / 100,
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
