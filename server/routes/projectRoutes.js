import express from 'express';
import Project from '../models/Project.js';
import EmployeeProject from '../models/EmployeeProject.js';
import Employee from '../models/Employee.js';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/projects
 * Get all projects (Admin, Lead, HR, Delivery Team)
 */
router.get('/', ...authorize(['Admin', 'Lead', 'HR', 'Delivery Team']), async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('created_by', 'name email')
      .sort({ created_at: -1 });

    res.status(200).json({
      projects,
      count: projects.length
    });
  } catch (error) {
    console.error('Get projects error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to fetch projects'
      }
    });
  }
});

/**
 * GET /api/projects/:id
 * Get project by ID (Admin, Lead, HR, Delivery Team)
 */
router.get('/:id', ...authorize(['Admin', 'Lead', 'HR', 'Delivery Team']), async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate('created_by', 'name email');

    if (!project) {
      return res.status(404).json({
        error: {
          message: 'Project not found'
        }
      });
    }

    res.status(200).json({
      project
    });
  } catch (error) {
    console.error('Get project error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: {
          message: 'Invalid project ID format'
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Failed to fetch project'
      }
    });
  }
});

/**
 * POST /api/projects
 * Create new project (Admin, Lead, HR, Delivery Team)
 */
router.post('/', ...authorize(['Admin', 'Lead', 'HR', 'Delivery Team']), async (req, res) => {
  try {
    const projectData = req.body;
    const userId = req.user.userId;

    // Input validation
    if (!projectData.name || !projectData.client || !projectData.start_date) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields: name, client, and start_date are required'
        }
      });
    }

    // Create project
    const project = new Project({
      ...projectData,
      created_by: userId
    });

    await project.save();

    // Populate created_by before returning
    await project.populate('created_by', 'name email');

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    
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
        message: 'Failed to create project'
      }
    });
  }
});

/**
 * PUT /api/projects/:id
 * Update project (Admin, Lead, HR, Delivery Team)
 */
router.put('/:id', ...authorize(['Admin', 'Lead', 'HR', 'Delivery Team']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find project
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({
        error: {
          message: 'Project not found'
        }
      });
    }

    // Update project
    Object.assign(project, updateData);
    project.updated_at = new Date();

    await project.save();

    // Populate created_by before returning
    await project.populate('created_by', 'name email');

    res.status(200).json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: {
          message: 'Invalid project ID format'
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
        message: 'Failed to update project'
      }
    });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete project (Admin, Lead, HR, Delivery Team)
 */
router.delete('/:id', ...authorize(['Admin', 'Lead', 'HR', 'Delivery Team']), async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return res.status(404).json({
        error: {
          message: 'Project not found'
        }
      });
    }

    // Also delete all employee-project associations
    await EmployeeProject.deleteMany({ project_id: id });

    res.status(200).json({
      message: 'Project deleted successfully',
      project
    });
  } catch (error) {
    console.error('Delete project error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: {
          message: 'Invalid project ID format'
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Failed to delete project'
      }
    });
  }
});

/**
 * GET /api/projects/:id/employees
 * Get all employees assigned to a project (Admin, Lead, HR, Delivery Team)
 */
router.get('/:id/employees', ...authorize(['Admin', 'Lead', 'HR', 'Delivery Team']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify project exists
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        error: {
          message: 'Project not found'
        }
      });
    }

    // Get all employee-project associations for this project
    const employeeProjects = await EmployeeProject.find({ project_id: id })
      .populate('employee_id')
      .sort({ created_at: -1 });

    // Extract employee data with project-specific information
    const employees = employeeProjects.map(ep => ({
      ...ep.employee_id.toObject(),
      allocation_percentage: ep.allocation_percentage,
      start_date: ep.start_date,
      end_date: ep.end_date,
      role_in_project: ep.role_in_project,
      po_number: ep.po_number,
      billing_type: ep.billing_type,
      billing_rate: ep.billing_rate,
      employee_project_id: ep._id
    }));

    res.status(200).json({
      employees,
      count: employees.length
    });
  } catch (error) {
    console.error('Get project employees error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: {
          message: 'Invalid project ID format'
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Failed to fetch project employees'
      }
    });
  }
});

