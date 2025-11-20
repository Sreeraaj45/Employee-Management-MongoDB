import express from 'express';
import Project from '../models/Project.js';
import { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/clients
 * Get all unique clients from projects (Admin, Lead, HR, Delivery Team)
 */
router.get('/', ...authorize(['Admin', 'Lead', 'HR', 'Delivery Team']), async (req, res) => {
  try {
    // Get distinct client names from projects
    const clients = await Project.distinct('client');
    
    // Sort alphabetically
    clients.sort();

    res.status(200).json({
      clients,
      count: clients.length
    });
  } catch (error) {
    console.error('Get clients error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to fetch clients'
      }
    });
  }
});

/**
 * POST /api/clients
 * Add a new client (Admin, Lead, HR, Delivery Team)
 * Body: { name }
 */
router.post('/', ...authorize(['Admin', 'Lead', 'HR', 'Delivery Team']), async (req, res) => {
  try {
    const { name } = req.body;

    // Input validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        error: {
          message: 'Client name is required and must be a non-empty string'
        }
      });
    }

    const clientName = name.trim();

    // Check if client already exists
    const existingClient = await Project.findOne({ client: clientName });
    
    if (existingClient) {
      return res.status(409).json({
        error: {
          message: 'Client already exists'
        }
      });
    }

    // Note: We don't actually create a standalone client document
    // Clients are stored as part of projects
    // This endpoint just validates the client name is unique
    res.status(201).json({
      message: 'Client name validated successfully',
      client: clientName
    });
  } catch (error) {
    console.error('Add client error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to add client'
      }
    });
  }
});

/**
 * DELETE /api/clients/:name
 * Delete a client and all associated projects (Admin, Lead, HR, Delivery Team)
 */
router.delete('/:name', ...authorize(['Admin', 'Lead', 'HR', 'Delivery Team']), async (req, res) => {
  try {
    const { name } = req.params;

    // Handle empty or whitespace-only names
    if (!name || name.trim() === '' || name === '%20' || /^[\s%20]+$/.test(name)) {
      return res.status(400).json({
        error: {
          message: 'Client name is required'
        }
      });
    }

    const clientName = decodeURIComponent(name).trim();

    // Find all projects for this client
    const projects = await Project.find({ client: clientName });

    if (projects.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Client not found'
        }
      });
    }

    // Delete all projects for this client
    const result = await Project.deleteMany({ client: clientName });

    res.status(200).json({
      message: 'Client and associated projects deleted successfully',
      client: clientName,
      projectsDeleted: result.deletedCount
    });
  } catch (error) {
    console.error('Delete client error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to delete client'
      }
    });
  }
});

export default router;
