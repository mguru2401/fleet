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

    if (dayData.other_revenue >= revenuePerDay) {
      dayBase = BASE_SALARY_PER_DAY;
      const eligibleForIncentive = dayData.other_revenue - revenuePerDay;
      dayIncentive = eligibleForIncentive * INCENTIVE_PERCENTAGE;
      daySalary = dayBase + dayIncentive;
      
      if (dayData.ola_uber_revenue > 0) {
        dayOlaUber = dayData.ola_uber_revenue * OLA_UBER_PERCENTAGE;
        daySalary += dayOlaUber;
      }
    } else {
      // If revenue per day target not met for "Other" trips, no base salary or incentive
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

module.exports = {
  getDriverDashboard,
  getAdminDashboard
};
