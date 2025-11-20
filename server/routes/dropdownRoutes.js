import express from 'express';
import DropdownOption from '../models/DropdownOption.js';
import { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/dropdowns
 * Get all dropdown options (all authenticated users)
 * Optional query params: field_name (to filter by specific field)
 */
router.get('/', ...authorize(['Admin', 'Lead', 'HR', 'Delivery Team']), async (req, res) => {
  try {
    const { field_name } = req.query;

    // Build query
    const query = { is_active: true };
    if (field_name) {
      query.field_name = field_name;
    }

    const dropdowns = await DropdownOption.find(query)
      .sort({ field_name: 1, display_order: 1, option_value: 1 })
      .select('-__v');

    // Group by field_name for easier frontend consumption
    const groupedDropdowns = dropdowns.reduce((acc, dropdown) => {
      const fieldName = dropdown.field_name;
      if (!acc[fieldName]) {
        acc[fieldName] = [];
      }
      acc[fieldName].push({
        _id: dropdown._id,
        option_value: dropdown.option_value,
        display_order: dropdown.display_order,
        created_at: dropdown.created_at,
        updated_at: dropdown.updated_at
      });
      return acc;
    }, {});

    res.status(200).json({
      dropdowns: groupedDropdowns,
      count: dropdowns.length
    });
  } catch (error) {
    console.error('Get dropdowns error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to fetch dropdown options'
      }
    });
  }
});

/**
 * POST /api/dropdowns
 * Create new dropdown option (Admin only)
 * Body: { field_name, option_value, display_order? }
 */
router.post('/', ...authorize(['Admin']), async (req, res) => {
  try {
    const { field_name, option_value, display_order } = req.body;

    // Input validation
    if (!field_name || !option_value) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields: field_name and option_value are required'
        }
      });
    }

    // Check if option already exists
    const existingOption = await DropdownOption.findOne({
      field_name: field_name.trim(),
      option_value: option_value.trim()
    });

    if (existingOption) {
      return res.status(409).json({
        error: {
          message: 'Dropdown option already exists for this field'
        }
      });
    }

    // Create dropdown option
    const dropdown = new DropdownOption({
      field_name: field_name.trim(),
      option_value: option_value.trim(),
      display_order: display_order || 0,
      created_by: req.user.userId
    });

    await dropdown.save();

    res.status(201).json({
      message: 'Dropdown option created successfully',
      dropdown
    });
  } catch (error) {
    console.error('Create dropdown error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        error: {
          message: 'Dropdown option already exists for this field'
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
        message: 'Failed to create dropdown option'
      }
    });
  }
});

/**
 * PUT /api/dropdowns/:id
 * Update dropdown option (Admin only)
 * Body: { option_value?, display_order?, is_active? }
 */
router.put('/:id', ...authorize(['Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { option_value, display_order, is_active } = req.body;

    // Find dropdown option
    const dropdown = await DropdownOption.findById(id);
    
    if (!dropdown) {
      return res.status(404).json({
        error: {
          message: 'Dropdown option not found'
        }
      });
    }

    // Update fields if provided
    if (option_value !== undefined) {
      // Check if new value conflicts with existing option
      const existingOption = await DropdownOption.findOne({
        _id: { $ne: id },
        field_name: dropdown.field_name,
        option_value: option_value.trim()
      });

      if (existingOption) {
        return res.status(409).json({
          error: {
            message: 'Dropdown option with this value already exists for this field'
          }
        });
      }

      dropdown.option_value = option_value.trim();
    }

    if (display_order !== undefined) {
      dropdown.display_order = display_order;
    }

    if (is_active !== undefined) {
      dropdown.is_active = is_active;
    }

    dropdown.updated_at = new Date();
    await dropdown.save();

    res.status(200).json({
      message: 'Dropdown option updated successfully',
      dropdown
    });
  } catch (error) {
    console.error('Update dropdown error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: {
          message: 'Invalid dropdown option ID format'
        }
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        error: {
          message: 'Dropdown option with this value already exists for this field'
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
        message: 'Failed to update dropdown option'
      }
    });
  }
});

/**
 * DELETE /api/dropdowns/:id
 * Delete dropdown option (Admin only)
 * Note: This performs a soft delete by setting is_active to false
 */
router.delete('/:id', ...authorize(['Admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const dropdown = await DropdownOption.findById(id);

    if (!dropdown) {
      return res.status(404).json({
        error: {
          message: 'Dropdown option not found'
        }
      });
    }

    // Soft delete - set is_active to false
    dropdown.is_active = false;
    dropdown.updated_at = new Date();
    await dropdown.save();

    res.status(200).json({
      message: 'Dropdown option deleted successfully',
      dropdown
    });
  } catch (error) {
    console.error('Delete dropdown error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: {
          message: 'Invalid dropdown option ID format'
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Failed to delete dropdown option'
      }
    });
  }
});

export default router;
