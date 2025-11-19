-- SQL queries to verify the implementation

-- 1. Check all clients in the projects table
SELECT DISTINCT client FROM projects ORDER BY client;

-- 2. Check all projects with their clients
SELECT name, client, status, created_at FROM projects ORDER BY client, name;

-- 3. Check recently created projects (if you know the upload time)
SELECT name, client, status, created_at 
FROM projects 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 4. Check if test employees were created
SELECT employee_id, name, client, projects 
FROM employees 
WHERE employee_id LIKE 'TEST%'
ORDER BY employee_id;

-- 5. Count projects per client
SELECT client, COUNT(*) as project_count 
FROM projects 
GROUP BY client 
ORDER BY project_count DESC;