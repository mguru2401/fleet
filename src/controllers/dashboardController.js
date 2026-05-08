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
        ola_uber_revenue: 0,
        other_revenue: 0
      };
    }
    
    const amount = (trip.net_amount !== undefined && trip.net_amount !== null) 
      ? parseFloat(trip.net_amount) 
      : parseFloat(trip.trip_rate);
    const val = amount || 0;
    
    dailyEarnings[date].total_revenue += val;

    const category = trip.category ? trip.category.toLowerCase() : '';
    if (category === 'ola' || category === 'uber') {
      dailyEarnings[date].ola_uber_revenue += val;
    } else {
      dailyEarnings[date].other_revenue += val;
    }
  });

  let totalSalary = 0;
  let totalRevenue = 0;
  let totalIncentive = 0;
  let totalBase = 0;
  let totalOlaUberSalary = 0;

  Object.values(dailyEarnings).forEach(dayData => {
    let daySalary = 0;
    let dayBase = 0;
    let dayIncentive = 0;
    let dayOlaUber = 0;

    if (dayData.other_revenue > 0 && dayData.total_revenue >= revenuePerDay) {
      dayBase = BASE_SALARY_PER_DAY;
      // Incentive is only on the "Other" revenue part that exceeds the target
      const eligibleForIncentive = Math.max(0, dayData.other_revenue - revenuePerDay);
      dayIncentive = eligibleForIncentive * INCENTIVE_PERCENTAGE;
      dayOlaUber = dayData.ola_uber_revenue * OLA_UBER_PERCENTAGE;
      daySalary = dayBase + dayIncentive + dayOlaUber;
    } else if (dayData.other_revenue > 0 && dayData.total_revenue < revenuePerDay) {
      // Target not met even with total revenue, and has other trips
      dayBase = 0;
      dayIncentive = 0;
      dayOlaUber = dayData.ola_uber_revenue * OLA_UBER_PERCENTAGE;
      daySalary = dayOlaUber;
    } else {
      // Ola/Uber only day
      dayBase = 0;
      dayIncentive = 0;
      dayOlaUber = dayData.ola_uber_revenue * OLA_UBER_PERCENTAGE;
      daySalary = dayOlaUber;
    }

    totalSalary += daySalary;
    totalRevenue += dayData.total_revenue;
    totalIncentive += dayIncentive;
    totalBase += dayBase;
    totalOlaUberSalary += dayOlaUber;
  });

  return {
    totalSalary,
    totalRevenue,
    totalBase,
    totalIncentive,
    totalOlaUberSalary
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
        
        today_salary: Math.round(todayStats.totalSalary),
        today_revenue: Math.round(todayStats.totalRevenue),
        target_revenue_per_day: Math.round(revenuePerDay),
        revenue_vs_target_diff: Math.round(todayStats.totalRevenue - revenuePerDay),
        
        salary_details: {
          base_salary: Math.round(todayStats.totalBase),
          incentive_salary: Math.round(todayStats.totalIncentive),
          ola_uber_salary: Math.round(todayStats.totalOlaUberSalary),
          total_today_salary: Math.round(todayStats.totalSalary)
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
        
        today_salary: Math.round(todayStats.totalSalary),
        today_revenue: Math.round(todayStats.totalRevenue),
        target_revenue_per_day: Math.round(revenuePerDay),
        
        salary_details: {
          base_salary: Math.round(todayStats.totalBase),
          incentive_salary: Math.round(todayStats.totalIncentive),
          ola_uber_salary: Math.round(todayStats.totalOlaUberSalary),
          total_today_salary: Math.round(todayStats.totalSalary)
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

    // 4. Get relevant advances (Unpaid OR linked to this month's settlements)
    let advancesQuery = supabase.from('advances').select('*');
    if (settlementIds.length > 0) {
      advancesQuery = advancesQuery.or(`status.eq.unpaid,settlement_id.in.(${settlementIds.map(id => `"${id}"`).join(',')})`);
    } else {
      advancesQuery = advancesQuery.eq('status', 'unpaid');
    }

    const { data: allAdvances, error: advancesError } = await advancesQuery;

    // 5. Process data for each driver
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
      
      const cashCollected = driverHistory
        ? parseFloat(driverHistory.cash_collected)
        : driverTrips
          .filter(t => t.category && (t.category.toLowerCase() === 'ola' || t.category.toLowerCase() === 'uber'))
          .reduce((sum, t) => {
            const amount = (t.net_amount !== undefined && t.net_amount !== null) ? parseFloat(t.net_amount) : parseFloat(t.trip_rate);
            return sum + (amount || 0);
          }, 0);

      const finalPayable = driverHistory
        ? parseFloat(driverHistory.final_salary)
        : stats.totalSalary - totalAdvances - cashCollected;

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
        total_salary_earned: Math.round(totalSalaryEarned),
        total_advances: Math.round(totalAdvances),
        cash_revenue_collected: Math.round(cashCollected),
        amount_remaining_in_hand: Math.round(cashCollected),
        final_company_payable: Math.round(finalPayable),
        breakdown: {
          base_pay: Math.round(stats.totalBase),
          incentives: Math.round(stats.totalIncentive),
          ola_uber_commission: Math.round(stats.totalOlaUberSalary)
        },
        advances_list: driverAdvances || []
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
      .eq('status', 'unpaid');

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
    
    const cashCollected = history
      ? parseFloat(history.cash_collected)
      : (trips || [])
        .filter(t => t.category && (t.category.toLowerCase() === 'ola' || t.category.toLowerCase() === 'uber'))
        .reduce((sum, t) => {
          const amount = (t.net_amount !== undefined && t.net_amount !== null) ? parseFloat(t.net_amount) : parseFloat(t.trip_rate);
          return sum + (amount || 0);
        }, 0);

    const finalPayable = history
      ? parseFloat(history.final_salary)
      : stats.totalSalary - totalAdvances - cashCollected;

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
        total_salary_earned: Math.round(totalSalaryEarned),
        total_advances: Math.round(totalAdvances),
        cash_revenue_collected: Math.round(cashCollected),
        final_company_payable: Math.round(finalPayable),
        breakdown: {
          base_pay: Math.round(stats.totalBase),
          incentives: Math.round(stats.totalIncentive),
          ola_uber_commission: Math.round(stats.totalOlaUberSalary)
        },
        advances_list: advances || []
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
