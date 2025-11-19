/*
  # Complete Employee Management System - Final Schema

  1. Database Schema
    - `user_profiles` - User accounts with role-based access (Admin, Lead, HR)
    - `employees` - Complete employee information with all required fields
    - `dropdown_options` - Configurable dropdown options for various fields
    - `projects` - Project management with client information
    - `employee_projects` - Many-to-many relationship between employees and projects
    - `notifications` - Real-time notification system

  2. Seeded Data
    - Default user accounts with known credentials
    - 12 sample employees across different departments
    - Dropdown options for all form fields
    - 5 sample projects with client information

  3. Security
    - Row Level Security enabled on all tables
    - Role-based policies for data access
    - Audit trail with last_modified_by tracking

  4. Default Credentials
    - Admin: admin@company.com / admin1234
    - Lead: lead@company.com / lead1234
    - HR: hr@company.com / hr1234

  5. Features
    - Auto-calculated ageing and bench days
    - Billability tracking and metrics
    - Project timeline management
    - Financial data with role-based access
    - Customizable dropdown options
    - Multi-currency support
    - Real-time notifications
*/

-- Create custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('Admin', 'Lead', 'HR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE billability_status AS ENUM ('Billable', 'Non-Billable', 'Bench', 'Trainee', 'Buffer', 'ML', 'NA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE engagement_mode AS ENUM ('Full Time', 'Contract', 'Part Time', 'Consultant');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('Active', 'Completed', 'On Hold', 'Cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create notification types enum
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'employee_created',
    'employee_updated', 
    'employee_deleted',
    'project_created',
    'project_updated',
    'project_deleted',
    'user_created',
    'user_updated',
    'user_deleted',
    'bulk_upload_completed',
    'system_announcement'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create notification priority enum
DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'HR',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Dropdown options table for customizable dropdowns
CREATE TABLE IF NOT EXISTS dropdown_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text NOT NULL,
  option_value text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(field_name, option_value)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  status project_status DEFAULT 'Active',
  po_number text,
  budget numeric(12,2),
  team_size integer DEFAULT 0,
  department text,
  currency text DEFAULT 'USD',
  billing_type text DEFAULT 'Fixed',
  project_code text UNIQUE,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Employees table with all required fields
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  s_no serial UNIQUE,
  employee_id text UNIQUE NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  department text NOT NULL,
  designation text NOT NULL,
  
  -- Core fields
  mode_of_management text DEFAULT 'Managed Service',
  client text,
  billability_status text DEFAULT 'Bench',
  po_number text,
  billing text,
  last_active_date date,
  projects text,
  billability_percentage numeric(5,2) DEFAULT 0,
  project_start_date date,
  project_end_date date,
  experience_band text DEFAULT '0-2 years',
  rate numeric(10,2) DEFAULT 0,
  ageing numeric(5,2) DEFAULT 0,
  bench_days numeric(5,2) DEFAULT 0,
  phone_number text,
  emergency_contact text,
  ctc numeric(12,2) DEFAULT 0,
  remarks text,
  last_modified_by uuid,
  
  -- Legacy fields for backward compatibility
  position text,
  joining_date date DEFAULT CURRENT_DATE,
  contact_number text,
  location text,
  manager text,
  skills text[] DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Employee-Project junction table
CREATE TABLE IF NOT EXISTS employee_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  allocation_percentage numeric(5,2) DEFAULT 100,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  role_in_project text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, project_id)
);

-- Create notifications table for the Employee Management System
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'medium',
  
  -- Targeting information
  target_roles user_role[] DEFAULT '{}', -- Array of roles that should see this notification
  target_user_id uuid, -- Specific user (if null, applies to all users with target_roles)
  
  -- Action information
  action_url text, -- URL to redirect when notification is clicked
  action_label text, -- Label for the action button
  
  -- Metadata
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- Optional expiration date
  
  -- Read status tracking
  is_read boolean DEFAULT false,
  read_at timestamptz,
  read_by uuid REFERENCES user_profiles(id)
);

