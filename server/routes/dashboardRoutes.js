import express from 'express';
import Employee from '../models/Employee.js';
import Project from '../models/Project.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/dashboard/metrics
 * Get dashboard metrics (all authenticated users)
 */
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    // Get total counts
    const totalEmployees = await Employee.countDocuments();
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: 'Active' });

    // Get billability statistics
    const billableEmployees = await Employee.countDocuments({ 
      billability_status: { $in: ['Billable', 'billable'] }
    });
    const benchEmployees = await Employee.countDocuments({ 
      billability_status: { $in: ['Bench', 'bench'] }
    });

    // Get department distribution
    const departmentDistribution = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get project status distribution
    const projectStatusDistribution = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      metrics: {
        totalEmployees,
        totalProjects,
        activeProjects,
        billableEmployees,
        benchEmployees,
        billabilityRate: totalEmployees > 0 
          ? ((billableEmployees / totalEmployees) * 100).toFixed(2) 
          : 0,
        departmentDistribution,
        projectStatusDistribution
      }
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to fetch dashboard metrics'
      }
    });
  }
});

/**
 * GET /api/dashboard/charts
 * Get chart data for dashboard (all authenticated users)
 */
router.get('/charts', authenticateToken, async (req, res) => {
  try {
    // Get employees by billability status
    const billabilityChart = await Employee.aggregate([
      {
        $group: {
          _id: '$billability_status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get employees by department
    const departmentChart = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          department: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get projects by status
    const projectStatusChart = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get projects by client (top 10)
    const clientChart = await Project.aggregate([
      {
        $group: {
          _id: '$client',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          client: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get experience band distribution
    const experienceBandChart = await Employee.aggregate([
      {
        $match: {
          experience_band: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$experience_band',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          band: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { band: 1 }
      }
    ]);

    res.status(200).json({
      charts: {
        billabilityChart,
        departmentChart,
        projectStatusChart,
        clientChart,
        experienceBandChart
      }
    });
  } catch (error) {
    console.error('Get dashboard charts error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to fetch dashboard charts'
      }
    });
  }
});

export default router;
