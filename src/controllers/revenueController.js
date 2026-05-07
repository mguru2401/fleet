const supabase = require('../config/supabase');

// ============================================
// REVENUE TRACKING ENDPOINTS
// ============================================

// Record Daily Revenue
const recordRevenue = async (req, res) => {
  try {
    const { driver_id, car_id, date, amount } = req.body;

    if (!driver_id || !date || !amount) {
      return res.status(400).json({
        success: false,
        message: 'driver_id, date, and amount are required'
      });
    }

    // If car_id is not provided, try to fetch it from the driver's profile
    let targetCarId = car_id;
    if (!targetCarId) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('car_id')
        .eq('id', driver_id)
        .single();
      
      if (!userError && user) {
        targetCarId = user.car_id;
      }
    }

    const { data: revenue, error } = await supabase
      .from('revenue')
      .insert({
        driver_id,
        car_id: targetCarId || null,
        date,
        amount: parseFloat(amount)
      })
      .select();

    if (error) {
      console.error('Error recording revenue:', error);
      return res.status(400).json({
        success: false,
        message: 'Error recording revenue',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Revenue recorded successfully',
      data: revenue[0]
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

// Get Revenue History for a Driver
const getDriverRevenue = async (req, res) => {
  try {
    const { driver_id } = req.params;
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('revenue')
      .select('*')
      .eq('driver_id', driver_id);

    if (start_date) query = query.gte('date', start_date);
    if (end_date) query = query.lte('date', end_date);

    const { data: revenues, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error('Error fetching revenue:', error);
      return res.status(400).json({
        success: false,
        message: 'Error fetching revenue history',
        error: error.message
      });
    }

    const totalRevenue = revenues.reduce((sum, item) => sum + parseFloat(item.amount), 0);

    return res.status(200).json({
      success: true,
      data: revenues,
      total_revenue: totalRevenue
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
  recordRevenue,
  getDriverRevenue
};
