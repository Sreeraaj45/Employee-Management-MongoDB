-- Add billing_type and billing_rate columns to employee_projects table
-- This fixes the issue where bulk upload fails to save billing information

ALTER TABLE IF EXISTS employee_projects
ADD COLUMN IF NOT EXISTS billing_type text DEFAULT 'Monthly',
ADD COLUMN IF NOT EXISTS billing_rate numeric(10,2) DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN employee_projects.billing_type IS 'Billing type for this specific employee-project assignment (Monthly, Fixed, Hourly, Daily)';
COMMENT ON COLUMN employee_projects.billing_rate IS 'Billing rate for this specific employee-project assignment';

-- Optional: Backfill existing records with default values
-- This ensures existing employee-project relationships have billing information
UPDATE employee_projects 
SET 
  billing_type = 'Monthly',
  billing_rate = 0
WHERE billing_type IS NULL OR billing_rate IS NULL;