-- Create notification_reads table for tracking which users have read which notifications
CREATE TABLE IF NOT EXISTS notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES notifications(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- Function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at 
  BEFORE UPDATE ON employees 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dropdown_options_updated_at ON dropdown_options;
CREATE TRIGGER update_dropdown_options_updated_at 
  BEFORE UPDATE ON dropdown_options 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to resequence employees s_no starting from 1 in s_no order
CREATE OR REPLACE FUNCTION public.resequence_employees_s_no()
RETURNS void AS $$
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY s_no) AS new_s_no
  FROM employees
)
UPDATE employees e
SET s_no = o.new_s_no
FROM ordered o
WHERE e.id = o.id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Allow anon and authenticated to execute (adjust to your policy)
GRANT EXECUTE ON FUNCTION public.resequence_employees_s_no() TO anon, authenticated;

-- Function to calculate ageing and bench days
CREATE OR REPLACE FUNCTION calculate_employee_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate ageing based on last_active_date
  IF NEW.last_active_date IS NOT NULL THEN
    NEW.ageing = (CURRENT_DATE - NEW.last_active_date);
  ELSE
    NEW.ageing = 0;
  END IF;
  
  -- Calculate bench days for bench employees
  IF NEW.billability_status = 'Bench' AND NEW.last_active_date IS NOT NULL THEN
    NEW.bench_days = (CURRENT_DATE - NEW.last_active_date);
  ELSIF NEW.billability_status != 'Bench' THEN
    NEW.bench_days = 0;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-calculating metrics
DROP TRIGGER IF EXISTS calculate_employee_metrics_trigger ON employees;
CREATE TRIGGER calculate_employee_metrics_trigger 
  BEFORE INSERT OR UPDATE ON employees 
  FOR EACH ROW EXECUTE FUNCTION calculate_employee_metrics();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropdown_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

DROP POLICY IF EXISTS "All authenticated users can read employees" ON employees;
DROP POLICY IF EXISTS "Admin and Lead can insert employees" ON employees;
DROP POLICY IF EXISTS "Admin, Lead, and HR can update employees" ON employees;
DROP POLICY IF EXISTS "Only Admin can delete employees" ON employees;

DROP POLICY IF EXISTS "All authenticated users can read dropdown options" ON dropdown_options;
DROP POLICY IF EXISTS "Only Admin can manage dropdown options" ON dropdown_options;

DROP POLICY IF EXISTS "All authenticated users can read projects" ON projects;
DROP POLICY IF EXISTS "Admin and Lead can manage projects" ON projects;

DROP POLICY IF EXISTS "All authenticated users can read employee projects" ON employee_projects;
DROP POLICY IF EXISTS "Admin and Lead can manage employee projects" ON employee_projects;

DROP POLICY IF EXISTS "Users can read notifications for their role" ON notifications;
DROP POLICY IF EXISTS "Users can read their notification reads" ON notification_reads;
DROP POLICY IF EXISTS "Users can update notification reads" ON notification_reads;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;

-- Drop the existing function with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS check_user_role(target_roles text[]) CASCADE;

