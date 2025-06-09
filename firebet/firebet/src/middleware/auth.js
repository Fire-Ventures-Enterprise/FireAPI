const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('./logger');

// Standard JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      logger.warn(`Invalid token attempt: ${err.message}`);
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Optional authentication - allows anonymous access
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

// FireAPI shared services authentication
const fireApiAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-fire-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Fire API key required'
      });
    }

    // Validate with shared services
    // Implementation depends on your Fire API shared auth service
    req.fireApiAuth = true;
    next();
  } catch (error) {
    logger.error('Fire API authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid Fire API credentials'
    });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  fireApiAuth
};
