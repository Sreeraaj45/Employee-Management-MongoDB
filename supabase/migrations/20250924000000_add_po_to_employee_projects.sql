-- Add per-assignment PO number to employee-project junctions
ALTER TABLE IF EXISTS employee_projects
ADD COLUMN IF NOT EXISTS po_number text;

-- Optional: backfill from project-level PO where missing
UPDATE employee_projects ep
SET po_number = COALESCE(ep.po_number, p.po_number)
FROM projects p
WHERE ep.project_id = p.id AND (ep.po_number IS NULL OR ep.po_number = '');


