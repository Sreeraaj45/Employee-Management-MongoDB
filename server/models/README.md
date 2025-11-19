# Mongoose Models Documentation

This directory contains all Mongoose schemas and models for the Employee Management System.

## Models Overview

### 1. UserProfile
Stores user authentication and profile information with role-based access control.

**Roles:**
- Admin: Full system access including user management and bulk operations
- Lead: Access to employees, projects, financial data, and reports
- HR: Access to employees, projects, and reports (no financial data)
- Delivery Team: Limited access focused on project delivery and team management

**Indexes:**
- `email` (unique)
- `role`

### 2. Employee
Stores comprehensive employee information including personal, professional, and financial details.

**Key Features:**
- Auto-incrementing `s_no` field
- Skills stored as array
- References to UserProfile for tracking modifications

**Indexes:**
- `s_no` (unique, sparse)
- `employee_id` (unique)
- `email`
- `department`
- `billability_status`
- `client`

### 3. Project
Stores project information including client, budget, and status.

**Status Values:**
- Active
- Completed
- On Hold
- Cancelled

**Indexes:**
- `client`
- `status`
- `name`

### 4. EmployeeProject
Junction table for many-to-many relationship between employees and projects.

**Key Features:**
- Tracks allocation percentage
- Stores project-specific role and billing information
- Unique constraint on (employee_id, project_id) combination

**Indexes:**
- `employee_id`
- `project_id`
- `(employee_id, project_id)` (unique compound index)

### 5. Notification
Stores system notifications with role-based targeting.

**Notification Types:**
- employee_created, employee_updated, employee_deleted
- project_created, project_updated, project_deleted
- user_created, user_updated, user_deleted
- bulk_upload_completed
- system_announcement

**Priority Levels:**
- low, medium, high, urgent

**Indexes:**
- `target_roles`
- `target_user_id`
- `created_at` (descending)
- `is_read`

### 6. NotificationRead
Tracks which users have read which notifications.

**Indexes:**
- `(notification_id, user_id)` (unique compound index)
- `user_id`

### 7. DropdownOption
Stores configurable dropdown options for various fields.

**Key Features:**
- Supports ordering via `display_order`
- Can be activated/deactivated
- Unique constraint on (field_name, option_value)

**Indexes:**
- `field_name`
- `(field_name, option_value)` (unique compound index)

### 8. POAmendment
Tracks Purchase Order amendments for projects.

**Indexes:**
- `project_id`
- `is_active`

## Usage

Import models individually:
```javascript
import UserProfile from './models/UserProfile.js';
import Employee from './models/Employee.js';
```

Or import all at once:
```javascript
import {
  UserProfile,
  Employee,
  Project,
  EmployeeProject,
  Notification,
  NotificationRead,
  DropdownOption,
  POAmendment
} from './models/index.js';
```

## Testing

Run the model verification test:
```bash
node server/utils/testModels.js
```

This will:
- Connect to MongoDB
- Verify all models are properly defined
- Check that indexes are configured
- Test model instantiation
- Report any errors

## Notes

- All models use timestamps with custom field names (`created_at`, `updated_at`)
- ObjectId references use the `ref` property for population
- Indexes are defined using `schema.index()` to avoid duplication warnings
- The Employee model includes a pre-save hook for auto-incrementing `s_no`
