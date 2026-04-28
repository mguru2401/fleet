const supabase = require('../config/supabase');
const { generateToken } = require('../config/jwt');
const { hashPassword, verifyPassword } = require('../utils/password');
const crypto = require('crypto');

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Login API - using EMAIL instead of username
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Query user from Supabase by EMAIL
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    // Generate session ID
    const sessionId = crypto.randomBytes(16).toString('hex');

    // Update user with session ID and JWT token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        session_id: sessionId,
        jwt_token: token,
        last_login: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating session:', updateError);
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mobile_no: user.mobile_no,
        car_no: user.car_no,
        location: user.location,
        session_id: sessionId,
        jwt_token: token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, mobile_no, car_no, location, created_at, username')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Logout API
const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from('users')
      .update({
        session_id: null,
        jwt_token: null
      })
      .eq('id', userId);

    if (error) {
      console.error('Logout error:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ============================================
// USER MANAGEMENT ENDPOINTS (ADMIN ONLY)
// ============================================

// Create User - ADMIN ONLY
const createUser = async (req, res) => {
  try {
    const { email, password, name, role, mobile_no, car_no, location, username } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Check if username already exists (if provided)
    if (username) {
      const { data: existingUsername } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          username: username || email.split('@')[0],
          password_hash: passwordHash,
          name: name || email.split('@')[0],
          role: role || 'user',
          mobile_no: mobile_no || null,
          car_no: car_no || null,
          location: location || null
        }
      ])
      .select('id, email, username, name, role, mobile_no, car_no, location, created_at');

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully by admin',
      data: newUser[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get All Users - ADMIN ONLY
const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, username, name, role, mobile_no, car_no, location, last_login, created_at');

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get User by ID - ADMIN ONLY or own profile
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    // Only admin or the user themselves can view profile
    if (requesterRole !== 'admin' && requesterId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, name, role, mobile_no, car_no, location, last_login, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update User - ADMIN ONLY or own profile
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const { name, mobile_no, car_no, location, role, password } = req.body;

    // Only admin or the user themselves can update profile
    if (requesterRole !== 'admin' && requesterId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile'
      });
    }

    // Prepare update object
    const updateData = {};
    if (name) updateData.name = name;
    if (mobile_no) updateData.mobile_no = mobile_no;
    if (car_no) updateData.car_no = car_no;
    if (location) updateData.location = location;
    if (requesterRole === 'admin' && role) updateData.role = role; // Only admin can change role
    if (password) updateData.password_hash = hashPassword(password);
    updateData.updated_at = new Date().toISOString();

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, username, name, role, mobile_no, car_no, location, created_at, updated_at');

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error updating user',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete User - ADMIN ONLY
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent deleting self
    if (req.user.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting user',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ============================================
// HEALTH ENDPOINTS
// ============================================

// Basic health check
const health = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
};

// Detailed health check
const healthDetailed = async (req, res) => {
  try {
    // Test Supabase connection
    const { data: supabaseTest, error: supabaseError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
      .limit(0);

    const supabaseStatus = supabaseError ? 'disconnected' : 'connected';

    res.status(200).json({
      success: true,
      message: 'Server health check',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        server: 'running',
        supabase: supabaseStatus,
        database: supabaseStatus === 'connected' ? 'connected' : 'disconnected'
      },
      uptime: process.uptime(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      status: 'unhealthy',
      error: error.message
    });
  }
};

module.exports = {
  // Auth
  login,
  getProfile,
  logout,
  // User Management (Admin)
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  // Health
  health,
  healthDetailed
};
