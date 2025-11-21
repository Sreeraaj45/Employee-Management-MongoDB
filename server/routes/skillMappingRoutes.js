import express from 'express';
import Employee from '../models/Employee.js';
import SkillResponse from '../models/SkillResponse.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/public/employee/:employeeId
 * Public endpoint to fetch employee data by employee_id (no authentication required)
 */
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Find employee by employee_id (not MongoDB _id)
    const employee = await Employee.findOne({ employee_id: employeeId })
      .select('name employee_id email')
      .lean();

    if (!employee) {
      return res.status(404).json({
        error: {
          message: 'Employee not found'
        }
      });
    }

    res.status(200).json({
      employee: {
        name: employee.name,
        employeeId: employee.employee_id,
        email: employee.email || ''
      }
    });
  } catch (error) {
    console.error('Get employee error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to fetch employee'
      }
    });
  }
});

/**
 * POST /api/public/skill-response
 * Public endpoint to submit skill mapping response (no authentication required)
 */
router.post('/skill-response', async (req, res) => {
  try {
    const { name, employee_id, email, selected_skills, skill_ratings, additional_skills } = req.body;

    // Input validation
    if (!name || !employee_id || !email) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields: name, employee_id, and email are required'
        }
      });
    }

    if (!email.includes('@ielektron.com')) {
      return res.status(400).json({
        error: {
          message: 'Please use company email (@ielektron.com)'
        }
      });
    }

    if (!skill_ratings || skill_ratings.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Please rate at least one skill'
        }
      });
    }

    // Create skill response
    const skillResponse = new SkillResponse({
      name,
      employee_id,
      email,
      selected_skills: selected_skills || [],
      skill_ratings,
      additional_skills: additional_skills || ''
    });

    await skillResponse.save();

    res.status(201).json({
      message: 'Skill mapping submitted successfully',
      response: skillResponse
    });
  } catch (error) {
    console.error('Create skill response error:', error);
    
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
        message: 'Failed to submit skill mapping'
      }
    });
  }
});

/**
 * GET /api/public/skill-responses
 * Get all skill responses (requires authentication)
 */
router.get('/skill-responses', authenticateToken, async (req, res) => {
  try {
    const responses = await SkillResponse.find()
      .sort({ submitted_at: -1 })
      .lean();

    res.status(200).json({
      responses,
      count: responses.length
    });
  } catch (error) {
    console.error('Get skill responses error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to fetch skill responses'
      }
    });
  }
});

/**
 * PUT /api/public/skill-responses/:id
 * Update a skill response (requires authentication)
 */
router.put('/skill-responses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const response = await SkillResponse.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!response) {
      return res.status(404).json({
        error: {
          message: 'Skill response not found'
        }
      });
    }

    res.status(200).json({
      message: 'Skill response updated successfully',
      response
    });
  } catch (error) {
    console.error('Update skill response error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to update skill response'
      }
    });
  }
});

/**
 * DELETE /api/public/skill-responses/:id
 * Delete a skill response (requires authentication)
 */
router.delete('/skill-responses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const response = await SkillResponse.findByIdAndDelete(id);

    if (!response) {
      return res.status(404).json({
        error: {
          message: 'Skill response not found'
        }
      });
    }

    res.status(200).json({
      message: 'Skill response deleted successfully'
    });
  } catch (error) {
    console.error('Delete skill response error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to delete skill response'
      }
    });
  }
});

/**
 * PUT /api/public/skill-responses/:id/manager-review
 * Save manager review for a skill response (requires authentication)
 */
router.put('/skill-responses/:id/manager-review', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { managerRatings, companyExpectations, ratingGaps, overallManagerReview } = req.body;

    // Validation
    if (!managerRatings || !Array.isArray(managerRatings)) {
      return res.status(400).json({
        error: {
          message: 'Manager ratings are required'
        }
      });
    }

    // Validate rating values
    for (const rating of managerRatings) {
      if (rating.rating < 1 || rating.rating > 5) {
        return res.status(400).json({
          error: {
            message: 'Rating values must be between 1 and 5'
          }
        });
      }
    }

    const response = await SkillResponse.findByIdAndUpdate(
      id,
      {
        manager_ratings: managerRatings,
        company_expectations: companyExpectations,
        rating_gaps: ratingGaps,
        overall_manager_review: overallManagerReview,
        manager_review_timestamp: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!response) {
      return res.status(404).json({
        error: {
          message: 'Skill response not found'
        }
      });
    }

    res.status(200).json({
      message: 'Manager review saved successfully',
      response
    });
  } catch (error) {
    console.error('Save manager review error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to save manager review'
      }
    });
  }
});

export default router;
