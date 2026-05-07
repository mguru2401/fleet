const supabase = require('../config/supabase');

// ============================================
// TRIPS CRUD ENDPOINTS
// ============================================

// Create Trip
const createTrip = async (req, res) => {
  try {
    const { pick_up_date, pick_up_time, start_km, end_km, drop_location, mileage, trip_rate, category, commission_amount } = req.body;
    
    // Get user from token (attached by auth middleware)
    const userId = req.user.id;
    const userName = req.user.name;

    // Validate required fields
    if (!pick_up_date || !pick_up_time || !start_km || !end_km || !drop_location || !mileage || !trip_rate || !category) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required (pick_up_date, pick_up_time, start_km, end_km, drop_location, mileage, trip_rate, category)'
      });
    }

    const commAmt = parseFloat(commission_amount) || 0;
    const tripRate = parseFloat(trip_rate);
    const netAmount = tripRate - commAmt;

    const { driver_id: providedDriverId, car_id: providedCarId, category_id } = req.body;
    const targetDriverId = providedDriverId || userId;
    let resolvedCarNo = 'N/A';
    let resolvedCarId = providedCarId || null;

    // Validate category (can be category name or category_id)
    if (!category && !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Category or Category ID is required'
      });
    }

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

    // Create trip
    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        driver_id: targetDriverId,
        car_no: resolvedCarNo,
        driver_name: providedDriverId ? (req.body.driver_name || 'Driver') : userName,
        pick_up_date: pick_up_date,
        pick_up_time: pick_up_time,
        start_km: parseFloat(start_km),
        end_km: parseFloat(end_km),
        drop_location: drop_location,
        mileage: parseFloat(mileage),
        trip_rate: tripRate,
        commission_amount: commAmt,
        net_amount: netAmount,
        category: category,
        category_id: category_id
      })
      .select();

    if (error) {
      console.error('Error creating trip:', error);
      return res.status(400).json({
        success: false,
        message: 'Error creating trip',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      data: trip[0]
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

// Get All Trips
const getAllTrips = async (req, res) => {
  try {
    const { limit = 50, offset = 0, category, driver_id, pick_up_date } = req.query;

    let query = supabase.from('trips').select('*');

    // Apply filters if provided
    if (category) {
      query = query.eq('category', category.toLowerCase());
    }
    if (driver_id) {
      query = query.eq('driver_id', driver_id);
    }
    if (pick_up_date) {
      query = query.eq('pick_up_date', pick_up_date);
    }

    const { data: trips, error, count } = await query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error('Error fetching trips:', error);
      return res.status(400).json({
        success: false,
        message: 'Error fetching trips',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Trips retrieved successfully',
      count: trips.length,
      data: trips
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

// Get Trip by ID
const getTripById = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID is required'
      });
    }

    const { data: trip, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (error || !trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Trip retrieved successfully',
      data: trip
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

// Update Trip
const updateTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const updateData = req.body;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID is required'
      });
    }

    // Convert numeric fields
    if (updateData.start_km) updateData.start_km = parseFloat(updateData.start_km);
    if (updateData.end_km) updateData.end_km = parseFloat(updateData.end_km);
    if (updateData.mileage) updateData.mileage = parseFloat(updateData.mileage);
    if (updateData.trip_rate || updateData.commission_amount) {
      const currentRate = updateData.trip_rate !== undefined ? parseFloat(updateData.trip_rate) : null;
      const currentComm = updateData.commission_amount !== undefined ? parseFloat(updateData.commission_amount) : null;
      
      // If either is provided, we need to recalculate net_amount
      // This is slightly tricky without the original values, so we might need a quick fetch or assume the caller provides what's needed.
      // For now, let's just handle it if both are provided or if it's a simple update.
      if (currentRate !== null && currentComm !== null) {
        updateData.net_amount = currentRate - currentComm;
      }
    }
    if (updateData.trip_rate) updateData.trip_rate = parseFloat(updateData.trip_rate);
    if (updateData.commission_amount) updateData.commission_amount = parseFloat(updateData.commission_amount);

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

    const { data: trip, error } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', tripId)
      .select();

    if (error) {
      console.error('Error updating trip:', error);
      return res.status(400).json({
        success: false,
        message: 'Error updating trip',
        error: error.message
      });
    }

    if (!trip || trip.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Trip updated successfully',
      data: trip[0]
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

// Delete Trip
const deleteTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID is required'
      });
    }

    const { data, error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (error) {
      console.error('Error deleting trip:', error);
      return res.status(400).json({
        success: false,
        message: 'Error deleting trip',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Trip deleted successfully'
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

// Get Trips by Driver ID
const getTripsByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { limit = 50, offset = 0, month, year, category } = req.query;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID is required'
      });
    }

    let query = supabase
      .from('trips')
      .select('*')
      .eq('driver_id', driverId);

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Apply month and year filters if provided
    if (month && year) {
      let monthNum = parseInt(month);
      const yearNum = parseInt(year);

      // If month value is 0-indexed (0-11), convert to 1-indexed (1-12)
      if (monthNum >= 0 && monthNum < 12) {
        monthNum = monthNum + 1;
      }

      // Validate month
      if (monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          success: false,
          message: 'Invalid month. Must be between 1 and 12'
        });
      }

      // Create date range for the specified month
      const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      const endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      query = query
        .gte('pick_up_date', startDate)
        .lte('pick_up_date', endDate);
    } else if (year) {
      // If only year is provided, filter by year
      const yearNum = parseInt(year);
      const startDate = `${yearNum}-01-01`;
      const endDate = `${yearNum}-12-31`;

      query = query
        .gte('pick_up_date', startDate)
        .lte('pick_up_date', endDate);
    }

    const { data: trips, error } = await query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error('Error fetching driver trips:', error);
      return res.status(400).json({
        success: false,
        message: 'Error fetching trips',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Driver trips retrieved successfully',
      count: trips.length,
      data: trips,
      filters: {
        month: month ? parseInt(month) : null,
        year: year ? parseInt(year) : null,
        category: category || null
      }
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

// Get Car Revenue Statistics
const getCarRevenueStats = async (req, res) => {
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

    // Get trips grouped by car_no and category within the date range
    const { data: trips, error: tripError } = await supabase
      .from('trips')
      .select('car_no, category, trip_rate, pick_up_date')
      .gte('pick_up_date', startDate)
      .lte('pick_up_date', endDate);

    if (tripError) {
      console.error('Error fetching trips:', tripError);
      return res.status(400).json({
        success: false,
        message: 'Error fetching revenue data',
        error: tripError.message
      });
    }

    // Get expenses within the same date range
    const { data: expenses, error: expenseError } = await supabase
      .from('expenses')
      .select('car_no, amount')
      .gte('date', startDate)
      .lte('date', endDate);

    if (expenseError) {
      console.error('Error fetching expenses:', expenseError);
      // We'll continue even if expenses fail, but log it
    }

    // Calculate statistics
    const stats = {
      by_car_and_category: {},
      by_car_overall: {},
      overall_total_revenue: 0,
      overall_total_expense: 0,
      by_category_total: {}
    };

    // Process each trip
    trips.forEach(trip => {
      const carNo = trip.car_no || 'N/A';
      const category = trip.category || 'uncategorized';
      const rate = parseFloat(trip.trip_rate) || 0;

      // By car and category
      if (!stats.by_car_and_category[carNo]) {
        stats.by_car_and_category[carNo] = {};
      }
      if (!stats.by_car_and_category[carNo][category]) {
        stats.by_car_and_category[carNo][category] = {
          total_revenue: 0,
          trip_count: 0
        };
      }
      stats.by_car_and_category[carNo][category].total_revenue += rate;
      stats.by_car_and_category[carNo][category].trip_count += 1;

      // By car overall
      if (!stats.by_car_overall[carNo]) {
        stats.by_car_overall[carNo] = {
          total_revenue: 0,
          total_expense: 0,
          net_profit: 0,
          trip_count: 0
        };
      }
      stats.by_car_overall[carNo].total_revenue += rate;
      stats.by_car_overall[carNo].trip_count += 1;

      // By category total
      if (!stats.by_category_total[category]) {
        stats.by_category_total[category] = {
          total_revenue: 0,
          trip_count: 0
        };
      }
      stats.by_category_total[category].total_revenue += rate;
      stats.by_category_total[category].trip_count += 1;

      // Overall total revenue
      stats.overall_total_revenue += rate;
    });

    // Process each expense
    if (expenses) {
      expenses.forEach(expense => {
        const carNo = expense.car_no || 'N/A';
        const amount = parseFloat(expense.amount) || 0;

        if (!stats.by_car_overall[carNo]) {
          stats.by_car_overall[carNo] = {
            total_revenue: 0,
            total_expense: 0,
            net_profit: 0,
            trip_count: 0
          };
        }

        stats.by_car_overall[carNo].total_expense += amount;
        stats.overall_total_expense += amount;
      });
    }

    // Calculate net profit for each car
    Object.keys(stats.by_car_overall).forEach(carNo => {
      const carStats = stats.by_car_overall[carNo];
      carStats.net_profit = carStats.total_revenue - carStats.total_expense;
    });

    // Format the response
    const formattedStats = {
      period: {
        month: filterMonth,
        year: filterYear,
        startDate,
        endDate
      },
      overall_summary: {
        total_revenue: stats.overall_total_revenue,
        total_expense: stats.overall_total_expense,
        net_profit: stats.overall_total_revenue - stats.overall_total_expense,
        total_trips: trips.length
      },
      by_category: stats.by_category_total,
      by_car: stats.by_car_overall,
      by_car_and_category: stats.by_car_and_category
    };

    return res.status(200).json({
      success: true,
      message: 'Car revenue statistics retrieved successfully',
      data: formattedStats
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
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  getTripsByDriver,
  getCarRevenueStats
};
