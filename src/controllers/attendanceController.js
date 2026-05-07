const supabase = require('../config/supabase');

// ============================================
// MONTHLY WORKING DAYS ENDPOINTS
// ============================================

// Add or Update Monthly Working Days
const upsertWorkingDays = async (req, res) => {
  try {
    const { driver_id, month, year, working_days } = req.body;

    if (!driver_id || !month || !year || working_days === undefined) {
      return res.status(400).json({
        success: false,
        message: 'driver_id, month, year, and working_days are required'
      });
    }

    // Use upsert logic: try to update if exists, otherwise insert
    const { data, error } = await supabase
      .from('monthly_working_days')
      .upsert(
        { 
          driver_id, 
          month, 
          year, 
          working_days,
          updated_at: new Date().toISOString()
        }, 
        { onConflict: 'driver_id, month, year' }
      )
      .select();

    if (error) {
      console.error('Error recording working days:', error);
      return res.status(400).json({
        success: false,
        message: 'Error recording working days',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Monthly working days recorded successfully',
      data: data[0]
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

// Get Monthly Working Days for a Driver
const getWorkingDays = async (req, res) => {
  try {
    const { driver_id } = req.params;
    const { year, month } = req.query;

    let query = supabase
      .from('monthly_working_days')
      .select('*')
      .eq('driver_id', driver_id);

    if (year) query = query.eq('year', year);
    if (month) query = query.eq('month', month);

    const { data: records, error } = await query.order('year', { ascending: false }).order('month', { ascending: false });

    if (error) {
      console.error('Error fetching working days:', error);
      return res.status(400).json({
        success: false,
        message: 'Error fetching working days',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      data: records
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
  upsertWorkingDays,
  getWorkingDays
};
