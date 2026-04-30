const supabase = require('../config/supabase');

// ============================================
// TRIPS CRUD ENDPOINTS
// ============================================

// Create Trip
const createTrip = async (req, res) => {
  try {
    const { pick_up_date, pick_up_time, start_km, end_km, drop_location, mileage, trip_rate, category } = req.body;
    
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

    // Validate category
    const validCategories = ['amazon', 'ola', 'uber', 'other', 'it'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Allowed values: amazon, ola, uber, other, it'
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

    // Create trip
    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        driver_id: userId,
        car_no: user.car_no || 'N/A',
        driver_name: userName,
        pick_up_date: pick_up_date,
        pick_up_time: pick_up_time,
        start_km: parseFloat(start_km),
        end_km: parseFloat(end_km),
        drop_location: drop_location,
        mileage: parseFloat(mileage),
        trip_rate: parseFloat(trip_rate),
        category: category
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

    // Validate category if provided
    if (updateData.category) {
      const validCategories = ['amazon', 'ola', 'uber', 'other', 'it'];
      if (!validCategories.includes(updateData.category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category. Allowed values: amazon, ola, uber, other, it'
        });
      }
    }

    // Convert numeric fields
    if (updateData.start_km) updateData.start_km = parseFloat(updateData.start_km);
    if (updateData.end_km) updateData.end_km = parseFloat(updateData.end_km);
    if (updateData.mileage) updateData.mileage = parseFloat(updateData.mileage);
    if (updateData.trip_rate) updateData.trip_rate = parseFloat(updateData.trip_rate);

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

    // Get trips grouped by car_no and category with total revenue within the date range
    const { data: trips, error } = await supabase
      .from('trips')
      .select('car_no, category, trip_rate, pick_up_date')
      .gte('pick_up_date', startDate)
      .lte('pick_up_date', endDate);

    if (error) {
      console.error('Error fetching trips:', error);
      return res.status(400).json({
        success: false,
        message: 'Error fetching revenue data',
        error: error.message
      });
    }

    // Calculate statistics
    const stats = {
      by_car_and_category: {},
      by_car_overall: {},
      overall_total: 0,
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

      // Overall total
      stats.overall_total += rate;
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
        total_revenue: stats.overall_total,
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
