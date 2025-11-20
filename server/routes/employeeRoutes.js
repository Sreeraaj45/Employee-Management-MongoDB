import express from 'express';
import Employee from '../models/Employee.js';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/employees
 * Get all employees (all roles can view)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('last_modified_by', 'name email')
      .sort({ s_no: 1 });

    res.status(200).json({
      employees,
      count: employees.length
    });
  } catch (error) {
    console.error('Get employees error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to fetch employees'
      }
    });
  }
});

/**
 * GET /api/employees/:id
 * Get employee by ID (all roles can view)
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .populate('last_modified_by', 'name email');

    if (!employee) {
      return res.status(404).json({
        error: {
          message: 'Employee not found'
        }
      });
    }

    res.status(200).json({
      employee
    });
  } catch (error) {
    console.error('Get employee error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: {
          message: 'Invalid employee ID format'
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Failed to fetch employee'
      }
    });
  }
});

/**
 * POST /api/employees
 * Create new employee (Admin, Lead, HR, Delivery Team)
 */
router.post('/', ...authorize(['Admin', 'Lead', 'HR', 'Delivery Team']), async (req, res) => {
  try {
    const employeeData = req.body;
    const userId = req.user.userId;

    // Input validation
    if (!employeeData.employee_id || !employeeData.name || !employeeData.email || 
        !employeeData.department || !employeeData.designation) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields: employee_id, name, email, department, and designation are required'
        }
      });
    }

    // Check if employee_id already exists
    const existingEmployee = await Employee.findOne({ employee_id: employeeData.employee_id });
    if (existingEmployee) {
      return res.status(409).json({
        error: {
          message: 'Employee with this employee_id already exists'
        }
      });
    }

    // Create employee
    const employee = new Employee({
      ...employeeData,
      last_modified_by: userId
    });

    await employee.save();

    // Populate last_modified_by before returning
    await employee.populate('last_modified_by', 'name email');

    res.status(201).json({
      message: 'Employee created successfully',
      employee
    });
  } catch (error) {
    console.error('Create employee error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        error: {
          message: 'Employee with this employee_id or email already exists'
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
        message: 'Failed to create employee'
      }
    });
  }
});

/**
 * PUT /api/employees/:id
 * Update employee (Admin, Lead, HR, Delivery Team)
 */
router.put('/:id', ...authorize(['Admin', 'Lead', 'HR', 'Delivery Team']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.userId;

    // Find employee
    const employee = await Employee.findById(id);
    
    if (!employee) {
      return res.status(404).json({
        error: {
          message: 'Employee not found'
        }
      });
    }

    // Check if employee_id is being changed and if it conflicts
    if (updateData.employee_id && updateData.employee_id !== employee.employee_id) {
      const existingEmployee = await Employee.findOne({ employee_id: updateData.employee_id });
      if (existingEmployee) {
        return res.status(409).json({
          error: {
            message: 'Employee with this employee_id already exists'
          }
        });
      }
    }

    // Update employee
    Object.assign(employee, updateData);
    employee.last_modified_by = userId;
    employee.updated_at = new Date();

    await employee.save();

    // Populate last_modified_by before returning
    await employee.populate('last_modified_by', 'name email');

    res.status(200).json({
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: {
          message: 'Invalid employee ID format'
        }
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        error: {
          message: 'Employee with this employee_id or email already exists'
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
        message: 'Failed to update employee'
      }
    });
  }
});

/**
 * POST /api/employees/bulk
 * Bulk upload employees (Admin only)
 * Body: { employees: [...], conflictResolution: 'skip' | 'overwrite' | 'ask' }
 */
