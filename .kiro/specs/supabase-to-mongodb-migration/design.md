# Design Document

## Overview

This design document outlines the architecture for converting an employee management system from Supabase (PostgreSQL + built-in auth) to MongoDB with a custom Express.js backend. The system will be rebuilt as a monorepo with frontend and backend in the same project, deployed to Azure. No data migration is required - this is a fresh implementation with MongoDB and custom authentication supporting four distinct user roles.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure App Service                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Monorepo Application                     │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │         React Frontend (Vite Build)             │ │  │
│  │  │  Served as static files from /dist              │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                        │                              │  │
│  │                        │ HTTP/REST + JWT              │  │
│  │                        ▼                              │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │         Express.js Backend                      │ │  │
│  │  │                                                  │ │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │ │  │
│  │  │  │   Auth   │  │   API    │  │ Business │     │ │  │
│  │  │  │Middleware│  │  Routes  │  │  Logic   │     │ │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘     │ │  │
│  │  │                                                  │ │  │
│  │  │  ┌──────────┐  ┌──────────┐                    │ │  │
│  │  │  │ Mongoose │  │   JWT    │                    │ │  │
│  │  │  │  Models  │  │ Service  │                    │ │  │
│  │  │  └──────────┘  └──────────┘                    │ │  │
│  │  │                                                  │ │  │
│  │  │  Serves: /api/* endpoints + static frontend    │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ MongoDB Driver
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  employees   │  │  projects    │  │ user_profiles│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │employee_     │  │notifications │  │ dropdown_    │     │
│  │projects      │  │              │  │ options      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Monorepo Structure:**
- Single project containing both frontend and backend
- Backend serves frontend static files
- Shared TypeScript types between frontend and backend

**Backend:**
- Node.js with Express.js
- Mongoose for MongoDB ODM
- jsonwebtoken for JWT authentication
- bcryptjs for password hashing
- cors for cross-origin requests
- dotenv for environment configuration
- express.static for serving frontend build

**Frontend:**
- React with TypeScript
- Vite for building
- Axios for HTTP requests
- Existing UI components (minimal changes)
- TailwindCSS for styling

**Database:**
- MongoDB Atlas (cloud-hosted)
- Mongoose schemas with validation

**Deployment:**
- Azure App Service
- Node.js runtime
- Environment variables configured in Azure

## Components and Interfaces

### Backend Components

#### 1. Authentication Service

**Purpose:** Handle user authentication, JWT generation, and password management

**Key Functions:**
```typescript
class AuthService {
  // Hash password using bcrypt
  static async hashPassword(password: string): Promise<string>
  
  // Verify password against hash
  static async verifyPassword(password: string, hash: string): Promise<boolean>
  
  // Generate JWT token
  static generateToken(userId: string, role: string): string
  
  // Verify JWT token
  static verifyToken(token: string): { userId: string; role: string }
  
  // Register new user
  static async register(email: string, password: string, name: string, role: string): Promise<User>
  
  // Login user
  static async login(email: string, password: string): Promise<{ user: User; token: string }>
}
```

#### 2. Authentication Middleware

**Purpose:** Protect routes and enforce role-based access control

**Key Functions:**
```typescript
// Verify JWT token from request header
function authenticateToken(req, res, next)

// Check if user has required role
function requireRole(roles: string[])

// Combined middleware
function authorize(roles: string[])
```

#### 3. API Routes

**Employee Routes:**
```
GET    /api/employees              - Get all employees
GET    /api/employees/:id          - Get employee by ID
POST   /api/employees              - Create employee
PUT    /api/employees/:id          - Update employee
DELETE /api/employees/:id          - Delete employee
POST   /api/employees/bulk         - Bulk upload employees
DELETE /api/employees/bulk         - Mass delete employees
```

**Project Routes:**
```
GET    /api/projects               - Get all projects
GET    /api/projects/:id           - Get project by ID
POST   /api/projects               - Create project
PUT    /api/projects/:id           - Update project
DELETE /api/projects/:id           - Delete project
GET    /api/projects/:id/employees - Get project employees
POST   /api/projects/:id/employees - Add employee to project
DELETE /api/projects/:id/employees/:employeeId - Remove employee from project
GET    /api/clients                - Get all clients
POST   /api/clients                - Add client
DELETE /api/clients/:name          - Delete client
```

**Notification Routes:**
```
GET    /api/notifications          - Get user notifications
GET    /api/notifications/unread   - Get unread count
POST   /api/notifications          - Create notification
PUT    /api/notifications/:id/read - Mark as read
PUT    /api/notifications/read-all - Mark all as read
```

**Auth Routes:**
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/change-password   - Change password
GET    /api/auth/me                - Get current user
```

**User Management Routes:**
```
GET    /api/users                  - Get all users (Admin only)
POST   /api/users                  - Create user (Admin only)
PUT    /api/users/:id              - Update user (Admin only)
DELETE /api/users/:id              - Delete user (Admin only)
```

**Dashboard Routes:**
```
GET    /api/dashboard/metrics      - Get dashboard metrics
GET    /api/dashboard/charts       - Get chart data
```

**Dropdown Routes:**
```
GET    /api/dropdowns              - Get all dropdown options
POST   /api/dropdowns              - Create dropdown option (Admin only)
PUT    /api/dropdowns/:id          - Update dropdown option (Admin only)
DELETE /api/dropdowns/:id          - Delete dropdown option (Admin only)
```

### Frontend Components

#### 1. API Client Service

**Purpose:** Centralized HTTP client with authentication

```typescript
class ApiClient {
  private baseURL: string
  private token: string | null
  
  setToken(token: string): void
  clearToken(): void
  
  async get<T>(url: string): Promise<T>
  async post<T>(url: string, data: any): Promise<T>
  async put<T>(url: string, data: any): Promise<T>
  async delete<T>(url: string): Promise<T>
}
```

#### 2. Updated Service Layer

**EmployeeService:**
```typescript
class EmployeeService {
  static async getAllEmployees(): Promise<Employee[]>
  static async getEmployeeById(id: string): Promise<Employee | null>
  static async createEmployee(data: EmployeeData): Promise<Employee>
  static async updateEmployee(id: string, data: Partial<EmployeeData>): Promise<Employee>
  static async deleteEmployee(id: string): Promise<void>
  static async bulkUploadEmployees(employees: EmployeeData[]): Promise<Employee[]>
  static async massDeleteEmployees(ids: string[]): Promise<void>
}
```

**ProjectService:**
```typescript
class ProjectService {
  static async getAllProjects(): Promise<Project[]>
  static async getProjectById(id: string): Promise<Project>
  static async createProject(data: ProjectData): Promise<Project>
  static async updateProject(id: string, data: Partial<ProjectData>): Promise<void>
  static async deleteProject(id: string): Promise<void>
  static async getProjectEmployees(id: string): Promise<Employee[]>
  static async linkEmployeeToProject(params: LinkParams): Promise<void>
  static async removeEmployeeFromProject(employeeId: string, projectId: string): Promise<void>
}
```

**AuthService (Frontend):**
```typescript
class AuthService {
  static async login(email: string, password: string): Promise<{ user: User; token: string }>
  static async register(email: string, password: string, name: string, role: string): Promise<void>
  static async changePassword(oldPassword: string, newPassword: string): Promise<void>
  static async getCurrentUser(): Promise<User>
  static logout(): void
  static getToken(): string | null
  static setToken(token: string): void
}
```

## Data Models

### MongoDB Schemas

#### UserProfile Schema

```typescript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  name: String (required),
  role: String (enum: ['Admin', 'Lead', 'HR', 'Delivery Team'], required),
  avatar_url: String (optional),
  created_at: Date (default: Date.now),
  updated_at: Date (default: Date.now)
}

Indexes:
- email (unique)
- role
```

#### Employee Schema

```typescript
{
  _id: ObjectId,
  s_no: Number (auto-increment),
  employee_id: String (unique, required),
  name: String (required),
  email: String (required),
  department: String (required),
  designation: String (required),
  mode_of_management: String,
  client: String,
  billability_status: String,
  po_number: String,
  billing: String,
  last_active_date: Date,
  projects: String,
  billability_percentage: Number,
  project_start_date: Date,
  project_end_date: Date,
  experience_band: String,
  rate: Number,
  ageing: Number,
  bench_days: Number,
  phone_number: String,
  emergency_contact: String,
  ctc: Number,
  remarks: String,
  last_modified_by: ObjectId (ref: 'UserProfile'),
  position: String,
  joining_date: Date,
  contact_number: String,
  location: String,
  manager: String,
  skills: [String],
  date_of_separation: Date,
  created_at: Date (default: Date.now),
  updated_at: Date (default: Date.now)
}

Indexes:
- employee_id (unique)
- email
- department
- billability_status
- client
```

#### Project Schema

```typescript
{
  _id: ObjectId,
  name: String (required),
  client: String (required),
  description: String,
  department: String,
  start_date: Date (required),
  end_date: Date,
  status: String (enum: ['Active', 'Completed', 'On Hold', 'Cancelled']),
  po_number: String,
  budget: Number,
  team_size: Number,
  currency: String,
  billing_type: String,
  created_by: ObjectId (ref: 'UserProfile'),
  created_at: Date (default: Date.now),
  updated_at: Date (default: Date.now)
}

Indexes:
- client
- status
- name
```

#### EmployeeProject Schema (Junction)

```typescript
{
  _id: ObjectId,
  employee_id: ObjectId (ref: 'Employee', required),
  project_id: ObjectId (ref: 'Project', required),
  allocation_percentage: Number (default: 100),
  start_date: Date (required),
  end_date: Date,
  role_in_project: String,
  po_number: String,
  billing_type: String (enum: ['Monthly', 'Fixed', 'Daily', 'Hourly']),
  billing_rate: Number,
  created_at: Date (default: Date.now)
}

Indexes:
- employee_id
- project_id
- compound: (employee_id, project_id) unique
```

#### Notification Schema

```typescript
{
  _id: ObjectId,
  title: String (required),
  message: String (required),
  type: String (enum: ['employee_created', 'employee_updated', 'employee_deleted', 
                       'project_created', 'project_updated', 'project_deleted',
                       'user_created', 'user_updated', 'user_deleted',
                       'bulk_upload_completed', 'system_announcement']),
  priority: String (enum: ['low', 'medium', 'high', 'urgent'], default: 'medium'),
  target_roles: [String] (enum values: ['Admin', 'Lead', 'HR', 'Delivery Team']),
  target_user_id: ObjectId (ref: 'UserProfile'),
  action_url: String,
  action_label: String,
  created_by: ObjectId (ref: 'UserProfile'),
  created_at: Date (default: Date.now),
  expires_at: Date,
  is_read: Boolean (default: false),
  read_at: Date,
  read_by: ObjectId (ref: 'UserProfile')
}

Indexes:
- target_roles
- target_user_id
- created_at
- is_read
```

#### NotificationRead Schema

```typescript
{
  _id: ObjectId,
  notification_id: ObjectId (ref: 'Notification', required),
  user_id: ObjectId (ref: 'UserProfile', required),
  read_at: Date (default: Date.now)
}

Indexes:
- compound: (notification_id, user_id) unique
- user_id
```

#### DropdownOption Schema

```typescript
{
  _id: ObjectId,
  field_name: String (required),
  option_value: String (required),
  display_order: Number (default: 0),
  is_active: Boolean (default: true),
  created_by: ObjectId (ref: 'UserProfile'),
  created_at: Date (default: Date.now),
  updated_at: Date (default: Date.now)
}

Indexes:
- field_name
- compound: (field_name, option_value) unique
```

#### POAmendment Schema

```typescript
{
  _id: ObjectId,
  project_id: ObjectId (ref: 'Project', required),
  po_number: String (required),
  start_date: Date (required),
  end_date: Date,
  is_active: Boolean (default: true),
  created_at: Date (default: Date.now),
  updated_at: Date (default: Date.now)
}

Indexes:
- project_id
- is_active
```

### Project Structure

```
project-root/
├── server/                    # Backend code
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API routes
│   ├── middleware/           # Auth & other middleware
│   ├── services/             # Business logic
│   ├── utils/                # Helper functions
│   ├── config/               # Configuration
│   └── server.js             # Express app entry point
├── src/                      # Frontend code (existing)
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── App.tsx
├── dist/                     # Frontend build output (gitignored)
├── package.json              # Combined dependencies
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Vite config
└── .env                      # Environment variables
```

### Initial Setup Strategy

**Phase 1: Create Default Admin User**
1. On first startup, check if any users exist
2. If no users exist, create default admin account
3. Log credentials to console for initial login
4. Admin can then create other users through UI

**Phase 2: Seed Initial Data (Optional)**
1. Create seed script for dropdown options
2. Create sample departments, designations
3. Populate initial configuration data

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication token validity

*For any* valid user credentials, when a user logs in, the system should generate a JWT token that can be successfully verified and contains the correct user ID and role.

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 2: Password hashing security

*For any* password string, the hashed version should never match the original password string, and verifying the original password against the hash should return true.

**Validates: Requirements 2.1, 2.6**

### Property 3: Role-based access control enforcement

*For any* API endpoint with role restrictions, when a user with insufficient permissions attempts access, the system should return a 403 Forbidden error.

**Validates: Requirements 6.8**

### Property 4: Default admin creation

*For any* fresh MongoDB database with no users, when the server starts, it should create a default admin user with secure credentials.

**Validates: Requirements 1.1, 1.2**

### Property 5: Relationship integrity

*For any* employee-project assignment, the MongoDB documents should maintain referential integrity through ObjectId references.

**Validates: Requirements 5.4, 5.5**

### Property 6: API response format consistency

*For any* API endpoint, the response format should match the existing TypeScript interfaces used by the frontend.

**Validates: Requirements 4.3, 10.3**

### Property 7: JWT token expiration

*For any* expired JWT token, when used in an authenticated request, the system should reject the request with an authentication error.

**Validates: Requirements 2.5**

### Property 8: Admin-only operations

*For any* user management operation, only users with Admin role should be able to perform create, update, or delete actions.

**Validates: Requirements 6.7**

### Property 9: Financial data access restriction

*For any* financial data request, only users with Admin or Lead roles should receive the data, while HR and Delivery Team roles should be denied.

**Validates: Requirements 6.6, 11.2, 11.3**

### Property 10: Dashboard role-based rendering

*For any* user role, when the user logs in, the dashboard should display only the features and navigation items appropriate for that role.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4**

### Property 11: Notification targeting

*For any* notification created with specific target roles, only users with those roles should see the notification in their notification list.

**Validates: Requirements 7.1**

### Property 12: Bulk upload conflict resolution

*For any* bulk upload operation with conflicts, the system should handle conflict resolution according to user choices without data loss.

**Validates: Requirements 7.2**

### Property 13: MongoDB connection resilience

*For any* database operation, if the MongoDB connection fails, the system should log the error and return an appropriate error response without crashing.

**Validates: Requirements 9.1, 9.5**

### Property 14: Environment configuration validation

*For any* required environment variable, if it is missing when the application starts, the system should display a clear error message and prevent startup.

**Validates: Requirements 8.3**

### Property 15: API authentication header requirement

*For any* protected API endpoint, requests without a valid JWT token in the Authorization header should be rejected with a 401 Unauthorized error.

**Validates: Requirements 4.5, 10.2**

## Error Handling

### Backend Error Handling

**Authentication Errors:**
- Invalid credentials: 401 Unauthorized
- Expired token: 401 Unauthorized
- Missing token: 401 Unauthorized
- Invalid token format: 401 Unauthorized

**Authorization Errors:**
- Insufficient permissions: 403 Forbidden

**Validation Errors:**
- Missing required fields: 400 Bad Request
- Invalid data format: 400 Bad Request
- Duplicate entries: 409 Conflict

**Database Errors:**
- Connection failure: 500 Internal Server Error
- Query timeout: 504 Gateway Timeout
- Data integrity violation: 409 Conflict

**Not Found Errors:**
- Resource not found: 404 Not Found

### Frontend Error Handling

**Network Errors:**
- Connection timeout: Display retry option
- Server unavailable: Display error message

**Authentication Errors:**
- Token expired: Redirect to login
- Invalid session: Clear local storage and redirect to login

**Validation Errors:**
- Display field-specific error messages
- Prevent form submission until resolved

**API Errors:**
- Display user-friendly error messages
- Log detailed errors to console

## Testing Strategy

### Unit Testing

**Backend Unit Tests:**
- Authentication service functions (password hashing, token generation)
- Middleware functions (token verification, role checking)
- Mongoose model validation
- Utility functions

**Frontend Unit Tests:**
- API client methods
- Service layer functions
- Authentication context
- Utility functions

### Integration Testing

**API Integration Tests:**
- Test all API endpoints with various role permissions
- Test authentication flow (register, login, token refresh)
- Test CRUD operations for all resources
- Test error handling and edge cases

**Database Integration Tests:**
- Test Mongoose schema validation
- Test complex queries and aggregations
- Test transaction handling
- Test index performance

### Property-Based Testing

**Testing Framework:** fast-check (JavaScript/TypeScript property-based testing library)

**Configuration:** Each property test should run a minimum of 100 iterations

**Property Tests:**

1. **Authentication Token Validity Test**
   - Generate random valid user credentials
   - Login and obtain JWT token
   - Verify token contains correct user ID and role
   - **Feature: supabase-to-mongodb-migration, Property 1: Authentication token validity**

2. **Password Hashing Security Test**
   - Generate random password strings
   - Hash each password
   - Verify hash doesn't match original
   - Verify original password validates against hash
   - **Feature: supabase-to-mongodb-migration, Property 2: Password hashing security**

3. **Role-Based Access Control Test**
   - Generate random user roles
   - Attempt to access restricted endpoints
   - Verify appropriate responses based on permissions
   - **Feature: supabase-to-mongodb-migration, Property 3: Role-based access control enforcement**

4. **API Response Format Test**
   - Call various API endpoints
   - Verify response structure matches TypeScript interfaces
   - **Feature: supabase-to-mongodb-migration, Property 6: API response format consistency**

5. **JWT Token Expiration Test**
   - Generate tokens with short expiration
   - Wait for expiration
   - Attempt to use expired token
   - Verify rejection
   - **Feature: supabase-to-mongodb-migration, Property 7: JWT token expiration**

6. **Dashboard Role Rendering Test**
   - Generate random user roles
   - Simulate login for each role
   - Verify dashboard shows appropriate features
   - **Feature: supabase-to-mongodb-migration, Property 10: Dashboard role-based rendering**

### End-to-End Testing

**User Flows:**
- Complete authentication flow (login, access protected resources, logout)
- Employee management flow (create, read, update, delete)
- Project management flow (create project, assign employees, update, delete)
- Bulk upload flow (upload file, resolve conflicts, verify results)
- Notification flow (create notification, view, mark as read)

### Initialization Testing

**Default Admin Creation Tests:**
- Verify admin user is created on first startup
- Verify admin credentials are logged
- Verify subsequent startups don't create duplicate admin
- Test admin can login and create other users

**Seed Data Tests:**
- Verify dropdown options are created
- Verify initial configuration data is populated
- Test data integrity after seeding

## Security Considerations

### Authentication Security

1. **Password Storage:**
   - Use bcrypt with salt rounds of 10
   - Never store plain text passwords
   - Implement password strength requirements

2. **JWT Security:**
   - Use strong secret key (minimum 256 bits)
   - Set appropriate expiration times (e.g., 24 hours)
   - Include only necessary claims in token
   - Validate token signature on every request

3. **Session Management:**
   - Store JWT in httpOnly cookies or secure local storage
   - Implement token refresh mechanism
   - Clear tokens on logout

### API Security

1. **Input Validation:**
   - Validate all input data
   - Sanitize user input to prevent injection attacks
   - Use Mongoose schema validation

2. **Rate Limiting:**
   - Implement rate limiting on authentication endpoints
   - Prevent brute force attacks

3. **CORS Configuration:**
   - Configure CORS to allow only trusted origins
   - Set appropriate headers

4. **Error Messages:**
   - Don't expose sensitive information in error messages
   - Log detailed errors server-side only

### Database Security

1. **Connection Security:**
   - Use MongoDB Atlas with TLS/SSL
   - Whitelist IP addresses
   - Use strong database credentials

2. **Access Control:**
   - Create database users with minimal required permissions
   - Use separate credentials for different environments

3. **Data Encryption:**
   - Enable encryption at rest in MongoDB Atlas
   - Use TLS for data in transit

## Performance Optimization

### Database Optimization

1. **Indexing Strategy:**
   - Create indexes on frequently queried fields
   - Use compound indexes for complex queries
   - Monitor index usage and performance

2. **Query Optimization:**
   - Use projection to limit returned fields
   - Implement pagination for large result sets
   - Use aggregation pipeline for complex operations

3. **Connection Pooling:**
   - Configure appropriate connection pool size
   - Reuse connections efficiently

### API Optimization

1. **Caching:**
   - Implement caching for frequently accessed data
   - Use Redis for session storage (optional enhancement)

2. **Response Compression:**
   - Enable gzip compression for API responses

3. **Pagination:**
   - Implement cursor-based pagination for large datasets
   - Return metadata (total count, page info)

### Frontend Optimization

1. **Request Batching:**
   - Batch multiple requests when possible
   - Use Promise.all for parallel requests

2. **Caching:**
   - Cache API responses in memory
   - Implement cache invalidation strategy

3. **Lazy Loading:**
   - Load data on demand
   - Implement infinite scroll for large lists

## Deployment Strategy

### Azure App Service Deployment

1. **Environment Setup:**
   - Development: Local MongoDB instance or MongoDB Atlas free tier
   - Production: MongoDB Atlas dedicated cluster

2. **Environment Variables (Azure Configuration):**
   ```
   NODE_ENV=production
   PORT=8080
   MONGODB_URI=mongodb+srv://admin:password@cluster0.mongodb.net/employee_skills
   JWT_SECRET=<strong-secret-key-minimum-32-characters>
   JWT_EXPIRATION=24h
   ```

3. **Build Process:**
   - Frontend: `npm run build` (creates dist/ folder)
   - Backend: No build needed (Node.js runs directly)
   - Combined: Backend serves frontend from dist/

4. **Azure App Service Configuration:**
   - Runtime: Node.js 18 LTS or higher
   - Startup Command: `node server/server.js`
   - Enable Application Insights for monitoring
   - Configure custom domain (optional)
   - Enable HTTPS only

5. **Deployment Methods:**
   - **Option 1:** GitHub Actions CI/CD
     - Push to main branch triggers deployment
     - Runs tests before deployment
     - Automatic rollback on failure
   
   - **Option 2:** Azure CLI
     ```bash
     az webapp up --name your-app-name --resource-group your-rg
     ```
   
   - **Option 3:** VS Code Azure Extension
     - Right-click project folder
     - Deploy to Web App

6. **Post-Deployment Verification:**
   - Check application logs in Azure Portal
   - Verify MongoDB connection
   - Test API endpoints
   - Verify frontend loads correctly
   - Test authentication flow

### Local Development Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   - Copy `.env.example` to `.env`
   - Update MongoDB connection string
   - Set JWT secret

3. **Run Development Server:**
   ```bash
   npm run dev
   ```
   - Frontend: Vite dev server on port 5173
   - Backend: Express server on port 3001
   - Frontend proxies API requests to backend

4. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```
   - Builds frontend to dist/
   - Starts Express server serving frontend + API

## Monitoring and Logging

### Backend Monitoring

1. **Application Logs:**
   - Log all authentication attempts
   - Log all database operations
   - Log all errors with stack traces
   - Use structured logging (JSON format)

2. **Performance Metrics:**
   - Track API response times
   - Monitor database query performance
   - Track memory and CPU usage

3. **Error Tracking:**
   - Implement error tracking service (e.g., Sentry)
   - Set up alerts for critical errors

### Database Monitoring

1. **MongoDB Atlas Monitoring:**
   - Monitor connection pool usage
   - Track slow queries
   - Monitor disk usage and IOPS
   - Set up alerts for anomalies

2. **Query Performance:**
   - Use MongoDB profiler for slow queries
   - Analyze query execution plans
   - Optimize indexes based on usage patterns

### Frontend Monitoring

1. **Error Tracking:**
   - Track JavaScript errors
   - Monitor API call failures
   - Track user authentication issues

2. **Performance Monitoring:**
   - Track page load times
   - Monitor API response times from client perspective
   - Track user interactions

## Implementation Timeline

### Phase 1: Project Setup & Backend Core (Week 1)
- Restructure project as monorepo
- Set up Express.js server
- Implement Mongoose schemas
- Create authentication service with JWT
- Implement password hashing with bcrypt
- Create default admin user on startup

### Phase 2: Backend API Development (Week 2)
- Implement all API routes (employees, projects, notifications, etc.)
- Create authentication middleware
- Implement role-based access control
- Add input validation
- Write unit tests for backend

### Phase 3: Frontend Integration (Week 3)
- Create API client service
- Update service layer (EmployeeService, ProjectService, NotificationService)
- Update authentication context and hooks
- Update environment configuration
- Configure Vite to work with Express backend
- Test all features with new backend

### Phase 4: Testing & Refinement (Week 4)
- Run unit tests
- Run integration tests
- Run property-based tests
- Perform end-to-end testing
- Fix bugs and issues
- Performance testing and optimization

### Phase 5: Azure Deployment (Week 5)
- Set up MongoDB Atlas cluster
- Configure Azure App Service
- Set up environment variables in Azure
- Deploy application to Azure
- Configure custom domain and SSL
- Set up monitoring and logging

### Phase 6: Post-Deployment (Week 6)
- Monitor application performance
- Address any production issues
- Optimize based on real usage
- Create admin and initial users
- Train users on new system
- Decommission Supabase
