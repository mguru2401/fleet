const supabase = require('../config/supabase');

// ============================================
// SALARY ADVANCE ENDPOINTS (Admin Only)
// ============================================

// Create Salary Advance
const createAdvance = async (req, res) => {
  try {
    const { driver_id, amount, date, description } = req.body;

    // Validate required fields
    if (!driver_id || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing (driver_id, amount, date)'
      });
    }

    // Get target driver's details (name and car_no)
    const { data: driver, error: driverError } = await supabase
      .from('users')
      .select('name, car_no')
      .eq('id', driver_id)
      .single();

    if (driverError || !driver) {
      return res.status(404).json({
        success: false,
        message: 'Target driver not found'
      });
    }

    // Create advance record
    const { data: advance, error } = await supabase
      .from('advances')
      .insert({
        driver_id: driver_id,
        driver_name: driver.name,
        car_no: driver.car_no || 'N/A',
        amount: parseFloat(amount),
        date: date,
        description: description || '',
        status: 'unpaid'
      })
      .select();

    if (error) {
      console.error('Error creating advance:', error);
      return res.status(400).json({
        success: false,
        message: 'Error creating advance',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Salary advance created successfully',
      data: advance[0]
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

// Get All Advances
const getAllAdvances = async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, driver_id } = req.query;

    let query = supabase.from('advances').select('*');

    if (status) {
      query = query.eq('status', status);
    }
    if (driver_id) {
      query = query.eq('driver_id', driver_id);
    }

    const { data: advances, error } = await query
      .order('date', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error('Error fetching advances:', error);
      return res.status(400).json({
        success: false,
        message: 'Error fetching advances',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Advances retrieved successfully',
      count: advances.length,
      data: advances
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

// Update Advance (e.g., mark as deducted)
const updateAdvance = async (req, res) => {
  try {
    const { advanceId } = req.params;
    const updateData = req.body;

    updateData.updated_at = new Date().toISOString();

    const { data: advance, error } = await supabase
      .from('advances')
      .update(updateData)
      .eq('id', advanceId)
      .select();

    if (error) {
      console.error('Error updating advance:', error);
      return res.status(400).json({
        success: false,
        message: 'Error updating advance',
        error: error.message
      });
    }

    if (!advance || advance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Advance record not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Advance updated successfully',
      data: advance[0]
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

// Delete Advance
const deleteAdvance = async (req, res) => {
  try {
    const { advanceId } = req.params;

    const { error } = await supabase
      .from('advances')
      .delete()
      .eq('id', advanceId);

    if (error) {
      console.error('Error deleting advance:', error);
      return res.status(400).json({
        success: false,
        message: 'Error deleting advance',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Advance deleted successfully'
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
  createAdvance,
  getAllAdvances,
  updateAdvance,
  deleteAdvance
};