router.post('/bulk', ...authorize(['Admin']), async (req, res) => {
  try {
    const { employees, conflictResolution = 'skip' } = req.body;
    const userId = req.user.userId;

    // Input validation
    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Invalid input: employees array is required'
        }
      });
    }

    const results = {
      created: [],
      updated: [],
      skipped: [],
      errors: []
    };

    for (const employeeData of employees) {
      try {
        // Validate required fields - only employee_id and name are truly required
        if (!employeeData.employee_id || !employeeData.name) {
          results.errors.push({
            employee_id: employeeData.employee_id || 'unknown',
            error: 'Missing required fields: employee_id and name are required'
          });
          continue;
        }
        
        // Set defaults for optional fields if missing
        if (!employeeData.email) employeeData.email = '';
        if (!employeeData.department) employeeData.department = 'Not Specified';
        if (!employeeData.designation) employeeData.designation = 'Not Specified';
        
        // Clean numeric fields - convert empty strings to null/undefined
        const numericFields = ['billability_percentage', 'rate', 'ageing', 'bench_days', 'ctc'];
        numericFields.forEach(field => {
          if (employeeData[field] === '' || employeeData[field] === null) {
            delete employeeData[field];
          } else if (employeeData[field] !== undefined) {
            const num = Number(employeeData[field]);
            if (!isNaN(num)) {
              employeeData[field] = num;
            } else {
              delete employeeData[field];
            }
          }
        });
        
        // Convert date fields from DD-MM-YYYY to YYYY-MM-DD or valid Date
        const dateFields = ['last_active_date', 'project_start_date', 'project_end_date', 'joining_date', 'date_of_separation'];
        dateFields.forEach(field => {
          if (employeeData[field] && typeof employeeData[field] === 'string') {
            const dateStr = employeeData[field].trim();
            
            // Check if it's in DD-MM-YYYY format
            if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
              const [day, month, year] = dateStr.split('-');
              employeeData[field] = `${year}-${month}-${day}`;
            }
            // Check if it's in DD/MM/YYYY format
            else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
              const [day, month, year] = dateStr.split('/');
              employeeData[field] = `${year}-${month}-${day}`;
            }
            // If empty or invalid, remove it
            else if (dateStr === '' || dateStr === 'null' || dateStr === 'undefined') {
              delete employeeData[field];
            }
          } else if (!employeeData[field]) {
            delete employeeData[field];
          }
        });

        // Check if employee exists
        const existingEmployee = await Employee.findOne({ employee_id: employeeData.employee_id });

        if (existingEmployee) {
          if (conflictResolution === 'skip') {
            results.skipped.push({
              employee_id: employeeData.employee_id,
              reason: 'Employee already exists'
            });
          } else if (conflictResolution === 'overwrite') {
            // Update existing employee
            Object.assign(existingEmployee, employeeData);
            existingEmployee.last_modified_by = userId;
            existingEmployee.updated_at = new Date();
            await existingEmployee.save();
            results.updated.push(existingEmployee);
          } else if (conflictResolution === 'ask') {
            // Return conflict for user to resolve
            results.skipped.push({
              employee_id: employeeData.employee_id,
              reason: 'Conflict - requires user decision',
              existing: existingEmployee,
              new: employeeData
            });
          }
        } else {
          // Create new employee
          const employee = new Employee({
            ...employeeData,
            last_modified_by: userId
          });
          await employee.save();
          results.created.push(employee);
        }
      } catch (error) {
        console.error(`Error processing employee ${employeeData.employee_id}:`, error);
        
        // Provide more detailed error information
        let errorMessage = error.message;
        if (error.name === 'ValidationError') {
          // Extract validation error details
          const validationErrors = Object.keys(error.errors || {}).map(key => {
            return `${key}: ${error.errors[key].message}`;
          }).join(', ');
          errorMessage = validationErrors || error.message;
        }
        
        results.errors.push({
          employee_id: employeeData.employee_id || 'unknown',
          error: errorMessage,
          errorType: error.name
        });
      }
    }

    res.status(200).json({
      message: 'Bulk upload completed',
      results: {
        created: results.created.length,
        updated: results.updated.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      details: results
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to process bulk upload'
      }
    });
  }
});

/**
 * DELETE /api/employees/bulk
 * Mass delete employees (Admin only)
 * Body: { ids: [...] }
 */
router.delete('/bulk', ...authorize(['Admin']), async (req, res) => {
  try {
    const { ids } = req.body;

    // Input validation
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Invalid input: ids array is required'
        }
      });
    }

    const result = await Employee.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      message: 'Employees deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Mass delete error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to delete employees'
      }
    });
  }
});

/**
 * DELETE /api/employees/:id
 * Delete employee (Admin, Delivery Team only)
 */
router.delete('/:id', ...authorize(['Admin', 'Delivery Team']), async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({
        error: {
          message: 'Employee not found'
        }
      });
    }

    res.status(200).json({
      message: 'Employee deleted successfully',
      employee
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: {
          message: 'Invalid employee ID format'
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Failed to delete employee'
      }
    });
  }
});

export default router;
