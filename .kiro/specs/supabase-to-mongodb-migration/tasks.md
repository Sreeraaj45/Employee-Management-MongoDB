# Implementation Plan

## Overview

This implementation plan converts the employee management system from Supabase to MongoDB with a monorepo structure. The frontend and backend will be in the same project, with Express.js serving both the API and the built frontend. The application will be deployed to Azure App Service.

## Tasks

- [x] 1. Set up Express.js backend structure





  - Create server directory with proper structure (models, routes, middleware, services, utils, config)
  - Install backend dependencies (express, mongoose, jsonwebtoken, bcryptjs, cors, dotenv)
  - Create main server.js file that serves both API and frontend static files
  - Configure Express to serve frontend build from dist/ folder
  - _Requirements: 3.1, 3.2, 3.3, 8.1_

- [x] 2. Implement Mongoose schemas and models





  - Create UserProfile schema with four roles (Admin, Lead, HR, Delivery Team)
  - Create Employee schema with all existing fields
  - Create Project schema
  - Create EmployeeProject junction schema
  - Create Notification schema
  - Create NotificationRead schema
  - Create DropdownOption schema
  - Create POAmendment schema
  - Add appropriate indexes for performance
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
-

- [x] 3. Implement authentication service and middleware




  - [x] 3.1 Create authentication service with password hashing and JWT generation


    - Implement password hashing using bcrypt (10 salt rounds)
    - Implement JWT token generation with user ID and role
    - Implement JWT token verification
    - Implement password verification
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x] 3.2 Create authentication middleware


    - Implement authenticateToken middleware to verify JWT from request header
    - Implement requireRole middleware for role-based access control
    - Implement combined authorize middleware
    - _Requirements: 3.4, 6.1_

  - [x] 3.3 Write property test for authentication


    - **Property 1: Authentication token validity**
    - **Validates: Requirements 2.2, 2.3, 2.4**

  - [x] 3.4 Write property test for password hashing

    - **Property 2: Password hashing security**
    - **Validates: Requirements 2.1, 2.6**

- [x] 4. Implement authentication routes





  - Create POST /api/auth/register endpoint
  - Create POST /api/auth/login endpoint
  - Create POST /api/auth/change-password endpoint
  - Create GET /api/auth/me endpoint
  - Add input validation for all auth endpoints
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 4.1 Write property test for role-based access control


  - **Property 3: Role-based access control enforcement**
  - **Validates: Requirements 6.8**

- [x] 5. Implement employee API routes




  - Create GET /api/employees endpoint (all roles can view)
  - Create GET /api/employees/:id endpoint
  - Create POST /api/employees endpoint (Admin, Lead, HR, Delivery Team)
  - Create PUT /api/employees/:id endpoint (Admin, Lead, HR, Delivery Team)
  - Create DELETE /api/employees/:id endpoint (Admin, Delivery Team only)
  - Create POST /api/employees/bulk endpoint (Admin only)
  - Create DELETE /api/employees/bulk endpoint (Admin only)
  - Implement role-based access control for each endpoint
  - _Requirements: 6.2, 6.3, 6.4, 7.2_

- [x] 6. Implement project API routes





  - Create GET /api/projects endpoint
  - Create GET /api/projects/:id endpoint
  - Create POST /api/projects endpoint
  - Create PUT /api/projects/:id endpoint
  - Create DELETE /api/projects/:id endpoint
  - Create GET /api/projects/:id/employees endpoint
  - Create POST /api/projects/:id/employees endpoint
  - Create DELETE /api/projects/:id/employees/:employeeId endpoint
  - Implement role-based access control (Admin, Lead, HR, Delivery Team)
  - _Requirements: 6.5, 7.3_

- [x] 7. Implement client API routes





  - Create GET /api/clients endpoint
  - Create POST /api/clients endpoint
  - Create DELETE /api/clients/:name endpoint
  - Implement role-based access control
  - _Requirements: 6.5_

- [x] 8. Implement notification API routes




  - Create GET /api/notifications endpoint (filtered by user role)
  - Create GET /api/notifications/unread endpoint
  - Create POST /api/notifications endpoint
  - Create PUT /api/notifications/:id/read endpoint
  - Create PUT /api/notifications/read-all endpoint
  - Implement notification targeting by role
  - _Requirements: 7.1_

- [x] 8.1 Write property test for notification targeting



  - **Property 11: Notification targeting**
  - **Validates: Requirements 7.1**

