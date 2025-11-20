import express from 'express';
import UserProfile from '../models/UserProfile.js';
import AuthService from '../services/authService.js';
import { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/users
 * Get all users (Admin only)
 */
router.get('/', ...authorize(['Admin']), async (req, res) => {
  try {
    const users = await UserProfile.find()
      .select('-password')
      .sort({ created_at: -1 });

    res.status(200).json({
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to fetch users'
      }
    });
  }
});

/**
 * POST /api/users
 * Create new user (Admin only)
 * Body: { email, password, name, role }
 */
router.post('/', ...authorize(['Admin']), async (req, res) => {
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

    // Check if user already exists
    const existingUser = await UserProfile.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: {
          message: 'User with this email already exists'
        }
      });
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(password);

    // Create user
    const user = new UserProfile({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        error: {
          message: 'User with this email already exists'
        }
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: {
          message: 'Validation error',
          details: error.message
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Failed to create user'
      }
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user (Admin only)
 * Body: { email?, name?, role?, password? }
 */
router.put('/:id', ...authorize(['Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, password } = req.body;

    // Find user
    const user = await UserProfile.findById(id);
    
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found'
        }
      });
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: {
            message: 'Invalid email format'
          }
        });
      }

      // Check if email is being changed and if it conflicts
      if (email.toLowerCase() !== user.email) {
        const existingUser = await UserProfile.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          return res.status(409).json({
            error: {
              message: 'User with this email already exists'
            }
          });
        }
      }
      user.email = email.toLowerCase();
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['Admin', 'Lead', 'HR', 'Delivery Team'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: {
            message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
          }
        });
      }
      user.role = role;
    }

    // Update name if provided
    if (name) {
      user.name = name;
    }

    // Update password if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          error: {
            message: 'Password must be at least 6 characters long'
          }
        });
      }
      const hashedPassword = await AuthService.hashPassword(password);
      user.password = hashedPassword;
    }

    user.updated_at = new Date();
    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: {
          message: 'Invalid user ID format'
        }
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        error: {
          message: 'User with this email already exists'
        }
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: {
          message: 'Validation error',
          details: error.message
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Failed to update user'
      }
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (Admin only)
 */
router.delete('/:id', ...authorize(['Admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserProfile.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found'
        }
      });
    }

    // Return deleted user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: 'User deleted successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: {
          message: 'Invalid user ID format'
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Failed to delete user'
      }
    });
  }
});

export default router;
