const supabase = require('../config/supabase');

// ============================================
// CAR MANAGEMENT ENDPOINTS
// ============================================

// Create Car
const createCar = async (req, res) => {
  try {
    const { name, car_no, model, year } = req.body;

    if (!name || !car_no) {
      return res.status(400).json({
        success: false,
        message: 'Name and Car Number are required'
      });
    }

    const { data: car, error } = await supabase
      .from('cars')
      .insert({
        name,
        car_no,
        model: model || '',
        year: year || null
      })
      .select();

    if (error) {
      console.error('Error creating car:', error);
      return res.status(400).json({
        success: false,
        message: 'Error creating car',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Car created successfully',
      data: car[0]
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

// Get All Cars
const getAllCars = async (req, res) => {
  try {
    const { data: cars, error } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cars:', error);
      return res.status(400).json({
        success: false,
        message: 'Error fetching cars',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cars retrieved successfully',
      data: cars
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

// Get Car by ID
const getCarById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: car, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: car
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

// Update Car
const updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    updateData.updated_at = new Date().toISOString();

    const { data: car, error } = await supabase
      .from('cars')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating car:', error);
      return res.status(400).json({
        success: false,
        message: 'Error updating car',
        error: error.message
      });
    }

    if (!car || car.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Car updated successfully',
      data: car[0]
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

// Delete Car
const deleteCar = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting car:', error);
      return res.status(400).json({
        success: false,
        message: 'Error deleting car',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Car deleted successfully'
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
  createCar,
  getAllCars,
  getCarById,
  updateCar,
  deleteCar
};
