// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Permission denied'
    });
  }
};

// Store passwords as plain text (no hashing)
const hashPassword = (password) => {
  return password;
};

const verifyPassword = (password, storedPassword) => {
  return password === storedPassword;
};

module.exports = {
  hashPassword,
  verifyPassword,
  isAdmin
};
