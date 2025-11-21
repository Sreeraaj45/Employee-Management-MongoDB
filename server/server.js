import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import { config, validateEnv } from './config/env.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate environment variables
validateEnv();

// Initialize Express app
const app = express();

// Import initialization service
import InitializationService from './services/initializationService.js';

// Connect to MongoDB and run initialization (only in non-test environment)
connectDB().then(async () => {
  // Run initialization tasks (create default admin if needed)
  // Skip initialization in test environment to avoid interfering with tests
  if (config.nodeEnv !== 'test' && process.env.NODE_ENV !== 'test') {
    try {
      await InitializationService.initialize();
    } catch (error) {
      console.error('Failed to run initialization:', error);
    }
  }
});

// Import middleware
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler.js';
import Logger from './utils/logger.js';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for bulk uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware (logs all incoming requests)
app.use(requestLogger);

// Import routes
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import dropdownRoutes from './routes/dropdownRoutes.js';
import financialRoutes from './routes/financialRoutes.js';
import skillMappingRoutes from './routes/skillMappingRoutes.js';

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Employee routes
app.use('/api/employees', employeeRoutes);

// Project routes
app.use('/api/projects', projectRoutes);

// Client routes
app.use('/api/clients', clientRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// User management routes
app.use('/api/users', userRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Dropdown routes
app.use('/api/dropdowns', dropdownRoutes);

// Financial routes
app.use('/api/financial', financialRoutes);

// Public skill mapping routes (no authentication required)
app.use('/api/public', skillMappingRoutes);

// Serve static files from the React app in production
if (config.nodeEnv === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
}

// 404 handler for unmatched API routes (must be after all route definitions)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return notFoundHandler(req, res, next);
  }
  next();
});

// Handle React routing in production - must be after API 404 handler
if (config.nodeEnv === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  Logger.info(`Server started successfully`, {
    environment: config.nodeEnv,
    port: PORT,
    apiUrl: `http://localhost:${PORT}/api`,
    ...(config.nodeEnv === 'production' && { frontendUrl: `http://localhost:${PORT}` })
  });
  
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  if (config.nodeEnv === 'production') {
    console.log(`Frontend served from http://localhost:${PORT}`);
  }
});

export default app;
