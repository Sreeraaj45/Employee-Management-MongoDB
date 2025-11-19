-- Clear and Seed Employee Management System Database
-- Run this in your SQL editor to clear existing data and insert comprehensive dummy data

-- 1. Fix the sequence function to handle empty tables properly
CREATE OR REPLACE FUNCTION public.resequence_employees_s_no()
RETURNS void AS $$
BEGIN
    -- Only resequence if there are employees
    IF EXISTS (SELECT 1 FROM employees LIMIT 1) THEN
        WITH ordered AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY s_no) AS new_s_no
            FROM employees
        )
        UPDATE employees e
        SET s_no = o.new_s_no
        FROM ordered o
        WHERE e.id = o.id;
    ELSE
        -- Reset sequence to 1 when no employees exist
        ALTER SEQUENCE employees_s_no_seq RESTART WITH 1;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Clear existing data (in correct order due to foreign key constraints)
DELETE FROM notification_reads;
DELETE FROM notifications;
DELETE FROM employee_projects;
DELETE FROM employees;
DELETE FROM projects;
DELETE FROM dropdown_options;

-- 3. Reset sequence
ALTER SEQUENCE employees_s_no_seq RESTART WITH 1;

-- 4. Insert dropdown options
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
  ('department', 'Engineering', 1),
  ('department', 'Embedded Systems', 2),
  ('department', 'UX/UI Design', 3),
  ('department', 'Product', 4),
  ('department', 'Marketing', 5),
  ('department', 'Sales', 6),
  ('department', 'Human Resources', 7),
  ('department', 'IT & Finance', 8),
  ('department', 'Verification & Validation', 9),
  ('department', 'Data Science & Engineering', 10),
  ('department', 'Finance & Accounting', 11),
  ('department', 'IT Administration', 12),
  ('department', 'Operations', 13),
  
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
  ('designation', 'Scrum Master', 15);

-- 5. Insert comprehensive projects (without budget column)
INSERT INTO projects (id, name, project_code, client, description, start_date, end_date, status, po_number, team_size, department, currency, billing_type) VALUES
  (gen_random_uuid(), 'E-commerce Platform', 'PROJ001', 'TechCorp Inc', 'Modern e-commerce platform with React and Node.js', '2024-01-15', '2024-08-15', 'Active', 'PO-2024-001', 8, 'Engineering', 'USD', 'Fixed'),
  (gen_random_uuid(), 'Mobile Banking App', 'PROJ002', 'FinanceFirst Bank', 'Secure mobile banking application', '2024-02-01', '2024-10-01', 'Active', 'PO-2024-002', 6, 'Engineering', 'USD', 'Hourly'),
  (gen_random_uuid(), 'Data Analytics Dashboard', 'PROJ003', 'DataViz Solutions', 'Real-time analytics dashboard for business intelligence', '2024-03-01', '2024-07-01', 'Completed', 'PO-2024-003', 4, 'UX/UI Design', 'USD', 'Monthly'),
  (gen_random_uuid(), 'Healthcare Management System', 'PROJ004', 'MedTech Solutions', 'Comprehensive healthcare management platform', '2024-04-01', '2024-12-01', 'Active', 'PO-2024-004', 10, 'Engineering', 'USD', 'Fixed'),
  (gen_random_uuid(), 'Learning Management System', 'PROJ005', 'EduTech Global', 'Online learning platform with video streaming', '2024-05-01', NULL, 'On Hold', 'PO-2024-005', 7, 'Product', 'USD', 'Monthly'),
  (gen_random_uuid(), 'AI Chatbot Platform', 'PROJ006', 'AI Solutions Ltd', 'Intelligent chatbot for customer support', '2024-06-01', '2024-11-01', 'Active', 'PO-2024-006', 5, 'Engineering', 'USD', 'Fixed'),
  (gen_random_uuid(), 'Marketing Automation Tool', 'PROJ007', 'MarketingPro Inc', 'Automated marketing campaign management', '2024-07-01', '2024-12-01', 'Active', 'PO-2024-007', 4, 'Marketing', 'USD', 'Hourly'),
  (gen_random_uuid(), 'Blockchain Wallet', 'PROJ008', 'CryptoFinance Corp', 'Secure cryptocurrency wallet application', '2024-08-01', NULL, 'Active', 'PO-2024-008', 6, 'Engineering', 'USD', 'Fixed');

