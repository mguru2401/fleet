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

    let totalActualRevenue = 0;
    let totalTargetedRevenue = 0;
    let totalBase = 0;
    let workingDaysCount = 0;
    const breakdown = [];

    Object.keys(dailyEarnings).sort().forEach(date => {
      const dayData = dailyEarnings[date];
      const cats = Array.from(dayData.categories);
      
      const isWorkingDay = dayData.other_revenue > 0;
      const dayTarget = isWorkingDay ? revenuePerDay : 0;
      const dayBase = isWorkingDay ? BASE_SALARY_PER_DAY : 0;

      totalActualRevenue += dayData.total_revenue;
      totalTargetedRevenue += dayTarget;
      totalBase += dayBase;
      if (isWorkingDay) workingDaysCount++;

      // Cumulative Incentive till this date
      const eligibleAmount = Math.max(0, totalActualRevenue - totalTargetedRevenue);
      const currentIncentive = eligibleAmount * INCENTIVE_PERCENTAGE;
      const currentSalary = totalBase + currentIncentive;

      breakdown.push({
        date,
        day_revenue: Math.round(dayData.total_revenue * 100) / 100,
        day_target: dayTarget,
        is_working_day: isWorkingDay,
        cumulative_actual_revenue: Math.round(totalActualRevenue * 100) / 100,
        cumulative_targeted_revenue: Math.round(totalTargetedRevenue * 100) / 100,
        cumulative_eligible_amount: Math.round(eligibleAmount * 100) / 100,
        cumulative_incentive: Math.round(currentIncentive * 100) / 100,
        cumulative_base_salary: Math.round(totalBase * 100) / 100,
        cumulative_salary_earned: Math.round(currentSalary * 100) / 100,
        categories: cats,
        type: isWorkingDay ? 'Working Day (Base + Incentive)' : 'Non-Working Day (Incentive Only)'
      });
    });

    const totalEligibleAmount = Math.max(0, totalActualRevenue - totalTargetedRevenue);
    const totalMonthlySalary = totalBase + (totalEligibleAmount * INCENTIVE_PERCENTAGE);

    // 4. Get Unpaid Advances
    const { data: advances } = await supabase
      .from('advances')
      .select('id, amount, date, description')
      .eq('driver_id', driver_id)
      .eq('status', 'unpaid')
      .gte('date', startDate)
      .lte('date', endDate);

    const totalAdvances = (advances || []).reduce((sum, a) => sum + parseFloat(a.amount), 0);

    // 5. Get Expenses
    const { data: driverExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('driver_id', driver_id)
      .gte('date', startDate)
      .lte('date', endDate);

    const totalExpenses = (driverExpenses || []).reduce((sum, e) => sum + parseFloat(e.amount), 0);

    // 6. Final Salary
    const olaUberTrips = (trips || [])
      .filter(t => t.category && (t.category.toLowerCase() === 'ola' || t.category.toLowerCase() === 'uber'));

    const cashCollected = olaUberTrips
      .reduce((sum, t) => {
        const amount = t.net_amount !== undefined && t.net_amount !== null ? parseFloat(t.net_amount) : parseFloat(t.trip_rate);
        return sum + (amount || 0);
      }, 0);

    const netCashInHand = cashCollected - totalExpenses;
    const finalSalary = totalMonthlySalary - netCashInHand - totalAdvances;

    return res.status(200).json({
      success: true,
      data: {
        driver_name: driver.name,
        month: targetMonth,
        year: targetYear,
        desired_salary: driver.desired_salary || 0,
        revenue_target_per_day: Math.round(revenuePerDay),
        total_days: Object.keys(dailyEarnings).length,
        total_working_days: workingDaysCount,
        total_actual_revenue: Math.round(totalActualRevenue),
        total_targeted_revenue: Math.round(totalTargetedRevenue),
        eligible_incentive_amount: Math.round(totalEligibleAmount),
        total_incentive: Math.round(totalEligibleAmount * INCENTIVE_PERCENTAGE),
        cumulative_base_salary: Math.round(totalBase),
        calculated_salary: Math.round(totalMonthlySalary),
        total_expenses: Math.round(totalExpenses),
        cash_collected: Math.round(cashCollected),
        net_cash_in_hand: Math.round(netCashInHand),
        advances_deducted: Math.round(totalAdvances),
        final_payable: Math.round(finalSalary),
        breakdown: breakdown,
        advances_list: advances || [],
        expense_list: driverExpenses || [],
        ola_uber_trips_list: olaUberTrips || []
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
    const paymentMethod = payment_method;

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

    let totalActualRevenue = 0;
    let totalTargetedRevenue = 0;
    let totalBase = 0;
    let cashCollected = 0;

    Object.values(dailyEarnings).forEach(dayData => {
      totalActualRevenue += dayData.total_revenue;
      cashCollected += dayData.ola_uber_revenue;

      if (dayData.other_revenue > 0) {
        totalBase += BASE_SALARY_PER_DAY;
        totalTargetedRevenue += revenuePerDay;
      }
    });

    const totalEligibleAmount = Math.max(0, totalActualRevenue - totalTargetedRevenue);
    const totalIncentive = totalEligibleAmount * INCENTIVE_PERCENTAGE;
    const totalMonthlySalary = totalBase + totalIncentive;

    const { data: advances } = await supabase
      .from('advances')
      .select('id, amount')
      .eq('driver_id', driver_id)
      .eq('status', 'unpaid')
      .gte('date', startDate)
      .lte('date', endDate);

    const totalAdvances = (advances || []).reduce((sum, a) => sum + parseFloat(a.amount), 0);
    
    const { data: driverExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('driver_id', driver_id)
      .gte('date', startDate)
      .lte('date', endDate);

    const totalExpenses = (driverExpenses || []).reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const netCashInHand = cashCollected - totalExpenses;
    
    // Final settlement: Salary earned - Net Cash In Hand - Advances
    const finalSalary = totalMonthlySalary - totalAdvances - netCashInHand;

    const { data: history, error: historyError } = await supabase
      .from('salary_history')
      .insert({
        driver_id,
        month: targetMonth,
        year: targetYear,
        working_days: Object.keys(dailyEarnings).length,
        basic_pay: Math.round(totalMonthlySalary),
        target_revenue: Math.round(totalTargetedRevenue),
        actual_revenue: Math.round(totalActualRevenue),
        cash_collected: Math.round(cashCollected),
        incentive: Math.round(totalIncentive),
        advances_deducted: Math.round(totalAdvances),
        final_salary: Math.round(finalSalary),
        payment_method,
        status: 'paid'
      })
      .select();

    if (historyError) {
      return res.status(400).json({ success: false, message: 'Error creating settlement record', error: historyError.message });
    }

    const newHistoryId = history[0].id;

    // Start Settlement - Link advances to this specific history record
    if (advances && advances.length > 0) {
      const advanceIds = advances.map(a => a.id);
      await supabase
        .from('advances')
        .update({ 
          status: 'paid', 
          settlement_id: newHistoryId, // Link it!
          updated_at: new Date().toISOString() 
        })
        .in('id', advanceIds);
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

    let totalActualRevenue = 0;
    let totalTargetedRevenue = 0;
    let totalBase = 0;

    Object.values(dailyEarnings).forEach(dayData => {
      totalActualRevenue += dayData.total_revenue;
      if (dayData.other_revenue > 0) {
        totalBase += BASE_SALARY_PER_DAY;
        totalTargetedRevenue += revenuePerDay;
      }
    });

    const totalEligibleAmount = Math.max(0, totalActualRevenue - totalTargetedRevenue);
    const totalIncentive = totalEligibleAmount * INCENTIVE_PERCENTAGE;
    const soFarSalary = totalBase + totalIncentive;

    return res.status(200).json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        desired_salary: Math.round(desired),
        revenue_target_per_day: Math.round(revenuePerDay),
        actual_revenue_mtd: Math.round(totalActualRevenue),
        targeted_revenue_mtd: Math.round(totalTargetedRevenue),
        eligible_incentive_amount_mtd: Math.round(totalEligibleAmount),
        incentive_mtd: Math.round(totalIncentive),
        cumulative_base_salary_mtd: Math.round(totalBase),
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
    let query = supabase.from('salary_history').select(`
      *,
      users:driver_id (
        id, 
        name, 
        email, 
        employee_no, 
        mobile_no, 
        revenue_per_day,
        car:car_id (
          name,
          car_no
        )
      )
    `);
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

// Get Comprehensive Salary Dashboard History (Driver)
const getDetailedDashboardHistory = async (req, res) => {
  try {
    const driver_id = req.user.id;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 1. Get Driver Details
    const { data: driver } = await supabase
      .from('users')
      .select('name, revenue_per_day, desired_salary')
      .eq('id', driver_id)
      .single();

    const revenuePerDay = parseFloat(driver.revenue_per_day) || 0;
    const desiredSalary = parseFloat(driver.desired_salary) || 0;

    // 2. Get Current Month's Data (Live Calculation)
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: trips } = await supabase
      .from('trips')
      .select('pick_up_date, trip_rate, category, net_amount')
      .eq('driver_id', driver_id)
      .gte('pick_up_date', startDate)
      .lte('pick_up_date', endDate);

    const { data: unpaidAdvances } = await supabase
      .from('advances')
      .select('*')
      .eq('driver_id', driver_id)
      .eq('status', 'unpaid');

    const dailyEarnings = {};
    (trips || []).forEach(trip => {
      const date = trip.pick_up_date;
      if (!dailyEarnings[date]) {
        dailyEarnings[date] = { total_revenue: 0, ola_uber_revenue: 0, other_revenue: 0 };
      }
      const amount = (trip.net_amount !== undefined && trip.net_amount !== null) ? parseFloat(trip.net_amount) : parseFloat(trip.trip_rate);
      const val = amount || 0;
      dailyEarnings[date].total_revenue += val;

      const category = trip.category ? trip.category.toLowerCase() : '';
      if (category === 'ola' || category === 'uber') {
        dailyEarnings[date].ola_uber_revenue += val;
      } else {
        dailyEarnings[date].other_revenue += val;
      }
    });

    let currentMonthRevenue = 0;
    let currentMonthTargetedRevenue = 0;
    let currentMonthBase = 0;
    let currentMonthCashCollected = 0;

    Object.values(dailyEarnings).forEach(dayData => {
      currentMonthRevenue += dayData.total_revenue;
      currentMonthCashCollected += dayData.ola_uber_revenue;

      if (dayData.other_revenue > 0) {
        currentMonthBase += BASE_SALARY_PER_DAY;
        currentMonthTargetedRevenue += revenuePerDay;
      }
    });

    const currentMonthEligibleAmount = Math.max(0, currentMonthRevenue - currentMonthTargetedRevenue);
    const currentMonthIncentive = currentMonthEligibleAmount * INCENTIVE_PERCENTAGE;
    const currentMonthSalary = currentMonthBase + currentMonthIncentive;

    // Fetch expenses for the current month
    const { data: currentMonthExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('driver_id', driver_id)
      .gte('date', currentMonthStartDate)
      .lte('date', currentMonthEndDate);

    const currentMonthTotalExpenses = (currentMonthExpenses || []).reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const currentMonthNetCashInHand = currentMonthCashCollected - currentMonthTotalExpenses;

    const totalUnpaidAdvances = (unpaidAdvances || []).reduce((sum, a) => sum + parseFloat(a.amount), 0);
    const currentMonthFinalPayable = currentMonthSalary - currentMonthNetCashInHand - totalUnpaidAdvances;

    // 3. Get Past Salary History (Settled)
    const { data: settledHistory } = await supabase
      .from('salary_history')
      .select('*')
      .eq('driver_id', driver_id)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    // 4. Calculate settlement totals for current month
    const currentMonthSettlements = (settledHistory || []).filter(h => h.month === currentMonth && h.year === currentYear);
    const totalAlreadyPaid = currentMonthSettlements.reduce((sum, h) => sum + parseFloat(h.final_salary), 0);
    const isSettled = currentMonthSettlements.length > 0;

    // Remaining balance is what was calculated live minus what was already paid
    const remainingBalance = currentMonthFinalPayable - totalAlreadyPaid;

    // Determine status
    let displayStatus = 'pending';
    if (isSettled) {
      displayStatus = remainingBalance <= 10 ? 'paid' : 'partially_paid'; // 10 is a small rounding buffer
    }

    // Filter out current month from history to prevent replication
    const filteredHistory = (settledHistory || []).filter(h => !(h.month === currentMonth && h.year === currentYear));

    return res.status(200).json({
      success: true,
      data: {
        driver_details: {
          name: driver.name,
          revenue_target: revenuePerDay,
          goal_salary: desiredSalary
        },
        current_month: {
          month: currentMonth,
          year: currentYear,
          status: displayStatus,
          summary: {
            total_actual_revenue: Math.round(currentMonthRevenue),
            total_targeted_revenue: Math.round(currentMonthTargetedRevenue),
            eligible_incentive_amount: Math.round(currentMonthEligibleAmount),
            total_incentive: Math.round(currentMonthIncentive),
            total_base_salary: Math.round(currentMonthBase),
            total_salary_earned: Math.round(currentMonthSalary),
            total_expenses: Math.round(currentMonthTotalExpenses),
            cash_collected: Math.round(currentMonthCashCollected),
            net_cash_in_hand: Math.round(currentMonthNetCashInHand),
            advances_deducted: Math.round(totalUnpaidAdvances),
            already_paid: Math.round(totalAlreadyPaid),
            remaining_balance: Math.max(0, Math.round(remainingBalance))
          },
          expense_list: currentMonthExpenses || [],
          ola_uber_trips_list: currentMonthTrips.filter(t => t.category && (t.category.toLowerCase() === 'ola' || t.category.toLowerCase() === 'uber')),
          goal_progress: {
            desired_salary: Math.round(desiredSalary),
            so_far_salary: Math.round(currentMonthSalary),
            achievement_percentage: desiredSalary > 0 ? Math.round((currentMonthSalary / desiredSalary) * 100) : 0
          },
          unpaid_advances: (unpaidAdvances || []),
          settlements_this_month: currentMonthSettlements.map(s => ({
            id: s.id,
            amount: s.final_salary,
            date: s.settled_at,
            method: s.payment_method
          }))
        },
        settled_history: (filteredHistory || []).map(h => ({
          id: h.id,
          month: h.month,
          year: h.year,
          settled_at: h.settled_at,
          total_revenue: Math.round(h.actual_revenue),
          salary_earned: Math.round(h.basic_pay),
          advances_deducted: Math.round(h.advances_deducted),
          cash_collected: Math.round(h.cash_collected || 0),
          final_paid: Math.round(h.final_salary),
          payment_method: h.payment_method,
          status: h.status
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard history:', error);
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
  getPayslip,
  getDetailedDashboardHistory
};


