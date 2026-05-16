const supabase = require('../config/supabase');

// Constants (sync with salaryController.js)
const BASE_SALARY_PER_DAY = 1136.36;
const INCENTIVE_PERCENTAGE = 0.30;
const OLA_UBER_PERCENTAGE = 0.30;

/**
 * Helper to calculate salary and revenue details for a set of trips
 */
const calculateDetailedStats = (trips, revenuePerDay) => {
  const dailyEarnings = {};
  
  (trips || []).forEach(trip => {
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
  let workingDaysCount = 0;

  Object.values(dailyEarnings).forEach(dayData => {
    totalRevenue += dayData.total_revenue;
    if (dayData.working_day) {
      totalBase += BASE_SALARY_PER_DAY;
      totalTargetedRevenue += revenuePerDay;
      workingDaysCount++;
    } else {
      // Non-working day: Target is 0
      totalTargetedRevenue += 0;
    }
  });

  // Incentive till today = 30% * max(0, Actual Revenue - Targeted Revenue)
  const eligibleIncentiveAmount = Math.max(0, totalRevenue - totalTargetedRevenue);
  const totalIncentive = eligibleIncentiveAmount * INCENTIVE_PERCENTAGE;
  
  // Total Salary = Total Base + Total Incentive
  const totalSalary = totalBase + totalIncentive;

  return {
    totalSalary,
    totalRevenue,
    totalBase,
    totalIncentive,
    eligibleIncentiveAmount,
    totalTargetedRevenue,
    workingDaysCount
  };
};

// ============================================
// DASHBOARD ENDPOINTS
// ============================================

// Get Driver Dashboard
const getDriverDashboard = async (req, res) => {
  try {
    const driver_id = req.user.id;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const targetMonth = now.getMonth() + 1;
    const targetYear = now.getFullYear();

    const { data: driver, error: driverError } = await supabase
      .from('users')
      .select('name, revenue_per_day, desired_salary')
      .eq('id', driver_id)
      .single();

    if (driverError || !driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const revenuePerDay = parseFloat(driver.revenue_per_day) || 0;
    const desiredSalary = parseFloat(driver.desired_salary) || 0;

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: monthTrips, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('driver_id', driver_id)
      .gte('pick_up_date', startDate)
      .lte('pick_up_date', endDate);

    if (tripError) {
      return res.status(400).json({ success: false, message: 'Error fetching trips', error: tripError.message });
    }

    const monthStats = calculateDetailedStats(monthTrips, revenuePerDay);
    const todayTrips = monthTrips.filter(t => t.pick_up_date === todayStr);
    const todayStats = calculateDetailedStats(todayTrips, revenuePerDay);

    return res.status(200).json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        desired_salary: Math.round(desiredSalary),
        so_far_salary: Math.round(monthStats.totalSalary),
        remaining_to_goal: Math.max(0, Math.round(desiredSalary - monthStats.totalSalary)),
        achievement_percentage: desiredSalary > 0 ? Math.round((monthStats.totalSalary / desiredSalary) * 100) : 0,
        
        actual_revenue_mtd: Math.round(monthStats.totalRevenue),
        targeted_revenue_mtd: Math.round(monthStats.totalTargetedRevenue),
        eligible_incentive_amount_mtd: Math.round(monthStats.eligibleIncentiveAmount),
        incentive_mtd: Math.round(monthStats.totalIncentive),
        cumulative_base_salary_mtd: Math.round(monthStats.totalBase),
        total_working_days_mtd: monthStats.workingDaysCount,
        revenue_target_per_day: Math.round(revenuePerDay),

        today_salary: Math.round(todayStats.totalSalary),
        today_revenue: Math.round(todayStats.totalRevenue),
        today_target: Math.round(todayStats.totalTargetedRevenue),
        
        salary_details: {
          base_salary: Math.round(monthStats.totalBase),
          eligible_amount: Math.round(monthStats.eligibleIncentiveAmount),
          incentive_salary: Math.round(monthStats.totalIncentive),
          total_earned_salary: Math.round(monthStats.totalSalary)
        },
        
        today_trips: todayTrips
      }
    });

  } catch (error) {
    console.error('Error getting driver dashboard:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get Admin Dashboard
const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const targetMonth = now.getMonth() + 1;
    const targetYear = now.getFullYear();

    const { data: drivers, error: driversError } = await supabase
      .from('users')
      .select('id, name, role, revenue_per_day, desired_salary')
      .neq('role', 'admin');

    if (driversError) {
      console.error('Admin Dashboard - Drivers Error:', driversError);
      return res.status(400).json({ success: false, message: 'Error fetching drivers', error: driversError.message });
    }

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: allTrips, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .gte('pick_up_date', startDate)
      .lte('pick_up_date', endDate);

    if (tripsError) {
      console.error('Admin Dashboard - Trips Error:', tripsError);
      return res.status(400).json({ success: false, message: 'Error fetching trips', error: tripsError.message });
    }

    const dashboardData = drivers.map(driver => {
      const driverTrips = allTrips.filter(t => t.driver_id === driver.id);
      const revenuePerDay = parseFloat(driver.revenue_per_day) || 0;
      const desiredSalary = parseFloat(driver.desired_salary) || 0;

      const monthStats = calculateDetailedStats(driverTrips, revenuePerDay);
      const todayTrips = driverTrips.filter(t => t.pick_up_date === todayStr);
      const todayStats = calculateDetailedStats(todayTrips, revenuePerDay);

      return {
        id: driver.id,
        name: driver.name,
        month: targetMonth,
        year: targetYear,
        desired_salary: Math.round(desiredSalary),
        so_far_salary: Math.round(monthStats.totalSalary),
        remaining_to_goal: Math.max(0, Math.round(desiredSalary - monthStats.totalSalary)),
        achievement_percentage: desiredSalary > 0 ? Math.round((monthStats.totalSalary / desiredSalary) * 100) : 0,
        
        actual_revenue_mtd: Math.round(monthStats.totalRevenue),
        targeted_revenue_mtd: Math.round(monthStats.totalTargetedRevenue),
        eligible_incentive_amount_mtd: Math.round(monthStats.eligibleIncentiveAmount),
        incentive_mtd: Math.round(monthStats.totalIncentive),
        cumulative_base_salary_mtd: Math.round(monthStats.totalBase),
        total_working_days_mtd: monthStats.workingDaysCount,
        revenue_target_per_day: Math.round(revenuePerDay),

        today_salary: Math.round(todayStats.totalSalary),
        today_revenue: Math.round(todayStats.totalRevenue),
        
        salary_details: {
          base_salary: Math.round(monthStats.totalBase),
          eligible_amount: Math.round(monthStats.eligibleIncentiveAmount),
          incentive_salary: Math.round(monthStats.totalIncentive),
          total_earned_salary: Math.round(monthStats.totalSalary)
        },
        
        today_trips_count: todayTrips.length,
        today_trips: todayTrips
      };
    });

    return res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error getting admin dashboard:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get Admin Salary Dashboard (Detailed breakdown for settlement)
const getAdminSalaryDashboard = async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    // 1. Get All Drivers
    const { data: drivers, error: driversError } = await supabase
      .from('users')
      .select('id, name, role, revenue_per_day, desired_salary')
      .neq('role', 'admin');

    if (driversError) {
      return res.status(400).json({ success: false, message: 'Error fetching drivers' });
    }

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // 2. Get all trips for the month
    const { data: allTrips, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .gte('pick_up_date', startDate)
      .lte('pick_up_date', endDate);

    if (tripsError) {
      return res.status(400).json({ success: false, message: 'Error fetching trips' });
    }

    // 3. Get all salary history for the month (to check paid/pending status)
    const { data: monthHistory } = await supabase
      .from('salary_history')
      .select('id, driver_id, status, payment_method, advances_deducted, cash_collected, final_salary, basic_pay')
      .eq('month', targetMonth)
      .eq('year', targetYear);

    const settlementIds = (monthHistory || []).map(h => h.id).filter(id => id);

    // 4. Get relevant advances (Unpaid and dated within/before this month OR linked to this month's settlements)
    let advancesQuery = supabase.from('advances').select('*');
    
    // Condition for unpaid: must be on or before the end of the target month
    const unpaidCondition = `and(status.eq.unpaid,date.gte.${startDate},date.lte.${endDate})`;
    
    if (settlementIds.length > 0) {
      advancesQuery = advancesQuery.or(`${unpaidCondition},settlement_id.in.(${settlementIds.map(id => `"${id}"`).join(',')})`);
    } else {
      advancesQuery = advancesQuery.filter('status', 'eq', 'unpaid').gte('date', startDate).lte('date', endDate);
    }

    const { data: allAdvances, error: advancesError } = await advancesQuery;

    // 5. Get all expenses for these drivers in this month
    const driverIds = drivers.map(d => d.id);
    const { data: allExpenses } = await supabase
      .from('expenses')
      .select('*')
      .in('driver_id', driverIds)
      .gte('date', startDate)
      .lte('date', endDate);

    // 6. Process data for each driver
    const salaryDashboard = drivers.map(driver => {
      const driverTrips = allTrips.filter(t => t.driver_id === driver.id);
      const driverHistory = (monthHistory || []).find(h => h.driver_id === driver.id);
      
      // Filter for unpaid advances OR advances linked specifically to this driver's history record for this month
      const driverAdvances = (allAdvances || []).filter(a => 
        a.driver_id === driver.id && 
        (a.status === 'unpaid' || (driverHistory && a.settlement_id === driverHistory.id))
      );
      
      const revenuePerDay = parseFloat(driver.revenue_per_day) || 0;
      const stats = calculateDetailedStats(driverTrips, revenuePerDay);
      
      const totalAdvances = driverHistory 
        ? parseFloat(driverHistory.advances_deducted) 
        : driverAdvances.reduce((sum, a) => sum + parseFloat(a.amount), 0);
      
      const olaUberTrips = driverTrips.filter(t => t.category && (t.category.toLowerCase() === 'ola' || t.category.toLowerCase() === 'uber'));

      const cashCollected = driverHistory
        ? parseFloat(driverHistory.cash_collected)
        : olaUberTrips.reduce((sum, t) => {
            const amount = (t.net_amount !== undefined && t.net_amount !== null) ? parseFloat(t.net_amount) : parseFloat(t.trip_rate);
            return sum + (amount || 0);
          }, 0);

      const driverExpenses = (allExpenses || []).filter(e => e.driver_id === driver.id);

      const totalExpenses = (driverExpenses || []).reduce((sum, e) => sum + parseFloat(e.amount), 0);

      const finalPayable = driverHistory
        ? parseFloat(driverHistory.final_salary)
        : stats.totalSalary - (cashCollected - totalExpenses) - totalAdvances;

      const totalSalaryEarned = driverHistory
        ? parseFloat(driverHistory.basic_pay)
        : stats.totalSalary;

      return {
        driver_id: driver.id,
        driver_name: driver.name,
        month: targetMonth,
        year: targetYear,
        status: driverHistory ? driverHistory.status : 'pending',
        payment_method: driverHistory ? driverHistory.payment_method : null,
        actual_revenue_mtd: Math.round(stats.totalRevenue),
        targeted_revenue_mtd: Math.round(stats.totalTargetedRevenue),
        eligible_incentive_amount_mtd: Math.round(stats.eligibleIncentiveAmount),
        incentive_mtd: Math.round(stats.totalIncentive),
        total_salary_earned: Math.round(stats.totalSalary),
        total_working_days_mtd: stats.workingDaysCount,
        total_advances: Math.round(totalAdvances),
        total_expenses: Math.round(totalExpenses),
        cash_revenue_collected: Math.round(cashCollected),
        net_cash_in_hand: Math.round(cashCollected - totalExpenses),
        final_company_payable: Math.round(finalPayable),
        breakdown: {
          base_pay: Math.round(stats.totalBase),
          eligible_amount: Math.round(stats.eligibleIncentiveAmount),
          incentives: Math.round(stats.totalIncentive)
        },
        advances_list: driverAdvances || [],
        expense_list: driverExpenses || [],
        ola_uber_trips_list: olaUberTrips || []
      };
    });

    return res.status(200).json({
      success: true,
      data: salaryDashboard
    });

  } catch (error) {
    console.error('Error getting admin salary dashboard:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get Driver Salary Dashboard (Preview for settlement)
const getDriverSalaryDashboard = async (req, res) => {
  try {
    const driver_id = req.user.id;
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const { data: driver } = await supabase.from('users').select('name, revenue_per_day').eq('id', driver_id).single();
    const revenuePerDay = parseFloat(driver.revenue_per_day) || 0;

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: trips } = await supabase
      .from('trips')
      .select('*')
      .eq('driver_id', driver_id)
      .gte('pick_up_date', startDate)
      .lte('pick_up_date', endDate);

    const { data: advances } = await supabase
      .from('advances')
      .select('*')
      .eq('driver_id', driver_id)
      .eq('status', 'unpaid')
      .gte('date', startDate)
      .lte('date', endDate);

    const { data: history } = await supabase
      .from('salary_history')
      .select('status, payment_method, advances_deducted, cash_collected, final_salary, basic_pay')
      .eq('driver_id', driver_id)
      .eq('month', targetMonth)
      .eq('year', targetYear)
      .single();

    const stats = calculateDetailedStats(trips, revenuePerDay);
    
    // If paid, use historical values. If pending, calculate live values.
    const totalAdvances = history 
      ? parseFloat(history.advances_deducted) 
      : (advances || []).reduce((sum, a) => sum + parseFloat(a.amount), 0);
    
    const olaUberTrips = (trips || []).filter(t => t.category && (t.category.toLowerCase() === 'ola' || t.category.toLowerCase() === 'uber'));

    const cashCollected = history
      ? parseFloat(history.cash_collected)
      : olaUberTrips.reduce((sum, t) => {
          const amount = (t.net_amount !== undefined && t.net_amount !== null) ? parseFloat(t.net_amount) : parseFloat(t.trip_rate);
          return sum + (amount || 0);
        }, 0);

    const { data: driverExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('driver_id', driver_id)
      .gte('date', startDate)
      .lte('date', endDate);

    const totalExpenses = (driverExpenses || []).reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const finalPayable = history
      ? parseFloat(history.final_salary)
      : stats.totalSalary - (cashCollected - totalExpenses) - totalAdvances;

    const totalSalaryEarned = history
      ? parseFloat(history.basic_pay)
      : stats.totalSalary;

    return res.status(200).json({
      success: true,
      data: {
        driver_id,
        driver_name: driver.name,
        month: targetMonth,
        year: targetYear,
        status: history ? history.status : 'pending',
        payment_method: history ? history.payment_method : null,
        actual_revenue_mtd: Math.round(stats.totalRevenue),
        targeted_revenue_mtd: Math.round(stats.totalTargetedRevenue),
        eligible_incentive_amount_mtd: Math.round(stats.eligibleIncentiveAmount),
        incentive_mtd: Math.round(stats.totalIncentive),
        total_salary_earned: Math.round(stats.totalSalary),
        total_working_days_mtd: stats.workingDaysCount,
        total_advances: Math.round(totalAdvances),
        total_expenses: Math.round(totalExpenses),
        cash_revenue_collected: Math.round(cashCollected),
        net_cash_in_hand: Math.round(cashCollected - totalExpenses),
        final_company_payable: Math.round(finalPayable),
        breakdown: {
          base_pay: Math.round(stats.totalBase),
          eligible_amount: Math.round(stats.eligibleIncentiveAmount),
          incentives: Math.round(stats.totalIncentive)
        },
        advances_list: advances || [],
        expense_list: driverExpenses || [],
        ola_uber_trips_list: olaUberTrips || []
      }
    });
  } catch (error) {
    console.error('Error getting driver salary dashboard:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getDriverDashboard,
  getAdminDashboard,
  getAdminSalaryDashboard,
  getDriverSalaryDashboard
};