-- 6. Insert comprehensive employees with diverse metrics (using only core fields)
INSERT INTO employees (
  id, employee_id, name, email, department, designation, mode_of_management, client, 
  billability_status, po_number, billing, last_active_date, projects, billability_percentage,
  project_start_date, project_end_date, experience_band, rate, ageing, bench_days,
  phone_number, emergency_contact, ctc, remarks, last_modified_by
) VALUES
  -- Engineering Team - Billable Employees
  (gen_random_uuid(), 'EMP001', 'John Smith', 'john.smith@company.com', 'Engineering', 'Senior Software Engineer', 'Managed Service', 'TechCorp Inc', 'Billable', 'PO-2024-001', '$120/hour', '2024-01-15', 'E-commerce Platform', 85.0, '2024-01-15', '2024-08-15', '5-8 years', 120.00, 0, 0, '+1-555-0101', '+1-555-0102', 95000, 'Excellent React developer', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP002', 'Sarah Johnson', 'sarah.johnson@company.com', 'Engineering', 'Lead Software Engineer', 'Managed Service', 'TechCorp Inc', 'Billable', 'PO-2024-001', '$150/hour', '2024-01-15', 'E-commerce Platform', 90.0, '2024-01-15', '2024-08-15', '8-12 years', 150.00, 0, 0, '+1-555-0201', '+1-555-0202', 120000, 'Team lead with strong technical skills', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP003', 'Michael Chen', 'michael.chen@company.com', 'Engineering', 'Engineering Manager', 'Resource Augmentation', 'FinanceFirst Bank', 'Billable', 'PO-2024-002', '$180/hour', '2024-02-01', 'Mobile Banking App', 95.0, '2024-02-01', '2024-10-01', '12+ years', 180.00, 0, 0, '+1-555-0301', '+1-555-0302', 140000, 'Experienced manager with fintech background', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP004', 'David Wilson', 'david.wilson@company.com', 'Engineering', 'DevOps Engineer', 'Staff Augmentation', 'MedTech Solutions', 'Billable', 'PO-2024-004', '$130/hour', '2024-04-01', 'Healthcare Management System', 80.0, '2024-04-01', '2024-12-01', '5-8 years', 130.00, 0, 0, '+1-555-0501', '+1-555-0502', 110000, 'Infrastructure specialist', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP005', 'Alex Rodriguez', 'alex.rodriguez@company.com', 'Engineering', 'Software Engineer', 'Managed Service', 'AI Solutions Ltd', 'Billable', 'PO-2024-006', '$100/hour', '2024-06-01', 'AI Chatbot Platform', 75.0, '2024-06-01', '2024-11-01', '2-5 years', 100.00, 0, 0, '+1-555-0601', '+1-555-0602', 85000, 'AI/ML specialist', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP006', 'Emma Thompson', 'emma.thompson@company.com', 'Engineering', 'Senior Software Engineer', 'Project Based', 'CryptoFinance Corp', 'Billable', 'PO-2024-008', '$140/hour', '2024-08-01', 'Blockchain Wallet', 90.0, '2024-08-01', NULL, '5-8 years', 140.00, 0, 0, '+1-555-0701', '+1-555-0702', 105000, 'Blockchain expert', '550e8400-e29b-41d4-a716-446655440001'),
  
  -- Engineering Team - Bench Employees
  (gen_random_uuid(), 'EMP007', 'Emily Davis', 'emily.davis@company.com', 'Engineering', 'Software Engineer', 'Managed Service', NULL, 'Bench', NULL, NULL, '2024-01-20', NULL, 0.0, NULL, NULL, '2-5 years', 80.00, 45, 45, '+1-555-0401', '+1-555-0402', 75000, 'Available for new projects', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP008', 'James Wilson', 'james.wilson@company.com', 'Engineering', 'QA Engineer', 'Resource Augmentation', NULL, 'Bench', NULL, NULL, '2024-02-10', NULL, 0.0, NULL, NULL, '2-5 years', 70.00, 35, 35, '+1-555-0801', '+1-555-0802', 70000, 'QA specialist available', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP009', 'Sophie Brown', 'sophie.brown@company.com', 'Engineering', 'Data Scientist', 'Staff Augmentation', NULL, 'Bench', NULL, NULL, '2024-03-05', NULL, 0.0, NULL, NULL, '5-8 years', 110.00, 25, 25, '+1-555-0901', '+1-555-0902', 95000, 'Data science expert', '550e8400-e29b-41d4-a716-446655440001'),
  
  -- Design Team
  (gen_random_uuid(), 'EMP010', 'Lisa Anderson', 'lisa.anderson@company.com', 'UX/UI Design', 'Senior UX Designer', 'Project Based', 'DataViz Solutions', 'Billable', 'PO-2024-003', '$100/hour', '2024-03-01', 'Data Analytics Dashboard', 100.0, '2024-03-01', '2024-07-01', '5-8 years', 100.00, 0, 0, '+1-555-1001', '+1-555-1002', 85000, 'Award-winning designer', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP011', 'Jennifer Lee', 'jennifer.lee@company.com', 'UX/UI Design', 'UX Designer', 'Managed Service', NULL, 'Trainee', NULL, NULL, '2024-02-15', 'Design Training Program', 20.0, '2024-02-15', '2024-05-15', '0-2 years', 60.00, 45, 45, '+1-555-1101', '+1-555-1102', 55000, 'New graduate in training', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP012', 'Mark Davis', 'mark.davis@company.com', 'UX/UI Design', 'UI Designer', 'Managed Service', NULL, 'Bench', NULL, NULL, '2024-01-25', NULL, 0.0, NULL, NULL, '2-5 years', 75.00, 40, 40, '+1-555-1201', '+1-555-1202', 65000, 'UI specialist', '550e8400-e29b-41d4-a716-446655440001'),
  
  -- Product Team
  (gen_random_uuid(), 'EMP013', 'Robert Taylor', 'robert.taylor@company.com', 'Product', 'Senior Product Manager', 'Managed T&M', 'EduTech Global', 'Billable', 'PO-2024-005', '$140/hour', '2024-05-01', 'Learning Management System', 75.0, '2024-05-01', NULL, '8-12 years', 140.00, 0, 0, '+1-555-1301', '+1-555-1302', 125000, 'Product strategy expert', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP014', 'Amanda White', 'amanda.white@company.com', 'Product', 'Product Manager', 'Resource Augmentation', NULL, 'Buffer', NULL, NULL, '2024-01-30', NULL, 30.0, NULL, NULL, '5-8 years', 110.00, 30, 30, '+1-555-1401', '+1-555-1402', 100000, 'Between projects', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP015', 'Chris Johnson', 'chris.johnson@company.com', 'Product', 'Business Analyst', 'Staff Augmentation', NULL, 'Bench', NULL, NULL, '2024-02-20', NULL, 0.0, NULL, NULL, '2-5 years', 85.00, 35, 35, '+1-555-1501', '+1-555-1502', 75000, 'Business analysis specialist', '550e8400-e29b-41d4-a716-446655440001'),
  
  -- Marketing Team
  (gen_random_uuid(), 'EMP016', 'James Brown', 'james.brown@company.com', 'Marketing', 'Marketing Manager', 'Managed Service', NULL, 'Non-Billable', NULL, NULL, '2024-01-01', 'Internal Marketing', 0.0, NULL, NULL, '5-8 years', 90.00, 60, 0, '+1-555-1601', '+1-555-1602', 80000, 'Internal marketing focus', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP017', 'Sarah Miller', 'sarah.miller@company.com', 'Marketing', 'Digital Marketing Specialist', 'Project Based', 'MarketingPro Inc', 'Billable', 'PO-2024-007', '$80/hour', '2024-07-01', 'Marketing Automation Tool', 85.0, '2024-07-01', '2024-12-01', '2-5 years', 80.00, 0, 0, '+1-555-1701', '+1-555-1702', 70000, 'Digital marketing expert', '550e8400-e29b-41d4-a716-446655440001'),
  
  -- HR Team
  (gen_random_uuid(), 'EMP018', 'Kevin Garcia', 'kevin.garcia@company.com', 'Human Resources', 'HR Manager', 'Managed Service', NULL, 'Non-Billable', NULL, NULL, '2024-01-01', 'HR Operations', 0.0, NULL, NULL, '8-12 years', 85.00, 60, 0, '+1-555-1801', '+1-555-1802', 90000, 'HR operations and recruitment', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP019', 'Linda Martinez', 'linda.martinez@company.com', 'Human Resources', 'HR Specialist', 'Managed Service', NULL, 'Non-Billable', NULL, NULL, '2024-01-01', 'HR Support', 0.0, NULL, NULL, '2-5 years', 65.00, 60, 0, '+1-555-1901', '+1-555-1902', 65000, 'HR support and administration', '550e8400-e29b-41d4-a716-446655440001'),
  
  -- Finance Team
  (gen_random_uuid(), 'EMP020', 'David Kim', 'david.kim@company.com', 'Finance & Accounting', 'Financial Analyst', 'Managed Service', NULL, 'Non-Billable', NULL, NULL, '2024-01-01', 'Financial Analysis', 0.0, NULL, NULL, '5-8 years', 95.00, 60, 0, '+1-555-2001', '+1-555-2002', 85000, 'Financial analysis and reporting', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP021', 'Maria Rodriguez', 'maria.rodriguez@company.com', 'Finance & Accounting', 'Finance Manager', 'Managed Service', NULL, 'Non-Billable', NULL, NULL, '2024-01-01', 'Finance Operations', 0.0, NULL, NULL, '8-12 years', 110.00, 60, 0, '+1-555-2101', '+1-555-2102', 100000, 'Finance operations and planning', '550e8400-e29b-41d4-a716-446655440001'),
  
  -- Operations Team
  (gen_random_uuid(), 'EMP022', 'Tom Wilson', 'tom.wilson@company.com', 'Operations', 'Operations Manager', 'Managed Service', NULL, 'Non-Billable', NULL, NULL, '2024-01-01', 'Operations Management', 0.0, NULL, NULL, '8-12 years', 100.00, 60, 0, '+1-555-2201', '+1-555-2202', 95000, 'Operations and process improvement', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP023', 'Anna Thompson', 'anna.thompson@company.com', 'Operations', 'Operations Specialist', 'Managed Service', NULL, 'Non-Billable', NULL, NULL, '2024-01-01', 'Operations Support', 0.0, NULL, NULL, '2-5 years', 70.00, 60, 0, '+1-555-2301', '+1-555-2302', 60000, 'Operations support and coordination', '550e8400-e29b-41d4-a716-446655440001'),
  
  -- Sales Team
  (gen_random_uuid(), 'EMP024', 'Mike Johnson', 'mike.johnson@company.com', 'Sales', 'Sales Manager', 'Managed Service', NULL, 'Non-Billable', NULL, NULL, '2024-01-01', 'Sales Operations', 0.0, NULL, NULL, '5-8 years', 120.00, 60, 0, '+1-555-2401', '+1-555-2402', 110000, 'Sales strategy and client relations', '550e8400-e29b-41d4-a716-446655440001'),
  
  (gen_random_uuid(), 'EMP025', 'Lisa Garcia', 'lisa.garcia@company.com', 'Sales', 'Sales Representative', 'Managed Service', NULL, 'Non-Billable', NULL, NULL, '2024-01-01', 'Sales Support', 0.0, NULL, NULL, '2-5 years', 75.00, 60, 0, '+1-555-2501', '+1-555-2502', 65000, 'Sales support and lead generation', '550e8400-e29b-41d4-a716-446655440001');

-- 7. Insert employee-project relationships
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
    (SELECT id FROM employees WHERE employee_id = 'EMP004'),
    (SELECT id FROM projects WHERE project_code = 'PROJ004'),
    75.0, '2024-04-01', '2024-12-01', 'DevOps Engineer'
  ),
  (
    (SELECT id FROM employees WHERE employee_id = 'EMP005'),
    (SELECT id FROM projects WHERE project_code = 'PROJ006'),
    100.0, '2024-06-01', '2024-11-01', 'AI Developer'
  ),
  (
    (SELECT id FROM employees WHERE employee_id = 'EMP006'),
    (SELECT id FROM projects WHERE project_code = 'PROJ008'),
    90.0, '2024-08-01', NULL, 'Blockchain Developer'
  ),
  (
    (SELECT id FROM employees WHERE employee_id = 'EMP010'),
    (SELECT id FROM projects WHERE project_code = 'PROJ003'),
    100.0, '2024-03-01', '2024-07-01', 'UX Designer'
  ),
  (
    (SELECT id FROM employees WHERE employee_id = 'EMP013'),
    (SELECT id FROM projects WHERE project_code = 'PROJ005'),
    85.0, '2024-05-01', NULL, 'Product Owner'
  ),
  (
    (SELECT id FROM employees WHERE employee_id = 'EMP017'),
    (SELECT id FROM projects WHERE project_code = 'PROJ007'),
    100.0, '2024-07-01', '2024-12-01', 'Marketing Specialist'
  );

-- 8. Insert sample notifications
INSERT INTO notifications (title, message, type, priority, target_roles, action_url, action_label) VALUES
  ('Welcome to Employee Management System', 'Welcome to the new Employee Management System! Explore the features and let us know if you need any assistance.', 'system_announcement', 'medium', '{}', '/dashboard', 'Go to Dashboard'),
  ('System Maintenance Scheduled', 'Scheduled maintenance will occur on Sunday, 2:00 AM - 4:00 AM EST. The system may be temporarily unavailable.', 'system_announcement', 'high', '{}', NULL, NULL),
  ('New Employee Added', 'John Smith has been added to the Engineering department as Senior Software Engineer.', 'employee_created', 'medium', '{}', '/employees', 'View Employees'),
  ('Project Update', 'E-commerce Platform project status has been updated to Active.', 'project_updated', 'medium', '{}', '/projects', 'View Projects'),
  ('Bench Employee Alert', 'Emily Davis has been on bench for 45 days. Consider assigning to a new project.', 'employee_updated', 'high', '{}', '/employees', 'View Employees'),
  ('Financial Report Available', 'Monthly financial report is now available for review.', 'system_announcement', 'medium', '{}', '/financial', 'View Financial Dashboard');

-- 9. Display summary of inserted data
SELECT 'Data Insertion Summary' as summary;

SELECT 'Employees by Department' as category, department, COUNT(*) as count 
FROM employees 
GROUP BY department 
ORDER BY count DESC;

SELECT 'Employees by Billability Status' as category, billability_status, COUNT(*) as count 
FROM employees 
GROUP BY billability_status 
ORDER BY count DESC;

SELECT 'Projects by Status' as category, status, COUNT(*) as count 
FROM projects 
GROUP BY status 
ORDER BY count DESC;

SELECT 'Total Metrics' as category, 
  (SELECT COUNT(*) FROM employees) as total_employees,
  (SELECT COUNT(*) FROM projects) as total_projects,
  (SELECT COUNT(*) FROM employee_projects) as total_assignments,
  (SELECT COUNT(*) FROM notifications) as total_notifications;