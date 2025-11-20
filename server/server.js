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

// Connect to MongoDB and run initialization
connectDB().then(async () => {
  // Run initialization tasks (create default admin if needed)
  try {
    await InitializationService.initialize();
  } catch (error) {
    console.error('Failed to run initialization:', error);
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Serve static files from the React app in production
if (config.nodeEnv === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    },
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  if (config.nodeEnv === 'production') {
    console.log(`Frontend served from http://localhost:${PORT}`);
  }
});

export default app;
