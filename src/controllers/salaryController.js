const supabase = require('../config/supabase');

// Constants
const BASE_SALARY_PER_DAY = 1136.36;
const INCENTIVE_PERCENTAGE = 0.30;
const OLA_UBER_PERCENTAGE = 0.30;

// ============================================
// SALARY MANAGEMENT ENDPOINTS
// ============================================

// Calculate Salary (Detailed)
const calculateSalary = async (req, res) => {
  try {
    const { driver_id, month, year } = req.query;

    if (!driver_id || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'driver_id, month, and year are required'
      });
    }

    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);

    // 1. Get Driver Details
    const { data: driver, error: driverError } = await supabase
      .from('users')
      .select('name, revenue_per_day, desired_salary')
      .eq('id', driver_id)
      .single();

    if (driverError || !driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const revenuePerDay = parseFloat(driver.revenue_per_day) || 0;

    // 2. Get all trips for the month
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: trips, error: tripError } = await supabase
      .from('trips')
      .select('pick_up_date, trip_rate, category, commission_amount, net_amount')
      .eq('driver_id', driver_id)
      .gte('pick_up_date', startDate)
      .lte('pick_up_date', endDate);

    if (tripError) {
      return res.status(400).json({ success: false, message: 'Error fetching trips', error: tripError.message });
    }

    // 3. Group trips by date and calculate daily salary
    const dailyEarnings = {};
    (trips || []).forEach(trip => {
      const date = trip.pick_up_date;
      if (!dailyEarnings[date]) {
        dailyEarnings[date] = {
          total_revenue: 0,
          ola_uber_revenue: 0,
          other_revenue: 0,
          categories: new Set()
        };
      }
      // Use net_amount if available, otherwise trip_rate
      const amount = trip.net_amount !== undefined && trip.net_amount !== null ? parseFloat(trip.net_amount) : parseFloat(trip.trip_rate);
      const val = amount || 0;
      dailyEarnings[date].total_revenue += val;

      const category = trip.category ? trip.category.toLowerCase() : '';
      if (category === 'ola' || category === 'uber') {
        dailyEarnings[date].ola_uber_revenue += val;
      } else {
        dailyEarnings[date].other_revenue += val;
      }

      if (trip.category) {
        dailyEarnings[date].categories.add(category);
      }
    });

    let totalMonthlySalary = 0;
    let totalActualRevenue = 0;
    const breakdown = [];

    Object.keys(dailyEarnings).sort().forEach(date => {
      const dayData = dailyEarnings[date];
      const cats = Array.from(dayData.categories);
      
      let daySalary = 0;
      let type = '';
      let eligibleForIncentive = 0;

      if (dayData.other_revenue > 0 && dayData.total_revenue >= revenuePerDay) {
        // Standard rule: Base + 30% of excess over revenue_per_day
        eligibleForIncentive = Math.max(0, dayData.other_revenue - revenuePerDay);
        daySalary = BASE_SALARY_PER_DAY + (eligibleForIncentive * INCENTIVE_PERCENTAGE);
        
        // Add 30% of any Ola/Uber revenue on the same day
        if (dayData.ola_uber_revenue > 0) {
          daySalary += (dayData.ola_uber_revenue * OLA_UBER_PERCENTAGE);
          type = 'Mixed (Base + 30% Incentive + 30% Ola/Uber)';
        } else {
          type = 'Standard (Base + 30% Incentive)';
        }
      } else {
        // Target not met or only Ola/Uber
        daySalary = dayData.ola_uber_revenue * OLA_UBER_PERCENTAGE;
        type = (dayData.other_revenue > 0 && dayData.total_revenue < revenuePerDay) ? 'Target Not Met (0 Salary)' : 'Ola/Uber Only (30%)';
      }

      totalMonthlySalary += daySalary;
      totalActualRevenue += dayData.total_revenue;

      breakdown.push({
        date,
        target_revenue: revenuePerDay,
        actual_revenue: Math.round(dayData.total_revenue * 100) / 100,
        other_revenue: Math.round(dayData.other_revenue * 100) / 100,
        ola_uber_revenue: Math.round(dayData.ola_uber_revenue * 100) / 100,
        base_salary: dayData.other_revenue > 0 ? BASE_SALARY_PER_DAY : 0,
        eligible_for_30_percent: Math.round(eligibleForIncentive * 100) / 100,
        per_day_salary_attained: Math.round(daySalary * 100) / 100,
        categories: cats,
        type
      });
    });

    // 4. Get Unpaid Advances
    const { data: advances } = await supabase
      .from('advances')
      .select('id, amount, date, description')
      .eq('driver_id', driver_id)
      .eq('status', 'unpaid');

    const totalAdvances = (advances || []).reduce((sum, a) => sum + parseFloat(a.amount), 0);

    // 5. Final Salary
    const finalSalary = totalMonthlySalary - totalAdvances;

    return res.status(200).json({
      success: true,
      data: {
        driver_name: driver.name,
        month: targetMonth,
        year: targetYear,
        desired_salary: driver.desired_salary || 0,
        total_working_days: Object.keys(dailyEarnings).length,
        total_revenue: Math.round(totalActualRevenue),
        calculated_salary: Math.round(totalMonthlySalary),
        advances_deducted: Math.round(totalAdvances),
        final_payable: Math.round(finalSalary),
        breakdown: breakdown,
        advances_list: advances || []
      }
    });

  } catch (error) {
    console.error('Error calculating salary:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Settle Salary
const settleSalary = async (req, res) => {
  try {
    const { driver_id, month, year, payment_method } = req.body;

    if (!driver_id || !month || !year || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'driver_id, month, year, and payment_method are required'
      });
    }

    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);

    // Check if already settled
    const { data: existingSettlement } = await supabase
      .from('salary_history')
      .select('id')
      .eq('driver_id', driver_id)
      .eq('month', targetMonth)
      .eq('year', targetYear)
      .single();

    if (existingSettlement) {
      return res.status(400).json({
        success: false,
        message: 'Salary for this month and year is already settled'
      });
    }

    const { data: driver } = await supabase.from('users').select('revenue_per_day').eq('id', driver_id).single();
    const revenuePerDay = parseFloat(driver.revenue_per_day) || 0;

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: trips } = await supabase
      .from('trips')
      .select('pick_up_date, trip_rate, category, net_amount')
      .eq('driver_id', driver_id)
      .gte('pick_up_date', startDate)
      .lte('pick_up_date', endDate);

    const dailyEarnings = {};
    (trips || []).forEach(trip => {
      const date = trip.pick_up_date;
      if (!dailyEarnings[date]) {
        dailyEarnings[date] = { total_revenue: 0, ola_uber_revenue: 0, other_revenue: 0, categories: new Set() };
      }
      const amount = trip.net_amount !== undefined && trip.net_amount !== null ? parseFloat(trip.net_amount) : parseFloat(trip.trip_rate);
      const val = amount || 0;
      dailyEarnings[date].total_revenue += val;

      const category = trip.category ? trip.category.toLowerCase() : '';
      if (category === 'ola' || category === 'uber') {
        dailyEarnings[date].ola_uber_revenue += val;
      } else {
        dailyEarnings[date].other_revenue += val;
      }
      if (trip.category) dailyEarnings[date].categories.add(category);
    });

    let totalMonthlySalary = 0;
    let totalActualRevenue = 0;
    let cashCollected = 0;

    Object.values(dailyEarnings).forEach(dayData => {
      let daySalary = 0;
      if (dayData.other_revenue > 0 && dayData.total_revenue >= revenuePerDay) {
        const excess = Math.max(0, dayData.other_revenue - revenuePerDay);
        daySalary = BASE_SALARY_PER_DAY + (excess * INCENTIVE_PERCENTAGE);
        if (dayData.ola_uber_revenue > 0) {
          daySalary += (dayData.ola_uber_revenue * OLA_UBER_PERCENTAGE);
        }
      } else {
        daySalary = dayData.ola_uber_revenue * OLA_UBER_PERCENTAGE;
      }
      totalMonthlySalary += daySalary;
      totalActualRevenue += dayData.total_revenue;
      cashCollected += dayData.ola_uber_revenue;
    });

    const { data: advances } = await supabase
      .from('advances')
      .select('id, amount')
      .eq('driver_id', driver_id)
      .eq('status', 'unpaid');

    const totalAdvances = (advances || []).reduce((sum, a) => sum + parseFloat(a.amount), 0);
    
    // Final settlement: Salary earned - Advances - Cash already in driver's hand
    const finalSalary = totalMonthlySalary - totalAdvances - cashCollected;

    // Start Settlement
    if (advances && advances.length > 0) {
      const advanceIds = advances.map(a => a.id);
      await supabase
        .from('advances')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .in('id', advanceIds);
    }

    const { data: history, error: historyError } = await supabase
      .from('salary_history')
      .insert({
        driver_id,
        month: targetMonth,
        year: targetYear,
        working_days: Object.keys(dailyEarnings).length,
        basic_pay: Math.round(totalMonthlySalary),
        target_revenue: Math.round(Object.keys(dailyEarnings).length * revenuePerDay),
        actual_revenue: Math.round(totalActualRevenue),
        cash_collected: Math.round(cashCollected),
        incentive: 0,
        advances_deducted: Math.round(totalAdvances),
        final_salary: Math.round(finalSalary),
        payment_method,
        status: 'paid'
      })
      .select();

    if (historyError) {
      return res.status(400).json({ success: false, message: 'Error creating settlement record', error: historyError.message });
    }

    return res.status(201).json({ success: true, message: 'Salary settled successfully', data: history[0] });

  } catch (error) {
    console.error('Error settling salary:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Set Desired Salary
const setDesiredSalary = async (req, res) => {
  try {
    const { desired_salary } = req.body;
    const driver_id = req.user.id;

    if (desired_salary === undefined) {
      return res.status(400).json({ success: false, message: 'desired_salary is required' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ desired_salary: parseFloat(desired_salary), updated_at: new Date().toISOString() })
      .eq('id', driver_id)
      .select();

    if (error) return res.status(400).json({ success: false, message: 'Error updating desired salary', error: error.message });

    return res.status(200).json({ success: true, message: 'Desired salary updated successfully', data: data[0] });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get Salary vs Desired
const getSalaryVsDesired = async (req, res) => {
  try {
    const { month, year } = req.query;
    const driver_id = req.user.id;
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    // 1. Get user desired salary
    const { data: user } = await supabase.from('users').select('desired_salary, revenue_per_day').eq('id', driver_id).single();
    const desired = user.desired_salary || 0;
    const revenuePerDay = user.revenue_per_day || 0;

    // 2. Calculate so far salary (recalculate logic)
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: trips } = await supabase
      .from('trips')
      .select('pick_up_date, trip_rate, category, net_amount')
      .eq('driver_id', driver_id)
      .gte('pick_up_date', startDate)
      .lte('pick_up_date', endDate);

    const dailyEarnings = {};
    (trips || []).forEach(trip => {
      const date = trip.pick_up_date;
      if (!dailyEarnings[date]) {
        dailyEarnings[date] = { total_revenue: 0, ola_uber_revenue: 0, other_revenue: 0, categories: new Set() };
      }
      const amount = trip.net_amount !== undefined && trip.net_amount !== null ? parseFloat(trip.net_amount) : parseFloat(trip.trip_rate);
      const val = amount || 0;
      dailyEarnings[date].total_revenue += val;

      const category = trip.category ? trip.category.toLowerCase() : '';
      if (category === 'ola' || category === 'uber') {
        dailyEarnings[date].ola_uber_revenue += val;
      } else {
        dailyEarnings[date].other_revenue += val;
      }
      if (trip.category) dailyEarnings[date].categories.add(category);
    });

    let soFarSalary = 0;
    Object.values(dailyEarnings).forEach(dayData => {
      if (dayData.other_revenue > 0 && dayData.total_revenue >= revenuePerDay) {
        const excess = Math.max(0, dayData.other_revenue - revenuePerDay);
        soFarSalary += (BASE_SALARY_PER_DAY + (excess * INCENTIVE_PERCENTAGE));
        if (dayData.ola_uber_revenue > 0) {
          soFarSalary += (dayData.ola_uber_revenue * OLA_UBER_PERCENTAGE);
        }
      } else {
        soFarSalary += (dayData.ola_uber_revenue * OLA_UBER_PERCENTAGE);
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        desired_salary: Math.round(desired),
        so_far_salary: Math.round(soFarSalary),
        remaining_to_goal: Math.max(0, Math.round(desired - soFarSalary)),
        achievement_percentage: desired > 0 ? Math.round((soFarSalary / desired) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get Daily Earnings History
const getDailyEarnings = async (req, res) => {
  try {
    const { date, start_date, end_date } = req.query;
    const driver_id = req.user.id;

    let query = supabase.from('trips').select('*').eq('driver_id', driver_id);

    if (date) {
      query = query.eq('pick_up_date', date);
    } else if (start_date && end_date) {
      query = query.gte('pick_up_date', start_date).lte('pick_up_date', end_date);
    } else {
      // Default to today
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('pick_up_date', today);
    }

    const { data: trips, error } = await query.order('pick_up_time', { ascending: false });

    if (error) return res.status(400).json({ success: false, message: 'Error fetching earnings', error: error.message });

    // Group by date to show daily totals
    const history = {};
    trips.forEach(trip => {
      const d = trip.pick_up_date;
      if (!history[d]) {
        history[d] = {
          date: d,
          total_net_revenue: 0,
          trip_count: 0,
          trips: []
        };
      }
      const amount = trip.net_amount !== undefined && trip.net_amount !== null ? parseFloat(trip.net_amount) : parseFloat(trip.trip_rate);
      history[d].total_net_revenue += amount;
      history[d].trip_count += 1;
      history[d].trips.push(trip);
    });

    return res.status(200).json({
      success: true,
      data: Object.values(history).sort((a, b) => b.date.localeCompare(a.date))
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get Salary History (Admin)
const getSalaryHistory = async (req, res) => {
  try {
    const { driver_id, month, year } = req.query;
    let query = supabase.from('salary_history').select('*, users(name)');
    if (driver_id) query = query.eq('driver_id', driver_id);
    if (month) query = query.eq('month', parseInt(month));
    if (year) query = query.eq('year', parseInt(year));
    const { data: history, error } = await query.order('settled_at', { ascending: false });
    if (error) return res.status(400).json({ success: false, message: 'Error fetching salary history', error: error.message });
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get My Salary History (Driver)
const getMySalaryHistory = async (req, res) => {
  try {
    const driver_id = req.user.id;
    const { month, year } = req.query;
    let query = supabase.from('salary_history').select('*').eq('driver_id', driver_id);
    if (month) query = query.eq('month', parseInt(month));
    if (year) query = query.eq('year', parseInt(year));
    const { data: history, error } = await query.order('settled_at', { ascending: false });
    if (error) return res.status(400).json({ success: false, message: 'Error fetching your salary history', error: error.message });
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get Detailed Payslip
const getPayslip = async (req, res) => {
  try {
    const { history_id } = req.params;
    const driver_id = req.user.id;
    const role = req.user.role;

    let query = supabase
      .from('salary_history')
      .select('*, users(name, employee_no, revenue_per_day, mobile_no)')
      .eq('id', history_id);

    // If not admin, can only see own payslip
    if (role !== 'admin') {
      query = query.eq('driver_id', driver_id);
    }

    const { data: history, error } = await query.single();

    if (error || !history) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        payslip_no: `PAY-${history.id.substring(0, 8).toUpperCase()}`,
        date: history.settled_at,
        driver_details: {
          name: history.users.name,
          employee_no: history.users.employee_no,
          mobile: history.users.mobile_no
        },
        period: {
          month: history.month,
          year: history.year,
          working_days: history.working_days
        },
        earnings: {
          calculated_total_salary: history.basic_pay,
          actual_revenue_generated: history.actual_revenue,
          target_revenue: history.target_revenue
        },
        deductions: {
          advances_settled: history.advances_deducted,
          cash_already_collected: history.cash_collected || 0
        },
        final_payment: {
          amount_paid: history.final_salary,
          method: history.payment_method,
          status: history.status
        }
      }
    });
  } catch (error) {
    console.error('Error fetching payslip:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  calculateSalary,
  settleSalary,
  getSalaryHistory,
  getMySalaryHistory,
  setDesiredSalary,
  getSalaryVsDesired,
  getDailyEarnings,
  getPayslip
};


