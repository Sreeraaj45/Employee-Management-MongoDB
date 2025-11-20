import express from 'express';
import AuthService from '../services/authService.js';
import UserProfile from '../models/UserProfile.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { email, password, name, role }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Input validation
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields: email, password, name, and role are required'
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: {
          message: 'Invalid email format'
        }
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: {
          message: 'Password must be at least 6 characters long'
        }
      });
    }

    // Validate role
    const validRoles = ['Admin', 'Lead', 'HR', 'Delivery Team'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: {
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
        }
      });
    }

    // Register user
    const user = await AuthService.register(email, password, name, role);

    res.status(201).json({
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({
        error: {
          message: error.message
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Failed to register user'
      }
    });
  }
});

/**
 * POST /api/auth/login
 * Login user and return JWT token
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: 'Email and password are required'
        }
      });
    }

    // Login user
    const result = await AuthService.login(email, password);

    res.status(200).json({
      message: 'Login successful',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password'
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Failed to login'
      }
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password (requires authentication)
 * Body: { oldPassword, newPassword }
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Input validation
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        error: {
          message: 'Old password and new password are required'
        }
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: {
          message: 'New password must be at least 6 characters long'
        }
      });
    }

    // Find user
    const user = await UserProfile.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found'
        }
      });
    }

    // Verify old password
    const isOldPasswordValid = await AuthService.verifyPassword(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(401).json({
        error: {
          message: 'Current password is incorrect'
        }
      });
    }

    // Hash new password
    const hashedNewPassword = await AuthService.hashPassword(newPassword);

    // Update password
    user.password = hashedNewPassword;
    user.updated_at = new Date();
    await user.save();

    res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to change password'
      }
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user's information
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find user
    const user = await UserProfile.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to get user information'
      }
    });
  }
});

export default router;