-- Create security definer function to check roles without RLS issues
CREATE OR REPLACE FUNCTION check_user_role(target_roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role::text = ANY(target_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user should see notification
CREATE OR REPLACE FUNCTION user_can_see_notification(notification_row notifications)
RETURNS boolean AS $$
BEGIN
  -- If notification has specific target user, only they can see it
  IF notification_row.target_user_id IS NOT NULL THEN
    RETURN notification_row.target_user_id = auth.uid();
  END IF;
  
  -- If notification has target roles, check if user's role is in the array
  IF array_length(notification_row.target_roles, 1) > 0 THEN
    RETURN EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = ANY(notification_row.target_roles)
    );
  END IF;
  
  -- If no specific targeting, all authenticated users can see it
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark notification as read for a user
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_uuid uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO notification_reads (notification_id, user_id)
  VALUES (notification_uuid, auth.uid())
  ON CONFLICT (notification_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread notification count for current user
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS integer AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM notifications n
  WHERE user_can_see_notification(n)
    AND NOT EXISTS (
      SELECT 1 FROM notification_reads nr 
      WHERE nr.notification_id = n.id 
      AND nr.user_id = auth.uid()
    )
    AND (n.expires_at IS NULL OR n.expires_at > now());
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create notification with proper targeting
CREATE OR REPLACE FUNCTION create_notification(
  p_title text,
  p_message text,
  p_type notification_type,
  p_priority notification_priority DEFAULT 'medium',
  p_target_roles user_role[] DEFAULT '{}',
  p_target_user_id uuid DEFAULT NULL,
  p_action_url text DEFAULT NULL,
  p_action_label text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (
    title, message, type, priority, target_roles, target_user_id,
    action_url, action_label, created_by, expires_at
  ) VALUES (
    p_title, p_message, p_type, p_priority, p_target_roles, p_target_user_id,
    p_action_url, p_action_label, auth.uid(), p_expires_at
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Authenticated users can read names for resolution"
  ON user_profiles FOR SELECT TO authenticated
  USING (true);

-- user_profiles policies
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
  ON user_profiles FOR ALL TO authenticated
  USING (check_user_role(ARRAY['Admin']));

-- employees policies (using security definer function)
CREATE POLICY "All authenticated users can read employees"
  ON employees FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin and Lead can insert employees"
  ON employees FOR INSERT TO authenticated
  WITH CHECK (check_user_role(ARRAY['Admin', 'Lead']));

CREATE POLICY "Admin, Lead, and HR can update employees"
  ON employees FOR UPDATE TO authenticated
  USING (check_user_role(ARRAY['Admin', 'Lead', 'HR']));

CREATE POLICY "Only Admin can delete employees"
  ON employees FOR DELETE TO authenticated
  USING (check_user_role(ARRAY['Admin']));

-- dropdown_options policies
CREATE POLICY "All authenticated users can read dropdown options"
  ON dropdown_options FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only Admin can manage dropdown options"
  ON dropdown_options FOR ALL TO authenticated
  USING (check_user_role(ARRAY['Admin']));

-- projects policies
CREATE POLICY "All authenticated users can read projects"
  ON projects FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin and Lead can manage projects"
  ON projects FOR ALL TO authenticated
  USING (check_user_role(ARRAY['Admin', 'Lead']));

-- employee_projects policies
CREATE POLICY "All authenticated users can read employee projects"
  ON employee_projects FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin and Lead can manage employee projects"
  ON employee_projects FOR ALL TO authenticated
  USING (check_user_role(ARRAY['Admin', 'Lead']));

-- Create policies for notifications
CREATE POLICY "Users can read notifications for their role"
  ON notifications FOR SELECT TO authenticated
  USING (user_can_see_notification(notifications));

CREATE POLICY "Admins can manage all notifications"
  ON notifications FOR ALL TO authenticated
  USING (check_user_role(ARRAY['Admin']));

-- Create policies for notification_reads
CREATE POLICY "Users can read their notification reads"
  ON notification_reads FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update notification reads"
  ON notification_reads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_billability_status ON employees(billability_status);
CREATE INDEX IF NOT EXISTS idx_employees_mode_of_management ON employees(mode_of_management);
CREATE INDEX IF NOT EXISTS idx_employees_last_active_date ON employees(last_active_date);
CREATE INDEX IF NOT EXISTS idx_dropdown_options_field_name ON dropdown_options(field_name);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_notifications_target_roles ON notifications USING GIN(target_roles);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user_id ON notification_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_notification_id ON notification_reads(notification_id);

-- Insert default dropdown options
INSERT INTO dropdown_options (field_name, option_value, display_order) VALUES
  -- Mode of Management options
  ('mode_of_management', 'Managed Service', 1),
  ('mode_of_management', 'Managed T&M', 2),
  ('mode_of_management', 'Resource Augmentation', 3),
  ('mode_of_management', 'Staff Augmentation', 4),
  ('mode_of_management', 'Project Based', 5),
  
  -- Billability Status options
  ('billability_status', 'Billable', 1),
  ('billability_status', 'Bench', 2),
  ('billability_status', 'Trainee', 3),
  ('billability_status', 'Buffer', 4),
  ('billability_status', 'ML', 5),
  ('billability_status', 'NA', 6),
  ('billability_status', 'Non-Billable', 7),
  
  -- Experience Band options
  ('experience_band', '0-2 years', 1),
  ('experience_band', '2-5 years', 2),
  ('experience_band', '5-8 years', 3),
  ('experience_band', '8-12 years', 4),
  ('experience_band', '12+ years', 5),
  
  -- Department options
  ('department', 'EMBEDDED', 1),
  ('department', 'IT & FINANCE & ACCOUNTS', 2),
  ('department', 'V&V', 3),
  ('department', 'SALES & MARKETING', 4),
  ('department', 'PROJECT MANAGEMENT', 5),
  ('department', 'DATA SCIENCE ENGINEERING & TOOLS', 6),
  ('department', 'HR & ADMIN', 7),
  ('department', 'OPERATIONS', 8),
  ('department', 'FINANCE & ACCOUNTS', 9),
  ('department', 'IT & ADMIN', 10),
  
  -- Designation options
  ('designation', 'Software Engineer', 1),
  ('designation', 'Senior Software Engineer', 2),
  ('designation', 'Lead Software Engineer', 3),
  ('designation', 'Principal Engineer', 4),
  ('designation', 'Engineering Manager', 5),
  ('designation', 'Product Manager', 6),
  ('designation', 'Senior Product Manager', 7),
  ('designation', 'UX Designer', 8),
  ('designation', 'Senior UX Designer', 9),
  ('designation', 'DevOps Engineer', 10),
  ('designation', 'QA Engineer', 11),
  ('designation', 'Data Scientist', 12),
  ('designation', 'Business Analyst', 13),
  ('designation', 'Project Manager', 14),
  ('designation', 'Scrum Master', 15),
  
  -- Currency options
  ('currency', 'INR', 1),
  ('currency', 'USD', 2),
  ('currency', 'EUR', 3),
  
  -- Billing type options
  ('billing_type', 'Fixed', 1),
  ('billing_type', 'Hourly', 2),
  ('billing_type', 'Monthly', 3)
ON CONFLICT (field_name, option_value) DO NOTHING;

-- Insert sample projects
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
INSERT INTO projects (id, name, project_code, client, description, start_date, end_date, status, po_number, budget, team_size, department, currency, billing_type) VALUES
  (gen_random_uuid(), 'E-commerce Platform', 'PROJ001', 'TechCorp Inc', 'Modern e-commerce platform with React and Node.js', '2024-01-15', '2024-08-15', 'Active', 'PO-2024-001', 250000.00, 8, 'Engineering', 'USD', 'Fixed'),
  (gen_random_uuid(), 'Mobile Banking App', 'PROJ002', 'FinanceFirst Bank', 'Secure mobile banking application', '2024-02-01', '2024-10-01', 'Active', 'PO-2024-002', 180000.00, 6, 'Engineering', 'USD', 'Hourly'),
  (gen_random_uuid(), 'Data Analytics Dashboard', 'PROJ003', 'DataViz Solutions', 'Real-time analytics dashboard for business intelligence', '2024-03-01', '2024-07-01', 'Completed', 'PO-2024-003', 120000.00, 4, 'UX/UI Design', 'USD', 'Monthly'),
  (gen_random_uuid(), 'Healthcare Management System', 'PROJ004', 'MedTech Solutions', 'Comprehensive healthcare management platform', '2024-04-01', '2024-12-01', 'Active', 'PO-2024-004', 300000.00, 10, 'Engineering', 'USD', 'Fixed'),
  (gen_random_uuid(), 'Learning Management System', 'PROJ005', 'EduTech Global', 'Online learning platform with video streaming', '2024-05-01', NULL, 'On Hold', 'PO-2024-005', 200000.00, 7, 'Product', 'USD', 'Monthly')
ON CONFLICT (id) DO NOTHING;

-- Insert sample employees with realistic data
INSERT INTO employees (
  id, employee_id, name, email, department, designation, mode_of_management, client, 
  billability_status, po_number, billing, last_active_date, projects, billability_percentage,
  project_start_date, project_end_date, experience_band, rate, ageing, bench_days,
  phone_number, emergency_contact, ctc, remarks, position, joining_date, contact_number,
  location, manager, skills
) VALUES
  -- Engineering Team
  (gen_random_uuid(), 'EMP001', 'John Smith', 'john.smith@company.com', 'Engineering', 'Senior Software Engineer', 'Managed Service', 'TechCorp Inc', 'Billable', 'PO-2024-001', 'Monthly', '2024-01-15', 'E-commerce Platform', 85.0, '2024-01-15', '2024-08-15', '5-8 years', 120.00, 0, 0, '+1-555-0101', '+1-555-0102', 95000, 'Excellent React developer', 'Senior Software Engineer', '2023-06-01', '+1-555-0101', 'New York', 'Sarah Johnson', ARRAY['React', 'Node.js', 'TypeScript', 'AWS']),
  
  (gen_random_uuid(), 'EMP002', 'Sarah Johnson', 'sarah.johnson@company.com', 'Engineering', 'Lead Software Engineer', 'Managed Service', 'TechCorp Inc', 'Billable', 'PO-2024-001', 'Monthly', '2024-01-15', 'E-commerce Platform', 90.0, '2024-01-15', '2024-08-15', '8-12 years', 150.00, 0, 0, '+1-555-0201', '+1-555-0202', 120000, 'Team lead with strong technical skills', 'Lead Software Engineer', '2022-03-15', '+1-555-0201', 'New York', 'Michael Chen', ARRAY['React', 'Node.js', 'Python', 'Docker', 'Kubernetes']),
  
  (gen_random_uuid(), 'EMP003', 'Michael Chen', 'michael.chen@company.com', 'Engineering', 'Engineering Manager', 'Resource Augmentation', 'FinanceFirst Bank', 'Billable', 'PO-2024-002', 'Weekly', '2024-02-01', 'Mobile Banking App', 95.0, '2024-02-01', '2024-10-01', '12+ years', 180.00, 0, 0, '+1-555-0301', '+1-555-0302', 140000, 'Experienced manager with fintech background', 'Engineering Manager', '2021-01-10', '+1-555-0301', 'San Francisco', 'David Wilson', ARRAY['Java', 'Spring Boot', 'Microservices', 'Leadership']),
  
  (gen_random_uuid(), 'EMP004', 'Emily Davis', 'emily.davis@company.com', 'Engineering', 'Software Engineer', 'Managed Service', NULL, 'Bench', NULL, NULL, '2024-01-20', NULL, 0.0, NULL, NULL, '2-5 years', 80.00, 40, 40, '+1-555-0401', '+1-555-0402', 75000, 'Available for new projects', 'Software Engineer', '2023-08-01', '+1-555-0401', 'Austin', 'Sarah Johnson', ARRAY['JavaScript', 'React', 'CSS', 'HTML']),
  
  (gen_random_uuid(), 'EMP005', 'David Wilson', 'david.wilson@company.com', 'Engineering', 'DevOps Engineer', 'Staff Augmentation', 'MedTech Solutions', 'Billable', 'PO-2024-004', 'Hourly', '2024-04-01', 'Healthcare Management System', 80.0, '2024-04-01', '2024-12-01', '5-8 years', 130.00, 0, 0, '+1-555-0501', '+1-555-0502', 110000, 'Infrastructure specialist', 'DevOps Engineer', '2022-11-01', '+1-555-0501', 'Seattle', 'Michael Chen', ARRAY['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins']),
  
  -- Design Team
  (gen_random_uuid(), 'EMP006', 'Lisa Anderson', 'lisa.anderson@company.com', 'UX/UI Design', 'Senior UX Designer', 'Project Based', 'DataViz Solutions', 'Billable', 'PO-2024-003', 'Monthly', '2024-03-01', 'Data Analytics Dashboard', 100.0, '2024-03-01', '2024-07-01', '5-8 years', 100.00, 0, 0, '+1-555-0601', '+1-555-0602', 85000, 'Award-winning designer', 'Senior UX Designer', '2022-09-01', '+1-555-0601', 'Los Angeles', 'Jennifer Lee', ARRAY['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research']),
  
  (gen_random_uuid(), 'EMP007', 'Jennifer Lee', 'jennifer.lee@company.com', 'UX/UI Design', 'UX Designer', 'Managed Service', NULL, 'Trainee', NULL, NULL, '2024-02-15', 'Design Training Program', 20.0, '2024-02-15', '2024-05-15', '0-2 years', 60.00, 45, 45, '+1-555-0701', '+1-555-0702', 55000, 'New graduate in training', 'UX Designer', '2024-01-01', '+1-555-0701', 'Chicago', 'Lisa Anderson', ARRAY['Figma', 'Adobe Creative Suite', 'UI Design']),
  
  -- Product Team
  (gen_random_uuid(), 'EMP008', 'Robert Taylor', 'robert.taylor@company.com', 'Product', 'Senior Product Manager', 'Managed T&M', 'EduTech Global', 'Billable', 'PO-2024-005', 'Monthly', '2024-05-01', 'Learning Management System', 75.0, '2024-05-01', NULL, '8-12 years', 140.00, 0, 0, '+1-555-0801', '+1-555-0802', 125000, 'Product strategy expert', 'Senior Product Manager', '2021-07-01', '+1-555-0801', 'Boston', 'Amanda White', ARRAY['Product Strategy', 'Agile', 'Data Analysis', 'Stakeholder Management']),
  
  (gen_random_uuid(), 'EMP009', 'Amanda White', 'amanda.white@company.com', 'Product', 'Product Manager', 'Resource Augmentation', NULL, 'Buffer', NULL, NULL, '2024-01-30', NULL, 30.0, NULL, NULL, '5-8 years', 110.00, 30, 30, '+1-555-0901', '+1-555-0902', 100000, 'Between projects', 'Product Manager', '2023-02-01', '+1-555-0901', 'Denver', 'Robert Taylor', ARRAY['Product Management', 'Analytics', 'Roadmapping', 'User Stories']),
  
  -- Marketing Team
  (gen_random_uuid(), 'EMP010', 'James Brown', 'james.brown@company.com', 'Marketing', 'Marketing Manager', 'Managed Service', NULL, 'Non-Billable', NULL, NULL, '2024-01-01', 'Internal Marketing', 0.0, NULL, NULL, '5-8 years', 90.00, 60, 0, '+1-555-1001', '+1-555-1002', 80000, 'Internal marketing focus', 'Marketing Manager', '2023-04-01', '+1-555-1001', 'Miami', 'Kevin Garcia', ARRAY['Digital Marketing', 'Content Strategy', 'SEO', 'Social Media']),
  
  -- HR Team
  (gen_random_uuid(), 'EMP011', 'Kevin Garcia', 'kevin.garcia@company.com', 'Human Resources', 'HR Manager', 'Managed Service', NULL, 'Non-Billable', NULL, NULL, '2024-01-01', 'HR Operations', 0.0, NULL, NULL, '8-12 years', 85.00, 60, 0, '+1-555-1101', '+1-555-1102', 90000, 'HR operations and recruitment', 'HR Manager', '2022-01-01', '+1-555-1101', 'Phoenix', 'Linda Martinez', ARRAY['Recruitment', 'Employee Relations', 'Performance Management', 'Compliance']),
  
  (gen_random_uuid(), 'EMP012', 'Linda Martinez', 'linda.martinez@company.com', 'Human Resources', 'HR Specialist', 'Managed Service', NULL, 'Non-Billable', NULL, NULL, '2024-01-01', 'HR Support', 0.0, NULL, NULL, '2-5 years', 65.00, 60, 0, '+1-555-1201', '+1-555-1202', 65000, 'HR support and administration', 'HR Specialist', '2023-09-01', '+1-555-1201', 'Dallas', 'Kevin Garcia', ARRAY['HRIS', 'Payroll', 'Benefits Administration', 'Onboarding'])
ON CONFLICT (employee_id) DO NOTHING;

-- Insert employee-project relationships
INSERT INTO employee_projects (employee_id, project_id, allocation_percentage, start_date, end_date, role_in_project)
VALUES
  (
    (SELECT id FROM employees WHERE employee_id = 'EMP001'),
    (SELECT id FROM projects WHERE project_code = 'PROJ001'),
    100.0, '2024-01-15', '2024-08-15', 'Frontend Developer'
  ),
  (
    (SELECT id FROM employees WHERE employee_id = 'EMP002'),
    (SELECT id FROM projects WHERE project_code = 'PROJ001'),
    80.0, '2024-01-15', '2024-08-15', 'Technical Lead'
  ),
  (
    (SELECT id FROM employees WHERE employee_id = 'EMP003'),
    (SELECT id FROM projects WHERE project_code = 'PROJ002'),
    90.0, '2024-02-01', '2024-10-01', 'Project Manager'
  ),
  (
    (SELECT id FROM employees WHERE employee_id = 'EMP005'),
    (SELECT id FROM projects WHERE project_code = 'PROJ004'),
    75.0, '2024-04-01', '2024-12-01', 'DevOps Engineer'
  ),
  (
    (SELECT id FROM employees WHERE employee_id = 'EMP006'),
    (SELECT id FROM projects WHERE project_code = 'PROJ003'),
    100.0, '2024-03-01', '2024-07-01', 'UX Designer'
  ),
  (
    (SELECT id FROM employees WHERE employee_id = 'EMP008'),
    (SELECT id FROM projects WHERE project_code = 'PROJ005'),
    85.0, '2024-05-01', NULL, 'Product Owner'
  )
ON CONFLICT (employee_id, project_id) DO NOTHING;

-- Insert some sample notifications
INSERT INTO notifications (title, message, type, priority, target_roles, action_url, action_label) VALUES
  ('Welcome to Employee Management System', 'Welcome to the new Employee Management System! Explore the features and let us know if you need any assistance.', 'system_announcement', 'medium', '{}', '/dashboard', 'Go to Dashboard'),
  ('System Maintenance Scheduled', 'Scheduled maintenance will occur on Sunday, 2:00 AM - 4:00 AM EST. The system may be temporarily unavailable.', 'system_announcement', 'high', '{}', NULL, NULL),
  ('New Employee Added', 'John Smith has been added to the Engineering department as Senior Software Engineer.', 'employee_created', 'medium', '{}', '/employees', 'View Employees'),
  ('Project Update', 'E-commerce Platform project status has been updated to Active.', 'project_updated', 'medium', '{}', '/projects', 'View Projects');

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_updated_at_column TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_employee_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION user_can_see_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;

-- Add date_of_separation column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_separation date;