- [x] 9. Implement user management API routes (Admin only)


  - Create GET /api/users endpoint
  - Create POST /api/users endpoint
  - Create PUT /api/users/:id endpoint
  - Create DELETE /api/users/:id endpoint
  - Enforce Admin-only access
  - _Requirements: 6.7_

- [x] 9.1 Write property test for admin-only operations

  - **Property 8: Admin-only operations**
  - **Validates: Requirements 6.7**

- [x] 10. Implement dashboard and dropdown API routes

  - Create GET /api/dashboard/metrics endpoint
  - Create GET /api/dashboard/charts endpoint
  - Create GET /api/dropdowns endpoint
  - Create POST /api/dropdowns endpoint (Admin only)
  - Create PUT /api/dropdowns/:id endpoint (Admin only)
  - Create DELETE /api/dropdowns/:id endpoint (Admin only)
  - _Requirements: 7.3, 7.4_

- [x] 11. Implement financial API routes with role restrictions
  - Create GET /api/financial/client-cost endpoint (Admin, Lead only)
  - Create GET /api/financial/project-cost endpoint (Admin, Lead only)
  - Create GET /api/financial/analysis endpoint (Admin, Lead only)
  - Enforce role-based access (deny HR and Delivery Team)
  - _Requirements: 6.6, 11.2, 11.3_

- [x] 11.1 Write property test for financial data access restriction
  - **Property 9: Financial data access restriction**
  - **Validates: Requirements 6.6, 11.2, 11.3**

- [x] 12. Implement default admin user creation
  - Create initialization service that runs on server startup
  - Check if any users exist in database
  - If no users exist, create default admin user
  - Log admin credentials to console
  - Ensure subsequent startups don't create duplicate admin
  - _Requirements: 1.1, 1.2_

- [x] 12.1 Write property test for default admin creation
  - **Property 4: Default admin creation**
  - **Validates: Requirements 1.1, 1.2**

- [x] 13. Create frontend API client service
  - Create ApiClient class with base URL configuration
  - Implement token storage and retrieval
  - Implement setToken and clearToken methods
  - Implement HTTP methods (get, post, put, delete) with JWT header
  - Add error handling and response transformation
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 13.1 Write property test for API response format consistency
  - **Property 6: API response format consistency**
  - **Validates: Requirements 4.3, 10.3**

- [x] 13.2 Write property test for API authentication header requirement
  - **Property 15: API authentication header requirement**
  - **Validates: Requirements 4.5, 10.2**

- [x] 14. Update frontend AuthService
  - Replace Supabase auth calls with API client calls
  - Implement login method calling /api/auth/login
  - Implement register method calling /api/auth/register
  - Implement changePassword method
  - Implement getCurrentUser method
  - Implement logout method (clear token)
  - Update token storage to use localStorage
  - _Requirements: 4.1, 4.2, 4.4, 10.4_

- [x] 14.1 Write property test for JWT token expiration
  - **Property 7: JWT token expiration**
  - **Validates: Requirements 2.5**

- [x] 15. Update frontend EmployeeService
  - Replace all Supabase queries with API client calls
  - Update getAllEmployees to call GET /api/employees
  - Update getEmployeeById to call GET /api/employees/:id
  - Update createEmployee to call POST /api/employees
  - Update updateEmployee to call PUT /api/employees/:id
  - Update deleteEmployee to call DELETE /api/employees/:id
  - Update bulkUploadEmployees to call POST /api/employees/bulk
  - Update massDeleteEmployees to call DELETE /api/employees/bulk
  - Ensure response data matches existing TypeScript interfaces
  - _Requirements: 4.1, 4.2, 4.3, 10.4, 10.5_

- [x] 15.1 Write property test for bulk upload conflict resolution
  - **Property 12: Bulk upload conflict resolution**
  - **Validates: Requirements 7.2**

- [x] 16. Update frontend ProjectService
  - Replace all Supabase queries with API client calls
  - Update getAllProjects to call GET /api/projects
  - Update getProjectById to call GET /api/projects/:id
  - Update createProject to call POST /api/projects
  - Update updateProject to call PUT /api/projects/:id
  - Update deleteProject to call DELETE /api/projects/:id
  - Update getProjectEmployees to call GET /api/projects/:id/employees
  - Update linkEmployeeToProject to call POST /api/projects/:id/employees
  - Update removeEmployeeFromProject to call DELETE /api/projects/:id/employees/:employeeId
  - Update client-related methods
  - _Requirements: 4.1, 4.2, 4.3, 10.5_

