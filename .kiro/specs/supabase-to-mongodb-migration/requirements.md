# Requirements Document

## Introduction

This document outlines the requirements for migrating an employee management system from Supabase (PostgreSQL with built-in authentication) to MongoDB. The system manages employees, projects, clients, notifications, and user profiles with role-based access control. The migration must preserve all existing functionality while adapting to MongoDB's document-oriented architecture.

## Glossary

- **System**: The employee management application
- **Supabase**: The current backend-as-a-service platform providing PostgreSQL database and authentication
- **MongoDB**: The target NoSQL document database
- **MongoDB Atlas**: Cloud-hosted MongoDB service
- **Mongoose**: MongoDB object modeling library for Node.js
- **Express Server**: Backend API server that will replace Supabase client-side queries
- **JWT**: JSON Web Tokens used for authentication
- **RLS**: Row Level Security (Supabase feature that needs alternative implementation)
- **Migration Script**: Automated script to transfer data from Supabase to MongoDB
- **Service Layer**: Backend API endpoints that replace direct database access
- **Client Application**: React/TypeScript frontend application

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to migrate all existing data from Supabase to MongoDB, so that no data is lost during the transition.

#### Acceptance Criteria

1. WHEN the migration script executes, THE System SHALL export all data from Supabase tables (employees, projects, employee_projects, notifications, notification_reads, user_profiles, dropdown_options)
2. WHEN data is exported from Supabase, THE System SHALL transform relational data structures to MongoDB document structures
3. WHEN data is transformed, THE System SHALL preserve all relationships between entities using MongoDB references or embedded documents
4. WHEN data is inserted into MongoDB, THE System SHALL validate data integrity and report any errors
5. WHEN the migration completes, THE System SHALL generate a migration report showing record counts and any failures

### Requirement 2

**User Story:** As a developer, I want to replace Supabase authentication with a custom JWT-based authentication system, so that users can continue to log in securely.

#### Acceptance Criteria

1. WHEN a user submits login credentials, THE System SHALL verify credentials against MongoDB user_profiles collection
2. WHEN credentials are valid, THE System SHALL generate a JWT token containing user ID and role
3. WHEN a JWT token is generated, THE System SHALL return it to the client with appropriate expiration time
4. WHEN a client makes an authenticated request, THE System SHALL validate the JWT token
5. WHEN a JWT token is invalid or expired, THE System SHALL return an authentication error

### Requirement 3

**User Story:** As a developer, I want to create an Express.js backend API, so that the frontend can interact with MongoDB through secure endpoints.

#### Acceptance Criteria

1. WHEN the server starts, THE System SHALL establish a connection to MongoDB using Mongoose
2. WHEN the server starts, THE System SHALL define Mongoose schemas for all collections
3. WHEN the server starts, THE System SHALL register all API routes for CRUD operations
4. WHEN an API endpoint receives a request, THE System SHALL authenticate the request using JWT middleware
5. WHEN an API endpoint processes a request, THE System SHALL enforce role-based access control

### Requirement 4

**User Story:** As a developer, I want to replace all Supabase client queries with API calls, so that the frontend works with the new MongoDB backend.

#### Acceptance Criteria

1. WHEN the frontend needs employee data, THE System SHALL call the appropriate Express API endpoint instead of Supabase
2. WHEN the frontend creates or updates data, THE System SHALL send requests to Express API endpoints
3. WHEN the frontend receives API responses, THE System SHALL handle them in the same format as Supabase responses
4. WHEN API calls fail, THE System SHALL display appropriate error messages to users
5. WHEN the user logs in, THE System SHALL store the JWT token for subsequent authenticated requests

### Requirement 5

**User Story:** As a developer, I want to implement MongoDB schemas that preserve the current data model, so that application logic remains consistent.

#### Acceptance Criteria

1. WHEN defining the Employee schema, THE System SHALL include all fields from the current employees table
2. WHEN defining the Project schema, THE System SHALL include all fields from the current projects table
3. WHEN defining relationships, THE System SHALL use MongoDB ObjectId references for one-to-many and many-to-many relationships
4. WHEN defining the EmployeeProject schema, THE System SHALL maintain the junction table pattern for employee-project assignments
5. WHEN defining schemas, THE System SHALL include appropriate indexes for query performance

### Requirement 6

**User Story:** As a developer, I want to implement role-based access control in the API layer, so that security is maintained without Supabase RLS.

#### Acceptance Criteria

1. WHEN a user makes a request, THE System SHALL extract the user role from the JWT token
2. WHEN processing employee operations, THE System SHALL allow Admin, Lead, and HR roles to perform CRUD operations
3. WHEN processing project operations, THE System SHALL allow Admin and Lead roles to perform CRUD operations
4. WHEN processing user management operations, THE System SHALL allow only Admin role to perform CRUD operations
5. WHEN a user lacks required permissions, THE System SHALL return a 403 Forbidden error

### Requirement 7

**User Story:** As a developer, I want to maintain all existing features including notifications, bulk upload, and financial analysis, so that users experience no loss of functionality.

#### Acceptance Criteria

1. WHEN an employee is created, updated, or deleted, THE System SHALL create appropriate notifications
2. WHEN bulk upload is performed, THE System SHALL process Excel files and handle conflicts as before
3. WHEN financial analysis is requested, THE System SHALL calculate costs and generate reports
4. WHEN dashboard data is requested, THE System SHALL aggregate statistics from MongoDB
5. WHEN dropdown options are requested, THE System SHALL return configured field options

### Requirement 8

**User Story:** As a developer, I want to update environment configuration, so that the application connects to MongoDB instead of Supabase.

#### Acceptance Criteria

1. WHEN the application starts, THE System SHALL read MongoDB connection string from environment variables
2. WHEN the application starts, THE System SHALL read JWT secret from environment variables
3. WHEN environment variables are missing, THE System SHALL display clear error messages
4. WHEN in development mode, THE System SHALL connect to a development MongoDB instance
5. WHEN in production mode, THE System SHALL connect to MongoDB Atlas with appropriate security settings

### Requirement 9

**User Story:** As a developer, I want to implement proper error handling and logging, so that issues can be diagnosed and resolved quickly.

#### Acceptance Criteria

1. WHEN database operations fail, THE System SHALL log detailed error information
2. WHEN API endpoints encounter errors, THE System SHALL return appropriate HTTP status codes
3. WHEN validation fails, THE System SHALL return clear error messages describing the issue
4. WHEN the server starts, THE System SHALL log connection status and configuration
5. WHEN critical errors occur, THE System SHALL prevent data corruption and maintain system stability

### Requirement 10

**User Story:** As a developer, I want to update the frontend service layer, so that it seamlessly works with the new Express API.

#### Acceptance Criteria

1. WHEN creating the API client, THE System SHALL configure base URL and authentication headers
2. WHEN making API calls, THE System SHALL include JWT token in Authorization header
3. WHEN API responses are received, THE System SHALL transform data to match existing TypeScript interfaces
4. WHEN implementing EmployeeService, THE System SHALL replace all Supabase queries with API calls
5. WHEN implementing ProjectService and NotificationService, THE System SHALL replace all Supabase queries with API calls
