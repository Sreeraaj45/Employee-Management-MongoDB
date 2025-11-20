import express from 'express';
import Employee from '../models/Employee.js';
import Project from '../models/Project.js';
import EmployeeProject from '../models/EmployeeProject.js';
import { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/financial/client-cost
 * Get cost analysis by client (Admin, Lead only)
 * Query params: client (optional - filter by specific client)
 */
router.get('/client-cost', ...authorize(['Admin', 'Lead']), async (req, res) => {
  try {
    const { client } = req.query;

    // Build match stage
    const matchStage = {};
    if (client) {
      matchStage.client = client;
    }

    // Aggregate employee costs by client
    const clientCosts = await Employee.aggregate([
      {
        $match: {
          client: { $exists: true, $ne: null, $ne: '' },
          ...(client && { client })
        }
      },
      {
        $group: {
          _id: '$client',
          totalEmployees: { $sum: 1 },
          totalCTC: { $sum: { $ifNull: ['$ctc', 0] } },
          totalRate: { $sum: { $ifNull: ['$rate', 0] } },
          averageCTC: { $avg: { $ifNull: ['$ctc', 0] } },
          averageRate: { $avg: { $ifNull: ['$rate', 0] } },
          billableEmployees: {
            $sum: {
              $cond: [
                { $in: ['$billability_status', ['Billable', 'billable']] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          client: '$_id',
          totalEmployees: 1,
          totalCTC: { $round: ['$totalCTC', 2] },
          totalRate: { $round: ['$totalRate', 2] },
          averageCTC: { $round: ['$averageCTC', 2] },
          averageRate: { $round: ['$averageRate', 2] },
          billableEmployees: 1,
          billabilityRate: {
            $cond: [
              { $gt: ['$totalEmployees', 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ['$billableEmployees', '$totalEmployees'] }, 100] },
                  2
                ]
              },
              0
            ]
          },
          _id: 0
        }
      },
      {
        $sort: { totalCTC: -1 }
      }
    ]);

    res.status(200).json({
      clientCosts,
      count: clientCosts.length,
      totalCost: clientCosts.reduce((sum, item) => sum + item.totalCTC, 0)
    });
  } catch (error) {
    console.error('Get client cost error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to fetch client cost data'
      }
    });
  }
});

/**
 * GET /api/financial/project-cost
 * Get cost analysis by project (Admin, Lead only)
 * Query params: project_id (optional - filter by specific project)
 */
router.get('/project-cost', ...authorize(['Admin', 'Lead']), async (req, res) => {
  try {
    const { project_id } = req.query;

    // Build match stage
    const matchStage = {};
    if (project_id) {
      matchStage._id = project_id;
    }

    // Get projects with their budgets
    const projects = await Project.find(matchStage).lean();

    // For each project, calculate employee costs
    const projectCosts = await Promise.all(
      projects.map(async (project) => {
        // Get employees assigned to this project
        const employeeProjects = await EmployeeProject.find({
          project_id: project._id
        }).populate('employee_id', 'name ctc rate billability_status');

        const employees = employeeProjects.map(ep => ep.employee_id).filter(e => e);

        const totalEmployees = employees.length;
        const totalCTC = employees.reduce((sum, emp) => sum + (emp.ctc || 0), 0);
        const totalRate = employees.reduce((sum, emp) => sum + (emp.rate || 0), 0);
        const averageCTC = totalEmployees > 0 ? totalCTC / totalEmployees : 0;
        const averageRate = totalEmployees > 0 ? totalRate / totalEmployees : 0;
        
        const billableEmployees = employees.filter(emp => 
          ['Billable', 'billable'].includes(emp.billability_status)
        ).length;

        // Calculate total billing from employee projects
        const totalBilling = employeeProjects.reduce((sum, ep) => 
          sum + (ep.billing_rate || 0), 0
        );

        return {
          projectId: project._id,
          projectName: project.name,
          client: project.client,
          status: project.status,
          budget: project.budget || 0,
          currency: project.currency || 'USD',
          totalEmployees,
          totalCTC: Math.round(totalCTC * 100) / 100,
          totalRate: Math.round(totalRate * 100) / 100,
          totalBilling: Math.round(totalBilling * 100) / 100,
          averageCTC: Math.round(averageCTC * 100) / 100,
          averageRate: Math.round(averageRate * 100) / 100,
          billableEmployees,
          billabilityRate: totalEmployees > 0 
            ? Math.round((billableEmployees / totalEmployees) * 100 * 100) / 100
            : 0,
          profitMargin: project.budget && totalBilling > 0
            ? Math.round(((project.budget - totalBilling) / project.budget) * 100 * 100) / 100
            : null
        };
      })
    );

    res.status(200).json({
      projectCosts,
      count: projectCosts.length,
      totalBudget: projectCosts.reduce((sum, item) => sum + item.budget, 0),
      totalCost: projectCosts.reduce((sum, item) => sum + item.totalCTC, 0)
    });
  } catch (error) {
    console.error('Get project cost error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to fetch project cost data'
      }
    });
  }
});

