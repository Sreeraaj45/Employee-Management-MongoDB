import AuthService from '../services/authService.js';

/**
 * Middleware to authenticate JWT token from request header
 * Extracts token from Authorization header and verifies it
 * Attaches user info (userId and role) to req.user
 */
export const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: {
          message: 'Authentication required'
        }
      });
    }

    // Verify token
    const decoded = AuthService.verifyToken(token);
    
    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.message === 'Token expired') {
      return res.status(401).json({
        error: {
          message: 'Token expired'
        }
      });
    } else if (error.message === 'Invalid token') {
      return res.status(401).json({
        error: {
          message: 'Invalid token'
        }
      });
    }
    
    return res.status(401).json({
      error: {
        message: 'Authentication failed'
      }
    });
  }
};

/**
 * Middleware to check if user has required role
 * Must be used after authenticateToken middleware
 * @param {string[]} allowedRoles - Array of roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user info exists (should be set by authenticateToken)
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        error: {
          message: 'Authentication required'
        }
      });
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
};

/**
 * Combined middleware for authentication and authorization
 * Authenticates the token and checks role in one step
 * @param {string[]} allowedRoles - Array of roles that are allowed to access the route
 * @returns {Function[]} Array of middleware functions
 */
export const authorize = (allowedRoles) => {
  return [
    authenticateToken,
    requireRole(allowedRoles)
  ];
};