- [x] 17. Update frontend NotificationService
  - Replace all Supabase queries with API client calls
  - Update getNotifications to call GET /api/notifications
  - Update getUnreadCount to call GET /api/notifications/unread
  - Update markAsRead to call PUT /api/notifications/:id/read
  - Update markAllAsRead to call PUT /api/notifications/read-all
  - Update createNotification to call POST /api/notifications
  - _Requirements: 4.1, 4.2, 4.3, 10.5_

- [x] 18. Update frontend authentication context and hooks
  - Update useAuth hook to work with new AuthService
  - Remove Supabase-specific code
  - Update login flow to store JWT token
  - Update logout flow to clear JWT token
  - Update user state management
  - Remove Microsoft OAuth (or implement custom OAuth if needed)
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 19. Update environment configuration
  - Remove VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
  - Keep VITE_MONGODB_URI for backend use (not exposed to frontend)
  - Add VITE_API_BASE_URL for frontend API calls
  - Update .env.example with new variables
  - Update vite.config.ts to proxy API requests in development
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 20. Implement role-based dashboard rendering
  - Update Sidebar component to show/hide menu items based on role
  - Admin: All features (dashboard, employees, projects, financial, reports, upload, user-management, settings)
  - Lead: Dashboard, employees, projects, financial, reports, settings
  - HR: Dashboard, employees, projects, reports, settings (no financial, no upload, no user-management)
  - Delivery Team: Dashboard, employees, projects, settings (no financial, no reports, no upload, no user-management)
  - Update route guards to enforce access control
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 20.1 Write property test for dashboard role rendering
  - **Property 10: Dashboard role-based rendering**
  - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

- [ ] 21. Update package.json scripts
  - Add "dev:server" script to run backend in development
  - Update "dev" script to run both frontend and backend concurrently
  - Add "build" script to build frontend
  - Add "start" script to run production server
  - Add "test" script for running tests
  - _Requirements: 3.1_

- [ ] 22. Configure Vite for production build
  - Update vite.config.ts to set correct base path
  - Configure build output directory (dist/)
  - Ensure assets are properly referenced
  - Test production build locally
  - _Requirements: 8.4_

- [ ] 23. Implement error handling and logging
  - Create error handling middleware for Express
  - Implement structured logging for all operations
  - Log authentication attempts
  - Log database operations
  - Log errors with stack traces
  - Return appropriate HTTP status codes
  - Return clear error messages
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 23.1 Write property test for MongoDB connection resilience
  - **Property 13: MongoDB connection resilience**
  - **Validates: Requirements 9.1, 9.5**

- [ ] 23.2 Write property test for environment configuration validation
  - **Property 14: Environment configuration validation**
  - **Validates: Requirements 8.3**

- [ ] 24. Create seed data script
  - Create script to populate dropdown options
  - Add common departments (Engineering, HR, Finance, etc.)
  - Add common designations (Developer, Manager, Lead, etc.)
  - Add common billability statuses
  - Add common experience bands
  - Make script idempotent (can run multiple times safely)
  - _Requirements: 7.4_

- [ ] 25. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 26. Create Azure deployment configuration
  - Create web.config for Azure App Service (if needed)
  - Create .deployment file specifying build command
  - Update package.json with Azure-specific scripts
  - Document environment variables needed in Azure
  - Create deployment guide
  - _Requirements: 8.4, 8.5_

- [ ] 27. Test complete application locally
  - Build frontend with `npm run build`
  - Start production server with `npm start`
  - Test all authentication flows
  - Test all CRUD operations for employees
  - Test all CRUD operations for projects
  - Test notifications
  - Test role-based access control
  - Test all four role types (Admin, Lead, HR, Delivery Team)
  - Verify financial data access restrictions
  - _Requirements: All_

- [ ] 28. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 29. Deploy to Azure App Service
  - Create MongoDB Atlas cluster (or use existing)
  - Create Azure App Service instance
  - Configure environment variables in Azure
  - Deploy application
  - Verify deployment
  - Test in production environment
  - _Requirements: 8.4, 8.5_

- [ ] 30. Post-deployment verification and documentation
  - Verify default admin user is created
  - Login as admin and create additional users
  - Test all features in production
  - Monitor application logs
  - Document any issues and resolutions
  - Create user guide for new system
  - _Requirements: All_