/**
 * GET /api/financial/analysis
 * Get comprehensive financial analysis (Admin, Lead only)
 */
router.get('/analysis', ...authorize(['Admin', 'Lead']), async (req, res) => {
  try {
    // Overall statistics
    const totalEmployees = await Employee.countDocuments();
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: 'Active' });

    // Total CTC and rates
    const employeeFinancials = await Employee.aggregate([
      {
        $group: {
          _id: null,
          totalCTC: { $sum: { $ifNull: ['$ctc', 0] } },
          totalRate: { $sum: { $ifNull: ['$rate', 0] } },
          averageCTC: { $avg: { $ifNull: ['$ctc', 0] } },
          averageRate: { $avg: { $ifNull: ['$rate', 0] } },
          billableCount: {
            $sum: {
              $cond: [
                { $in: ['$billability_status', ['Billable', 'billable']] },
                1,
                0
              ]
            }
          },
          benchCount: {
            $sum: {
              $cond: [
                { $in: ['$billability_status', ['Bench', 'bench']] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const financials = employeeFinancials[0] || {
      totalCTC: 0,
      totalRate: 0,
      averageCTC: 0,
      averageRate: 0,
      billableCount: 0,
      benchCount: 0
    };

    // Project budgets
    const projectFinancials = await Project.aggregate([
      {
        $group: {
          _id: null,
          totalBudget: { $sum: { $ifNull: ['$budget', 0] } },
          averageBudget: { $avg: { $ifNull: ['$budget', 0] } }
        }
      }
    ]);

    const projectStats = projectFinancials[0] || {
      totalBudget: 0,
      averageBudget: 0
    };

    // Cost by department
    const departmentCosts = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          employeeCount: { $sum: 1 },
          totalCTC: { $sum: { $ifNull: ['$ctc', 0] } },
          averageCTC: { $avg: { $ifNull: ['$ctc', 0] } }
        }
      },
      {
        $project: {
          department: '$_id',
          employeeCount: 1,
          totalCTC: { $round: ['$totalCTC', 2] },
          averageCTC: { $round: ['$averageCTC', 2] },
          _id: 0
        }
      },
      {
        $sort: { totalCTC: -1 }
      }
    ]);

    // Cost by experience band
    const experienceBandCosts = await Employee.aggregate([
      {
        $match: {
          experience_band: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$experience_band',
          employeeCount: { $sum: 1 },
          totalCTC: { $sum: { $ifNull: ['$ctc', 0] } },
          averageCTC: { $avg: { $ifNull: ['$ctc', 0] } },
          averageRate: { $avg: { $ifNull: ['$rate', 0] } }
        }
      },
      {
        $project: {
          experienceBand: '$_id',
          employeeCount: 1,
          totalCTC: { $round: ['$totalCTC', 2] },
          averageCTC: { $round: ['$averageCTC', 2] },
          averageRate: { $round: ['$averageRate', 2] },
          _id: 0
        }
      },
      {
        $sort: { experienceBand: 1 }
      }
    ]);

    // Billability financial impact
    const billabilityImpact = {
      billableEmployees: financials.billableCount,
      benchEmployees: financials.benchCount,
      billabilityRate: totalEmployees > 0 
        ? Math.round((financials.billableCount / totalEmployees) * 100 * 100) / 100
        : 0,
      potentialRevenue: Math.round(financials.totalRate * 100) / 100,
      actualCost: Math.round(financials.totalCTC * 100) / 100
    };

    res.status(200).json({
      analysis: {
        overview: {
          totalEmployees,
          totalProjects,
          activeProjects,
          totalCTC: Math.round(financials.totalCTC * 100) / 100,
          totalRate: Math.round(financials.totalRate * 100) / 100,
          averageCTC: Math.round(financials.averageCTC * 100) / 100,
          averageRate: Math.round(financials.averageRate * 100) / 100,
          totalBudget: Math.round(projectStats.totalBudget * 100) / 100,
          averageBudget: Math.round(projectStats.averageBudget * 100) / 100
        },
        billabilityImpact,
        departmentCosts,
        experienceBandCosts
      }
    });
  } catch (error) {
    console.error('Get financial analysis error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to fetch financial analysis'
      }
    });
  }
});

export default router;