/**
 * POST /api/projects/:id/employees
 * Add employee to project (Admin, Lead, HR, Delivery Team)
 * Body: { employee_id, allocation_percentage, start_date, end_date, role_in_project, po_number, billing_type, billing_rate }
 */
router.post('/:id/employees', ...authorize(['Admin', 'Lead', 'HR', 'Delivery Team']), async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, allocation_percentage, start_date, end_date, role_in_project, po_number, billing_type, billing_rate } = req.body;

    // Input validation
    if (!employee_id || !start_date) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields: employee_id and start_date are required'
        }
      });
    }

    // Verify project exists
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        error: {
          message: 'Project not found'
        }
      });
    }

    // Verify employee exists
    const employee = await Employee.findById(employee_id);
    if (!employee) {
      return res.status(404).json({
        error: {
          message: 'Employee not found'
        }
      });
    }

    // Check if employee is already assigned to this project
    const existingAssignment = await EmployeeProject.findOne({
      employee_id,
      project_id: id
    });

    if (existingAssignment) {
      return res.status(409).json({
        error: {
          message: 'Employee is already assigned to this project'
        }
      });
    }

    // Create employee-project association
    const employeeProject = new EmployeeProject({
      employee_id,
      project_id: id,
      allocation_percentage: allocation_percentage || 100,
      start_date,
      end_date,
      role_in_project,
      po_number,
      billing_type,
      billing_rate
    });

    await employeeProject.save();

    // Populate employee data before returning
    await employeeProject.populate('employee_id');

    res.status(201).json({
      message: 'Employee added to project successfully',
      employeeProject
    });
  } catch (error) {
    console.error('Add employee to project error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: {
          message: 'Invalid ID format'
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
        message: 'Failed to add employee to project'
      }
    });
  }
});

/**
 * PUT /api/projects/:id/employees/:employeeId
 * Update employee assignment in project (Admin, Lead, HR, Delivery Team)
 */
router.put('/:id/employees/:employeeId', ...authorize(['Admin', 'Lead', 'HR', 'Delivery Team']), async (req, res) => {
  try {
    const { id, employeeId } = req.params;
    const { allocation_percentage, start_date, end_date, role_in_project, po_number, billing_type, billing_rate } = req.body;

    // Verify project exists
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        error: {
          message: 'Project not found'
        }
      });
    }

    // Find and update the employee-project association
    const employeeProject = await EmployeeProject.findOneAndUpdate(
      {
        employee_id: employeeId,
        project_id: id
      },
      {
        allocation_percentage,
        start_date,
        end_date: end_date || null,
        role_in_project,
        po_number,
        billing_type,
        billing_rate
      },
      { new: true, runValidators: true }
    ).populate('employee_id');

    if (!employeeProject) {
      return res.status(404).json({
        error: {
          message: 'Employee is not assigned to this project'
        }
      });
    }

    res.status(200).json({
      message: 'Employee assignment updated successfully',
      employeeProject
    });
  } catch (error) {
    console.error('Update employee assignment error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: {
          message: 'Invalid ID format'
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
        message: 'Failed to update employee assignment'
      }
    });
  }
});

/**
 * DELETE /api/projects/:id/employees/:employeeId
 * Remove employee from project (Admin, Lead, HR, Delivery Team)
 */
router.delete('/:id/employees/:employeeId', ...authorize(['Admin', 'Lead', 'HR', 'Delivery Team']), async (req, res) => {
  try {
    const { id, employeeId } = req.params;

    // Verify project exists
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        error: {
          message: 'Project not found'
        }
      });
    }

    // Find and delete the employee-project association
    const employeeProject = await EmployeeProject.findOneAndDelete({
      employee_id: employeeId,
      project_id: id
    });

    if (!employeeProject) {
      return res.status(404).json({
        error: {
          message: 'Employee is not assigned to this project'
        }
      });
    }

    res.status(200).json({
      message: 'Employee removed from project successfully',
      employeeProject
    });
  } catch (error) {
    console.error('Remove employee from project error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: {
          message: 'Invalid ID format'
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Failed to remove employee from project'
      }
    });
  }
});

export default router;
