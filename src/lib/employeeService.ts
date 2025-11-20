// import { supabase } from './supabase'; // Migrated to MongoDB API
import { Employee, EmployeeProject, ConflictResolution, ConflictData } from '../types';
import { NotificationService } from './notificationService';
import { POAmendment } from './projectService';

export class EmployeeService {
  // Get PO amendments for multiple projects - TO BE MIGRATED TO MONGODB
  static async getPOAmendmentsForProjects(projectIds: string[]): Promise<{ [projectId: string]: POAmendment[] }> {
    // TODO: Implement with MongoDB API
    console.warn('getPOAmendmentsForProjects not yet migrated to MongoDB');
    return {};
    
    /* OLD SUPABASE CODE - TO BE MIGRATED
    if (projectIds.length === 0) return {};

    const { data, error } = await supabase
      .from('po_amendments')
      .select('*')
      .in('project_id', projectIds)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching PO amendments:', error);
      return {};
    }

    const amendmentsByProject: { [projectId: string]: POAmendment[] } = {};
    (data || []).forEach((amendment: POAmendment) => {
      if (!amendmentsByProject[amendment.project_id]) {
        amendmentsByProject[amendment.project_id] = [];
      }
      amendmentsByProject[amendment.project_id].push(amendment);
    });

    return amendmentsByProject;
    */
  }

  // Get all employees with user names and project relationships
static async getAllEmployees(): Promise<Employee[]> {
  try {
    // Use MongoDB API instead of Supabase
    const { EmployeeApi } = await import('./api/employeeApi');
    const employees = await EmployeeApi.getAllEmployees();
    
    // Map MongoDB employees to expected format
    const mappedEmployees = employees.map(emp => this.mapDatabaseRowToEmployee(emp));
    
    // TODO: Fetch project assignments for employees
    // This requires a backend endpoint to get projects by employee ID
    // For now, the projects field from the employee record will be used
    
    return mappedEmployees;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
}

// Get employee by ID with project relationships
static async getEmployeeById(id: string): Promise<Employee | null> {
  try {
    // Use MongoDB API
    const { EmployeeApi } = await import('./api/employeeApi');
    const employee = await EmployeeApi.getEmployeeById(id);
    
    if (!employee) return null;
    
    console.log('📋 Raw employee from API:', employee);
    console.log('📋 Employee projects from API:', employee.employeeProjects);
    
    return this.mapDatabaseRowToEmployee(employee);
    
    /* OLD SUPABASE CODE - COMMENTED OUT
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Handle "no rows returned" error gracefully
      if (error.code === 'PGRST116') {
        return null; // No employee found with this ID
      }
      throw error;
    }

    if (!data) return null;

    // Get user name for this employee
    let userName = data.last_modified_by || 'Unknown';
    if (data.last_modified_by) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', data.last_modified_by)
        .single();
      
      userName = userProfile?.name || data.last_modified_by;
    }

    // Get employee-project relationships
    const { data: employeeProjects, error: projectsError } = await supabase
      .from('employee_projects')
      .select(`
        id,
        employee_id,
        project_id,
        allocation_percentage,
        start_date,
        end_date,
        role_in_project,
        po_number,
        billing_type,
        billing_rate,
        projects!inner(
          id,
          name,
          client,
          po_number
        )
      `)
      .eq('employee_id', id);

    if (projectsError) {
      console.warn('Error fetching employee projects:', projectsError);
    }

    // Get PO amendments for this employee's projects
    const projectIds = employeeProjects?.map(ep => ep.project_id) || [];
    const poAmendmentsByProject = await this.getPOAmendmentsForProjects(projectIds);

    const employeeProjectsList: EmployeeProject[] = [];
    if (employeeProjects) {
      employeeProjects.forEach(ep => {
        employeeProjectsList.push({
          id: ep.id,
          projectId: ep.project_id,
          projectName: ep.projects.name,
          client: ep.projects.client,
          allocationPercentage: ep.allocation_percentage,
          startDate: ep.start_date,
          endDate: ep.end_date,
          roleInProject: ep.role_in_project,
          poNumber: ep.po_number || ep.projects.po_number || '',
          billing: ep.billing_type || 'Monthly', // ✅ Use actual billing_type from database
          rate: ep.billing_rate || 0, // ✅ Use actual billing_rate from database
          poAmendments: poAmendmentsByProject[ep.project_id] || []
        });
      });
    }

    const employee = {
      ...this.mapDatabaseRowToEmployee(data),
      lastModifiedBy: userName,
      employeeProjects: employeeProjectsList
    };

    // ✅ PROCESS: Auto-set lastActiveDate based on latest PO end date
    return this.processEmployeeDataWithLatestPOEndDate(employee);
    */
  } catch (error) {
      console.error('Error fetching employee:', error);
      return null;
      throw error;
  }
}

// Create new employee
static async createEmployee(employeeData: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>): Promise<Employee> {
  try {
    // Use MongoDB API instead of Supabase
    const { EmployeeApi } = await import('./api/employeeApi');
    const employee = await EmployeeApi.createEmployee(employeeData);
    return this.mapDatabaseRowToEmployee(employee);


  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
}

// Update employee
static async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<Employee> {
  try {
    // Use MongoDB API instead of Supabase
    const { EmployeeApi } = await import('./api/employeeApi');
    
    // Handle project assignments if provided
    if (employeeData.employeeProjects && Array.isArray(employeeData.employeeProjects)) {
      await this.updateEmployeeProjectAssignments(id, employeeData.employeeProjects);
    }
    
    const employee = await EmployeeApi.updateEmployee(id, employeeData);
    return this.mapDatabaseRowToEmployee(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
}

// ✅ ADD HELPER FUNCTION TO GET LATEST PO END DATE
private static getLatestPOEndDate(projects: EmployeeProject[]): string | null {
  let latestEndDate: string | null = null;

  projects.forEach(project => {
    // Check main PO end date
    if (project.endDate) {
      if (!latestEndDate || new Date(project.endDate) > new Date(latestEndDate)) {
        latestEndDate = project.endDate;
      }
    }

    // Check PO amendments end dates
    if (project.poAmendments) {
      project.poAmendments.forEach(amendment => {
        if (amendment.end_date) {
          if (!latestEndDate || new Date(amendment.end_date) > new Date(latestEndDate)) {
            latestEndDate = amendment.end_date;
          }
        }
      });
    }
  });

  return latestEndDate;
}

// ✅ ADD THIS METHOD TO PROCESS EMPLOYEE DATA WITH LATEST PO END DATE
private static processEmployeeDataWithLatestPOEndDate(employee: Employee): Employee {
  // ✅ AUTO-CALCULATE: Get latest PO end date from all projects
  if (employee.employeeProjects && employee.employeeProjects.length > 0) {
    const latestPOEndDate = this.getLatestPOEndDate(employee.employeeProjects);
    if (latestPOEndDate) {
      return {
        ...employee,
        lastActiveDate: latestPOEndDate
      };
    }
  }
  return employee;
}

// ✅ UPDATE THIS METHOD in EmployeeService
private static safeDateValue(dateValue: any): string | null {
  if (dateValue === null || dateValue === undefined) {
    return null;
  }
  
  const str = String(dateValue).trim();
  
  // Return null for empty strings
  if (str === '') {
    return null;
  }
  
  // ✅ CRITICAL FIX: Allow special values and return NULL for them
  const lowerStr = str.toLowerCase();
  if (lowerStr === 'milestone' || lowerStr === 'na' || lowerStr === 'sow' || lowerStr === 'ongoing' || lowerStr === 'n/a') {
    return null; // Return null for special values since database expects proper dates or NULL
  }
  
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  
  // Try to convert DD-MM-YYYY to YYYY-MM-DD
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [day, month, year] = str.split('-');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try to convert DD/MM/YYYY to YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // If we can't parse it as a valid date, return null
  return null;
}
  // Update employee project assignments - TO BE MIGRATED TO MONGODB
  static async updateEmployeeProjects(employeeId: string, employeeProjects: EmployeeProject[]): Promise<void> {
    // TODO: Implement with MongoDB API
    console.warn('updateEmployeeProjects not yet migrated to MongoDB');
    return;
    
    /* OLD SUPABASE CODE - TO BE MIGRATED
    try {
      // First, delete all existing project assignments for this employee
      const { error: deleteError } = await supabase
        .from('employee_projects')
        .delete()
        .eq('employee_id', employeeId);

      if (deleteError) throw deleteError;

      

      // Then insert the new project assignments
      if (employeeProjects.length > 0) {
        const projectAssignments = employeeProjects.map(project => ({
          employee_id: employeeId,
          project_id: project.projectId,
          allocation_percentage: project.allocationPercentage,
          start_date: project.startDate,
          end_date: project.endDate || null,
          role_in_project: project.roleInProject || null,
          po_number: project.poNumber || null,
          billing_type: project.billing || 'Monthly', // ✅ Add billing_type
          billing_rate: project.rate || 0 // ✅ Add billing_rate
        }));

        const { error: insertError } = await supabase
          .from('employee_projects')
          .insert(projectAssignments);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating employee projects:', error);
      throw error;
    }
    */
  }

  // Delete employee
  static async deleteEmployee(id: string): Promise<void> {
    try {
      // Use MongoDB API instead of Supabase
      const { EmployeeApi } = await import('./api/employeeApi');
      await EmployeeApi.deleteEmployee(id);
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // Mass delete employees
  static async massDeleteEmployees(ids: string[]): Promise<void> {
    try {
      if (ids.length === 0) {
        throw new Error('No employees selected for deletion');
      }

      // Use MongoDB API to delete employees
      const { EmployeeApi } = await import('./api/employeeApi');
      
      // Delete each employee
      for (const id of ids) {
        try {
          await EmployeeApi.deleteEmployee(id);
        } catch (error) {
          console.error(`Failed to delete employee ${id}:`, error);
          // Continue with other deletions
        }
      }
    } catch (error) {
      console.error('Error mass deleting employees:', error);
      throw error;
    }
  }

  static async bulkUploadEmployeesWithConflicts(
  employeesData: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[],
  resolutions: ConflictResolution[],
  conflicts: ConflictData[]
): Promise<Employee[]> {
  try {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('User not authenticated');

    console.log('🔍 Bulk Upload with Conflicts - Processing...');
    
    // Process employees based on resolutions
    const employeesToProcess: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[] = [];
    const employeesToUpdate: { id: string; data: Partial<Employee> }[] = [];

    // Create resolution map
    const resolutionMap = new Map<string, ConflictResolution>();
    resolutions.forEach((resolution, index) => {
      resolutionMap.set(`conflict-${index}`, resolution);
    });

    // Process each employee data
    employeesData.forEach((employeeData, index) => {
      const conflictId = `conflict-${index}`;
      const resolution = resolutionMap.get(conflictId);

      if (resolution && resolution.action === 'use_excel') {
        // Find the existing employee ID from conflicts
        const conflict = conflicts.find(c => c.rowNumber === index + 2);
        if (conflict && conflict.existingEmployee) {
          employeesToUpdate.push({
            id: conflict.existingEmployee.id,
            data: employeeData
          });
        }
      } else if (!resolution) {
        // This is a new employee (no conflict)
        employeesToProcess.push(employeeData);
      }
      // If action is 'keep_existing', skip this employee
    });

    const results: Employee[] = [];

    // Use bulk API for new employees
    if (employeesToProcess.length > 0) {
      console.log(`🚀 Creating ${employeesToProcess.length} new employees`);
      const { EmployeeApi } = await import('./api/employeeApi');
      const response = await EmployeeApi.bulkCreateEmployees(employeesToProcess, 'skip');
      if (response.created) {
        results.push(...response.created.map((emp: any) => this.mapDatabaseRowToEmployee(emp)));
      }
    }

    // Update existing employees one by one
    for (const updateItem of employeesToUpdate) {
      if (updateItem.id) {
        console.log(`🔄 Updating existing employee with ID: ${updateItem.id}`);
        try {
          const updatedEmployee = await this.updateEmployee(updateItem.id, updateItem.data);
          results.push(updatedEmployee);
        } catch (updateError) {
          console.error(`❌ Failed to update employee ${updateItem.id}:`, updateError);
        }
      }
    }

    console.log(`✅ Bulk upload with conflicts completed: ${results.length} employees processed`);
    return results;
    
    /* OLD SUPABASE CODE - COMMENTED OUT
    console.log('🔍 Bulk Upload with Conflicts - Processing projects...');

    // ✅ FIX: Extract and ensure ALL projects exist first (including from conflicted employees)
    const allProjectsFromData: string[] = [];
    const allClientsFromData: string[] = [];

    employeesData.forEach(employee => {
      // Collect from employeeProjects (new format)
      if (employee.employeeProjects && employee.employeeProjects.length > 0) {
        employee.employeeProjects.forEach(project => {
          if (project.projectName && project.projectName.trim() !== '') {
            allProjectsFromData.push(project.projectName.trim());
          }
          if (project.client && project.client.trim() !== '') {
            allClientsFromData.push(project.client.trim());
          }
        });
      }
      // Collect from legacy projects field
      if (employee.projects && employee.projects.trim() !== '') {
        employee.projects.split(';').forEach(project => {
          if (project.trim() !== '') {
            allProjectsFromData.push(project.trim());
          }
        });
      }
      if (employee.client && employee.client.trim() !== '') {
        allClientsFromData.push(employee.client.trim());
      }
    });

    // ✅ CRITICAL: Ensure ALL projects and clients exist BEFORE processing conflicts
    const uniqueProjects = [...new Set(allProjectsFromData)];
    const uniqueClients = [...new Set(allClientsFromData)];
    
    console.log('📋 Ensuring projects and clients exist:', {
      projects: uniqueProjects,
      clients: uniqueClients
    });

    await EmployeeService.ensureClientsAndProjectsExist(uniqueClients, uniqueProjects, employeesData);

    // Process employees based on resolutions
    const employeesToInsert: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[] = [];
    const employeesToUpdate: { id: string; data: Partial<Employee> }[] = [];

    // Create resolution map
    const resolutionMap = new Map<string, ConflictResolution>();
    resolutions.forEach((resolution, index) => {
      resolutionMap.set(`conflict-${index}`, resolution);
    });

    // Process each employee data
    employeesData.forEach((employeeData, index) => {
      const conflictId = `conflict-${index}`;
      const resolution = resolutionMap.get(conflictId);

      if (resolution && resolution.action === 'use_excel') {
        // ✅ FIX: Find the existing employee ID from conflicts
        const conflict = conflicts.find(c => c.rowNumber === index + 2);
        if (conflict && conflict.existingEmployee) {
          console.log(`🔄 Updating employee with new projects: ${employeeData.name}`);
          
          // ✅ CRITICAL: Include ALL employee data including projects
          const updateData = {
            ...this.cleanEmployeeDataForUpdate(employeeData),
            // ✅ Ensure projects are included in the update
            employeeProjects: employeeData.employeeProjects,
            projects: employeeData.projects
          };
          
          employeesToUpdate.push({
            id: conflict.existingEmployee.id,
            data: updateData
          });
        }
      } else if (!resolution) {
        // This is a new employee (no conflict)
        employeesToInsert.push(employeeData);
      }
      // If action is 'keep_existing', skip this employee
    });

    const results: Employee[] = [];

    // Insert new employees
    if (employeesToInsert.length > 0) {
      console.log(`🚀 Inserting ${employeesToInsert.length} new employees`);
      
      const insertData = employeesToInsert.map(employee => ({
        employee_id: employee.employeeId,
        name: employee.name,
        email: employee.email && employee.email.trim() !== '' ? employee.email : null,
        department: employee.department,
        designation: employee.designation,
        mode_of_management: employee.modeOfManagement,
        client: employee.client || null,
        billability_status: employee.billabilityStatus,
        po_number: employee.poNumber || null,
        billing: employee.billing || null,
        last_active_date: this.safeDateValue(employee.lastActiveDate),
        projects: employee.projects || null,
        billability_percentage: employee.billabilityPercentage,
        project_start_date: this.safeDateValue(employee.projectStartDate),
        project_end_date: this.safeDateValue(employee.projectEndDate),
        experience_band: employee.experienceBand,
        rate: employee.rate,
        ageing: employee.ageing,
        bench_days: employee.benchDays,
        phone_number: employee.phoneNumber || null,
        emergency_contact: employee.emergencyContact || null,
        ctc: employee.ctc,
        remarks: employee.remarks || null,
        last_modified_by: user.id,
        position: employee.position || null,
        joining_date: this.safeDateValue(employee.joiningDate),
        location: employee.location || null,
        manager: employee.manager || null,
        skills: employee.skills || [],
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from('employees')
        .insert(insertData)
        .select();

      if (insertError) throw insertError;

      const insertedEmployees = insertedData.map(emp => ({
        ...this.mapDatabaseRowToEmployee(emp),
        lastModifiedBy: user.id,
        // ✅ Preserve the original employeeProjects from input data
        employeeProjects: employeesToInsert.find(e => e.employeeId === emp.employee_id)?.employeeProjects || []
      }));

      results.push(...insertedEmployees);
    }

    // Update existing employees
    for (const updateItem of employeesToUpdate) {
      if (updateItem.id) {
        console.log(`🔄 Updating existing employee with ID: ${updateItem.id}`);
        try {
          // ✅ FIX: First update the employee basic data
          const updatedEmployee = await this.updateEmployee(updateItem.id, updateItem.data);
          
          // ✅ CRITICAL: Then update the employee projects separately
          if (updateItem.data.employeeProjects) {
            console.log(`📝 Updating projects for employee: ${updatedEmployee.name}`);
            await this.updateEmployeeProjects(updateItem.id, updateItem.data.employeeProjects);
            updatedEmployee.employeeProjects = updateItem.data.employeeProjects;
          }
          
          results.push(updatedEmployee);
        } catch (updateError) {
          console.error(`❌ Failed to update employee ${updateItem.id}:`, updateError);
          throw updateError;
        }
      }
    }

    // Get user name for response
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const userName = userProfile?.name || user.id;

    // Update lastModifiedBy for all results
    const finalResults = results.map(emp => ({
      ...emp,
      lastModifiedBy: userName
    }));

    // ✅ FIX: Create employee-project relationships for ALL results (including updated ones)
    await this.createEmployeeProjectRelationships(finalResults);

    console.log(`✅ Bulk upload with conflicts completed: ${finalResults.length} employees processed`);
    return finalResults;
  } catch (error) {
    console.error('Error bulk uploading employees with conflicts:', error);
    throw error;
  }
}

  private static cleanEmployeeDataForUpdate(employeeData: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>): Partial<Employee> {
  return {
    employeeId: employeeData.employeeId,
    name: employeeData.name,
    email: employeeData.email,
    department: employeeData.department,
    designation: employeeData.designation,
    modeOfManagement: employeeData.modeOfManagement,
    client: employeeData.client,
    billabilityStatus: employeeData.billabilityStatus,
    poNumber: employeeData.poNumber,
    billing: employeeData.billing,
    lastActiveDate: this.safeDateValue(employeeData.lastActiveDate),
    projects: employeeData.projects, // ✅ Include projects
    billabilityPercentage: employeeData.billabilityPercentage,
    projectStartDate: this.safeDateValue(employeeData.projectStartDate),
    projectEndDate: this.safeDateValue(employeeData.projectEndDate),
    experienceBand: employeeData.experienceBand,
    rate: employeeData.rate,
    ageing: employeeData.ageing,
    benchDays: employeeData.benchDays,
    phoneNumber: employeeData.phoneNumber,
    emergencyContact: employeeData.emergencyContact,
    ctc: employeeData.ctc,
    remarks: employeeData.remarks,
    position: employeeData.position,
    joiningDate: this.safeDateValue(employeeData.joiningDate),
    location: employeeData.location,
    manager: employeeData.manager,
    skills: employeeData.skills,
    dateOfSeparation: this.safeDateValue(employeeData.dateOfSeparation),
    employeeProjects: employeeData.employeeProjects // ✅ CRITICAL: Include employeeProjects
  };
}
*/
  } catch (error) {
    console.error('Error bulk uploading employees with conflicts:', error);
    throw error;
  }
}

  // Bulk upload employees from Excel data
  static async bulkUploadEmployees(employeesData: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[]): Promise<Employee[]> {
    try {
      // Check authentication
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('User not authenticated');

      console.log('🔍 Starting duplicate detection...');
      
      // Get ALL existing employees to check against
      const existingEmployees = await this.getAllEmployees();
      
      // ✅ ULTRA-SAFE: Create sets with proper null handling
      const existingEmails = new Set();
      const existingEmployeeIds = new Set();

      existingEmployees.forEach(emp => {
        // Handle email - safely convert to lowercase only if not null/empty
        if (emp.email) {
          try {
            const emailStr = String(emp.email).trim();
            if (emailStr && emailStr !== 'null' && emailStr !== 'undefined') {
              const emailLower = emailStr.toLowerCase();
              existingEmails.add(emailLower);
            }
          } catch (error) {
            console.warn('Skipping invalid email:', emp.email);
          }
        }
        
        // Handle employee ID - safely convert to lowercase only if not null/empty
        if (emp.employeeId) {
          try {
            const empIdStr = String(emp.employeeId).trim();
            if (empIdStr && empIdStr !== 'null' && empIdStr !== 'undefined') {
              const empIdLower = empIdStr.toLowerCase();
              existingEmployeeIds.add(empIdLower);
            }
          } catch (error) {
            console.warn('Skipping invalid employee ID:', emp.employeeId);
          }
        }
      });

      console.log('📊 Existing emails count:', existingEmails.size);
      console.log('📊 Existing employee IDs count:', existingEmployeeIds.size);
      console.log('📊 Total employees in upload:', employeesData.length);

      // Filter out duplicates - only check within current batch, not against existing DB
      const uniqueEmailsInBatch = new Set();
      const uniqueEmployeeIdsInBatch = new Set();
      
      const employeesToProcess = employeesData.filter(employee => {
        try {
          // ✅ SAFE: Process current employee data
          let emailLower = '';
          let employeeIdLower = '';

          // Process email safely
          if (employee.email) {
            try {
              const emailStr = String(employee.email).trim();
              if (emailStr && emailStr !== 'null' && emailStr !== 'undefined') {
                emailLower = emailStr.toLowerCase();
              }
            } catch (error) {
              console.warn('Could not process email:', employee.email);
            }
          }

          // Process employee ID safely
          if (employee.employeeId) {
            try {
              const empIdStr = String(employee.employeeId).trim();
              if (empIdStr && empIdStr !== 'null' && empIdStr !== 'undefined') {
                employeeIdLower = empIdStr.toLowerCase();
              }
            } catch (error) {
              console.warn('Could not process employee ID:', employee.employeeId);
            }
          }

          // ✅ Check 1: Must have employee ID
          if (!employeeIdLower) {
            console.warn(`❌ Skipping employee without valid Employee ID: ${employee.name}`);
            return false;
          }

          // ✅ Check 2: Check for duplicate employee ID within current batch only
          if (uniqueEmployeeIdsInBatch.has(employeeIdLower)) {
            console.warn(`❌ Skipping duplicate employee ID in batch: ${employee.employeeId}`);
            return false;
          }
          uniqueEmployeeIdsInBatch.add(employeeIdLower);

          // ✅ Check 3: If email exists, check for duplicates within batch only
          if (emailLower && emailLower !== '') {
            // Check for duplicate email in current batch
            if (uniqueEmailsInBatch.has(emailLower)) {
              console.warn(`❌ Skipping duplicate email in current batch: ${employee.email}`);
              return false;
            }
            uniqueEmailsInBatch.add(emailLower);
          }

          return true;

        } catch (error) {
          console.error('Error processing employee:', employee, error);
          return false;
        }
      });

      console.log('✅ Employees after filtering:', employeesToProcess.length);
      console.log('🚫 Employees filtered out:', employeesData.length - employeesToProcess.length);

      if (employeesToProcess.length === 0) {
        throw new Error('No valid employees to upload after filtering duplicates and conflicts.');
      }

      // Extract unique clients and projects from the filtered employee data
      const uniqueClients = [...new Set(employeesToProcess
        .map(emp => emp.client)
        .filter(client => client && client.trim() !== '')
      )];

      const uniqueProjects = [...new Set(employeesToProcess
        .map(emp => emp.projects)
        .filter(project => project && project.trim() !== '')
      )];

      console.log('🔍 Bulk Upload Analysis:');
      console.log('📋 Unique clients found:', uniqueClients);
      console.log('📋 Unique projects found:', uniqueProjects);
      console.log('📊 Total employees to process:', employeesToProcess.length);

      // Auto-create missing clients and projects
      try {
        const { ClientApi } = await import('./api/clientApi');
        const { ProjectApi } = await import('./api/projectApi');

        // Create missing clients (Note: Clients are created automatically when projects are created)
        console.log(`📋 Found ${uniqueClients.length} unique clients in upload`);
        if (uniqueClients.length > 0) {
          const existingClients = await ClientApi.getAllClients();
          console.log(`📋 Existing clients in database: ${existingClients.length}`);
          const existingClientNames = new Set(existingClients.map(c => c.toLowerCase()));
          const missingClients = uniqueClients.filter(client => !existingClientNames.has(client.toLowerCase()));
          console.log(`📋 Missing clients to be created via projects: ${missingClients.length}`, missingClients);
        }

        // Create missing projects
        if (employeesToProcess.length > 0) {
          const projectClientCombinations = new Set<string>();
          
          employeesToProcess.forEach(employee => {
            const employeeClient = employee.client ? String(employee.client).trim() : '';
            
            if (employee.projects && String(employee.projects).trim() !== '') {
              const projectNames = employee.projects.split(';').map(p => p.trim()).filter(p => p);
              projectNames.forEach(projectName => {
                if (employeeClient && projectName) {
                  projectClientCombinations.add(`${employeeClient}|${projectName}`);
                }
              });
            }
          });

          if (projectClientCombinations.size > 0) {
            console.log(`📋 Found ${projectClientCombinations.size} unique project-client combinations`);
            const allExistingProjects = await ProjectApi.getAllProjects();
            console.log(`📋 Existing projects in database: ${allExistingProjects.length}`);
            const existingProjectKeys = new Set(
              allExistingProjects.map(p => `${p.client}|${p.name}`.toLowerCase())
            );

            let createdProjectsCount = 0;
            let skippedProjectsCount = 0;
            for (const combination of projectClientCombinations) {
              const [client, projectName] = combination.split('|');
              const key = `${client}|${projectName}`.toLowerCase();
              
              if (!existingProjectKeys.has(key)) {
                try {
                  console.log(`🔨 Creating project: "${projectName}" for client "${client}"`);
                  const result = await ProjectApi.createProject({
                    name: projectName,
                    client: client,
                    status: 'Active',
                    start_date: new Date().toISOString().split('T')[0],
                  });
                  createdProjectsCount++;
                  console.log(`✅ Created new project: "${projectName}" for client "${client}"`, result);
                } catch (error) {
                  console.error(`❌ Failed to create project "${projectName}" for client "${client}":`, error);
                }
              } else {
                skippedProjectsCount++;
                console.log(`⏭️ Skipping existing project: "${projectName}" for client "${client}"`);
              }
            }
            
            console.log(`🎉 Project creation summary: ${createdProjectsCount} created, ${skippedProjectsCount} skipped`);
          }
        }
      } catch (error) {
        console.error('Error auto-creating clients and projects:', error);
      }

      // Use MongoDB bulk API
      console.log('🚀 Attempting to insert', employeesToProcess.length, 'employees into database...');

      const { EmployeeApi } = await import('./api/employeeApi');
      const response = await EmployeeApi.bulkCreateEmployees(employeesToProcess, 'skip');
      
      if (!response || !response.details) {
        throw new Error('Failed to save employees to database');
      }

      console.log('✅ Successfully inserted', response.details.created.length, 'employees');
      console.log('⚠️ Skipped', response.details.skipped.length, 'employees (already exist)');
      console.log('❌ Failed', response.details.errors.length, 'employees');
      
      // Log detailed errors for debugging
      if (response.details.errors.length > 0) {
        console.error('First 10 errors with details:');
        response.details.errors.slice(0, 10).forEach((err: any, index: number) => {
          console.error(`  ${index + 1}. Employee ID: ${err.employee_id}`);
          console.error(`     Error: ${err.error}`);
        });
      }
      
      // Log skipped employees
      if (response.details.skipped.length > 0) {
        console.warn('First 10 skipped employees:');
        response.details.skipped.slice(0, 10).forEach((skip: any, index: number) => {
          console.warn(`  ${index + 1}. Employee ID: ${skip.employee_id} - Reason: ${skip.reason}`);
        });
      }

      // Map the created employees
      const mappedEmployees = response.details.created.map((emp: any) => 
        this.mapDatabaseRowToEmployee(emp)
      );

      // Assign employees to their projects
      if (mappedEmployees.length > 0) {
        console.log('🔗 Assigning employees to their projects...');
        await this.assignEmployeesToProjects(mappedEmployees);
      }

      return mappedEmployees;
    } catch (error) {
      console.error('❌ Error bulk uploading employees:', error);
      throw error;
    }
  }

  // Assign employees to their projects based on client and project fields
  private static async assignEmployeesToProjects(employees: Employee[]): Promise<void> {
    try {
      const { ProjectApi } = await import('./api/projectApi');
      
      // Helper to convert DD-MM-YYYY to YYYY-MM-DD
      const convertDateFormat = (dateStr: string | undefined): string | null => {
        if (!dateStr || dateStr.trim() === '') return null;
        
        // Check if it's in DD-MM-YYYY format
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
          const [day, month, year] = dateStr.split('-');
          return `${year}-${month}-${day}`;
        }
        
        // Already in YYYY-MM-DD format or other format
        return dateStr;
      };
      
      // Get all projects
      const allProjects = await ProjectApi.getAllProjects();
      const projectMap = new Map<string, string>(); // key: "client|projectName", value: projectId
      
      allProjects.forEach(p => {
        const key = `${p.client}|${p.name}`.toLowerCase();
        projectMap.set(key, p._id || p.id || '');
      });
      
      let assignedCount = 0;
      let failedCount = 0;
      
      for (const employee of employees) {
        if (!employee.client || !employee.projects) continue;
        
        // Parse project names (semicolon-separated)
        const projectNames = employee.projects.split(';').map(p => p.trim()).filter(p => p);
        
        for (const projectName of projectNames) {
          const key = `${employee.client}|${projectName}`.toLowerCase();
          const projectId = projectMap.get(key);
          
          if (projectId) {
            try {
              await ProjectApi.assignEmployeeToProject(projectId, {
                employee_id: employee.id,
                allocation_percentage: employee.billabilityPercentage || 100,
                start_date: convertDateFormat(employee.projectStartDate) || new Date().toISOString().slice(0, 10),
                end_date: convertDateFormat(employee.projectEndDate),
                role_in_project: employee.designation || null,
                po_number: employee.poNumber || null,
                billing_type: employee.billing || 'Monthly',
                billing_rate: employee.rate || 0
              });
              assignedCount++;
              console.log(`✅ Assigned ${employee.name} to project ${projectName}`);
            } catch (error: any) {
              // Ignore duplicate assignment errors
              if (!error.message?.includes('already assigned')) {
                failedCount++;
                console.warn(`❌ Failed to assign ${employee.name} to ${projectName}:`, error.message);
              }
            }
          } else {
            console.warn(`⚠️ Project not found: "${projectName}" for client "${employee.client}"`);
          }
        }
      }
      
      console.log(`🎉 Employee-project assignment complete: ${assignedCount} assigned, ${failedCount} failed`);
    } catch (error) {
      console.error('Error assigning employees to projects:', error);
    }
  }



  // Update employee project assignments
  private static async updateEmployeeProjectAssignments(employeeId: string, employeeProjects: any[]): Promise<void> {
    try {
      const { EmployeeProjectApi } = await import('./api/employeeProjectApi');
      
      console.log(`🔄 Updating project assignments for employee ${employeeId}:`, employeeProjects);
      
      // Helper to convert DD-MM-YYYY to YYYY-MM-DD
      const convertDateFormat = (dateStr: string | undefined): string | null => {
        if (!dateStr || dateStr.trim() === '') return null;
        
        // Check if it's in DD-MM-YYYY format
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
          const [day, month, year] = dateStr.split('-');
          return `${year}-${month}-${day}`;
        }
        
        // Already in YYYY-MM-DD format or other format
        return dateStr;
      };
      
      // Get current assignments from the database
      const currentEmployee = await this.getEmployeeById(employeeId);
      const currentAssignments = currentEmployee?.employeeProjects || [];
      
      // Track which assignments to keep
      const newProjectIds = new Set(employeeProjects.map(p => p.projectId).filter(Boolean));
      const currentProjectIds = new Set(currentAssignments.map(p => p.projectId));
      
      // Delete assignments that are no longer in the list
      for (const currentAssignment of currentAssignments) {
        if (!newProjectIds.has(currentAssignment.projectId)) {
          try {
            await EmployeeProjectApi.deleteEmployeeProject(currentAssignment.projectId, employeeId);
            console.log(`🗑️ Removed assignment from project ${currentAssignment.projectName}`);
          } catch (error) {
            console.error(`❌ Failed to remove assignment from project ${currentAssignment.projectName}:`, error);
          }
        }
      }
      
      // Create or update assignments
      for (const project of employeeProjects) {
        if (!project.projectId) continue;
        
        const assignmentData = {
          allocation_percentage: project.allocationPercentage || 100,
          start_date: convertDateFormat(project.startDate) || new Date().toISOString().slice(0, 10),
          end_date: convertDateFormat(project.endDate),
          role_in_project: project.roleInProject || null,
          po_number: project.poNumber || null,
          billing_type: project.billing || 'Monthly',
          billing_rate: project.rate || 0
        };
        
        try {
          if (currentProjectIds.has(project.projectId)) {
            // Update existing assignment
            await EmployeeProjectApi.updateEmployeeProject(project.projectId, employeeId, assignmentData);
            console.log(`✅ Updated assignment for project ${project.projectName}`);
          } else {
            // Create new assignment
            await EmployeeProjectApi.assignEmployeeToProject(project.projectId, {
              employee_id: employeeId,
              ...assignmentData
            });
            console.log(`✅ Created assignment for project ${project.projectName}`);
          }
        } catch (error: any) {
          console.error(`❌ Failed to process assignment for project ${project.projectName}:`, error);
        }
      }
    } catch (error) {
      console.error('Error updating employee project assignments:', error);
      throw error;
    }
  }

  // Search employees - Client-side filtering
  static async searchEmployees(query: string): Promise<Employee[]> {
    try {
      // Get all employees and filter on client side
      const allEmployees = await this.getAllEmployees();
      
      if (!query || query.trim() === '') {
        return allEmployees;
      }
      
      const searchTerm = query.toLowerCase().trim();
      
      return allEmployees.filter(emp => 
        emp.name?.toLowerCase().includes(searchTerm) ||
        emp.email?.toLowerCase().includes(searchTerm) ||
        emp.employeeId?.toLowerCase().includes(searchTerm) ||
        emp.client?.toLowerCase().includes(searchTerm) ||
        emp.department?.toLowerCase().includes(searchTerm) ||
        emp.designation?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching employees:', error);
      return [];
    }
    
    /* OLD SUPABASE CODE - TO BE MIGRATED
    try {
      // First search employees
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,employee_id.ilike.%${query}%,client.ilike.%${query}%`)
        .order('s_no', { ascending: true });

      if (employeesError) throw employeesError;

      // Get unique user IDs from filtered employees
      const userIds = [...new Set(employees
        .map(emp => emp.last_modified_by)
        .filter(Boolean))] as string[];

      // Get user profiles for these IDs
      let userProfiles: { [key: string]: string } = {};
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, name')
          .in('id', userIds);

        if (profilesError) throw profilesError;
        
        userProfiles = profiles?.reduce((acc, profile) => {
          acc[profile.id] = profile.name;
          return acc;
        }, {} as { [key: string]: string }) || {};
      }

      // Map employees with user names
      return employees.map(emp => ({
        ...this.mapDatabaseRowToEmployee(emp),
        lastModifiedBy: userProfiles[emp.last_modified_by] || emp.last_modified_by
      }));
    } catch (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
  }

  // Get employees by department - TO BE MIGRATED TO MONGODB
  static async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    // TODO: Implement with MongoDB API
    console.warn('getEmployeesByDepartment not yet migrated to MongoDB');
    return [];
  }

  // Get employees by billability status - TO BE MIGRATED TO MONGODB
  static async getEmployeesByStatus(status: string): Promise<Employee[]> {
    // TODO: Implement with MongoDB API
    console.warn('getEmployeesByStatus not yet migrated to MongoDB');
    return [];
    
    /* OLD SUPABASE CODE - TO BE MIGRATED
    try {
      // First get employees by status
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('billability_status', status)
        .order('s_no', { ascending: true });

      if (employeesError) throw employeesError;

      // Get unique user IDs from employees
      const userIds = [...new Set(employees
        .map(emp => emp.last_modified_by)
        .filter(Boolean))] as string[];

      // Get user profiles for these IDs
      let userProfiles: { [key: string]: string } = {};
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, name')
          .in('id', userIds);

        if (profilesError) throw profilesError;
        
        userProfiles = profiles?.reduce((acc, profile) => {
          acc[profile.id] = profile.name;
          return acc;
        }, {} as { [key: string]: string }) || {};
      }

      // Map employees with user names
      return employees.map(emp => ({
        ...this.mapDatabaseRowToEmployee(emp),
        lastModifiedBy: userProfiles[emp.last_modified_by] || emp.last_modified_by
      }));
    } catch (error) {
      console.error('Error fetching employees by status:', error);
      throw error;
    }
  }

  // Auto-update employee status - Disabled until PO amendments are migrated to MongoDB
  static async autoUpdateEmployeeStatus(employee: Employee): Promise<Employee | null> {
    // TODO: Implement with MongoDB API when PO amendments are migrated
    // For now, just return null (no status update needed)
    console.log(`⚠️ Auto-update status disabled for ${employee.name}`);
    return null;
  }

  // Helper method to check if PO is active
  private static isPOActive(startDate: string, endDate?: string): boolean {
    if (!startDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    // If end date exists, PO is active only until end date (inclusive)
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      // PO is active if today is between start date and end date (inclusive)
      const isAfterStart = today >= start;
      const isBeforeOrOnEnd = today <= end;

      return isAfterStart && isBeforeOrOnEnd;
    }

    // If no end date, PO is active if today is after start date
    return today >= start;
  }

  // Get employees by mode of management - TO BE MIGRATED TO MONGODB
  static async getEmployeesByMode(mode: string): Promise<Employee[]> {
    // TODO: Implement with MongoDB API
    console.warn('getEmployeesByMode not yet migrated to MongoDB');
    return [];
  }

  static async ensureClientsAndProjectsExist(clients: string[], projects: string[], employeesData?: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[]): Promise<void> {
    try {
      const { ClientApi } = await import('./api/clientApi');
      const { ProjectApi } = await import('./api/projectApi');

      const validClients = clients.filter(client => client != null && String(client).trim() !== '');
      const validProjects = projects.filter(project => project != null && String(project).trim() !== '');

      console.log('🔍 Ensuring clients and projects exist:', {
        validClients,
        validProjects,
        totalEmployees: employeesData?.length
      });

      // Create missing clients
      if (validClients.length > 0) {
        const existingClients = await ClientApi.getAllClients();
        const existingClientNames = new Set(existingClients.map(c => c.toLowerCase()));
        const missingClients = validClients.filter(client => !existingClientNames.has(client.toLowerCase()));

        for (const client of missingClients) {
          try {
            await ClientApi.addClient(client);
            console.log(`✅ Created new client: ${client}`);
          } catch (error) {
            console.warn(`❌ Failed to create client ${client}:`, error);
          }
        }
      }

      // Create missing projects from employee data
      if (employeesData && employeesData.length > 0) {
        console.log(`🚀 Processing ${employeesData.length} employees for project creation`);
        
        // Collect all unique project-client combinations from employee data
        const projectClientCombinations = new Set<string>();
        
        employeesData.forEach(employee => {
          const employeeClient = employee.client ? String(employee.client).trim() : '';
          
          // Handle projects field (semicolon-separated)
          if (employee.projects && String(employee.projects).trim() !== '') {
            const projectNames = employee.projects.split(';').map(p => p.trim()).filter(p => p);
            projectNames.forEach(projectName => {
              if (employeeClient && projectName) {
                const key = `${employeeClient}|${projectName}`;
                projectClientCombinations.add(key);
              }
            });
          }
        });

        console.log(`📋 Found ${projectClientCombinations.size} unique project-client combinations`);

        // Get all existing projects
        const allExistingProjects = await ProjectApi.getAllProjects();
        const existingProjectKeys = new Set(
          allExistingProjects.map(p => `${p.client}|${p.name}`.toLowerCase())
        );

        // Create missing projects
        let createdProjectsCount = 0;
        for (const combination of projectClientCombinations) {
          const [client, projectName] = combination.split('|');
          const key = `${client}|${projectName}`.toLowerCase();
          
          if (!existingProjectKeys.has(key)) {
            try {
              await ProjectApi.createProject({
                name: projectName,
                client: client,
                status: 'Active',
                start_date: new Date().toISOString().split('T')[0],
              });
              createdProjectsCount++;
              console.log(`✅ Created new project: "${projectName}" for client "${client}"`);
            } catch (error) {
              console.warn(`❌ Failed to create project "${projectName}" for client "${client}":`, error);
            }
          }
        }
        
        console.log(`🎉 Created ${createdProjectsCount} new projects during bulk upload`);
      }
    } catch (error) {
      console.error('Error ensuring clients and projects exist:', error);
    }
  }

  private static async createEmployeeProjectRelationships(employees: Employee[]): Promise<void> {
    // TODO: Migrate to MongoDB API
    // For now, skip project relationship creation during bulk upload
    console.log('⚠️ createEmployeeProjectRelationships not yet migrated to MongoDB API - skipping');
    return;
    
    /* OLD SUPABASE CODE - TO BE MIGRATED
    console.log('🔗 Creating employee-project relationships for:', employees.length, 'employees');
    
    // Get ALL projects (including newly created ones)
    const { data: allProjects } = await supabase
      .from('projects')
      .select('id, name, client');

    if (!allProjects || allProjects.length === 0) {
      console.log('⚠️ No projects found in database');
      return;
    }

    // Create enhanced mapping - project name + client to project ID
    const projectMap = new Map<string, string>();
    allProjects.forEach(p => {
      if (p.name && p.id && p.client) {
        const key = `${String(p.client).trim().toLowerCase()}|${String(p.name).trim().toLowerCase()}`;
        projectMap.set(key, p.id);
        
        // Also map by project name alone (fallback)
        const nameOnlyKey = String(p.name).trim().toLowerCase();
        if (!projectMap.has(nameOnlyKey)) {
          projectMap.set(nameOnlyKey, p.id);
        }
      }
    });

    console.log('📋 Available projects for mapping:', projectMap.size);

    const relationships = [];
    let createdCount = 0;
    
    for (const employee of employees) {
      const employeeClient = employee.client ? String(employee.client).trim().toLowerCase() : '';
      
      // ✅ PRIORITY: Handle employeeProjects array (new projects)
      if (employee.employeeProjects && employee.employeeProjects.length > 0) {
        for (const project of employee.employeeProjects) {
          if (project.projectName && String(project.projectName).trim() !== '') {
            const projectName = String(project.projectName).trim();
            const projectClient = (project.client ? String(project.client).trim() : employeeClient).toLowerCase();
            
            // Try exact match first: client|projectName
            let projectId = projectMap.get(`${projectClient}|${projectName.toLowerCase()}`);
            
            // Fallback: try project name only
            if (!projectId) {
              projectId = projectMap.get(projectName.toLowerCase());
              console.log(`🔍 Fallback mapping for project: ${projectName} (using name only)`);
            }
            
            if (projectId) {
              relationships.push({
                employee_id: employee.id,
                project_id: projectId,
                allocation_percentage: project.allocationPercentage || employee.billabilityPercentage || 100,
                start_date: project.startDate || employee.projectStartDate || new Date().toISOString().slice(0, 10),
                end_date: project.endDate || employee.projectEndDate || null,
                role_in_project: project.roleInProject || null,
                po_number: project.poNumber || employee.poNumber || null,
                billing_type: project.billing || employee.billing || 'Monthly', // ✅ Add billing_type
                billing_rate: project.rate || employee.rate || 0 // ✅ Add billing_rate
              });
              createdCount++;
              console.log(`✅ Created relationship: ${employee.name} -> ${projectName} (${projectClient})`);
            } else {
              console.warn(`❌ Project not found: "${projectName}" for client "${projectClient}" - employee ${employee.name}`);
              console.warn(`   Available projects:`, Array.from(projectMap.keys()));
            }
          }
        }
      } 
      // ✅ FALLBACK: Legacy projects field
      else if (employee.projects && String(employee.projects).trim() !== '') {
        const projectNames = employee.projects.split(';').map(p => p.trim()).filter(p => p);
        
        for (const projectName of projectNames) {
          // Try exact match first
          let projectId = projectMap.get(`${employeeClient}|${projectName.toLowerCase()}`);
          
          // Fallback: try project name only
          if (!projectId) {
            projectId = projectMap.get(projectName.toLowerCase());
          }
          
          if (projectId) {
            relationships.push({
              employee_id: employee.id,
              project_id: projectId,
              allocation_percentage: employee.billabilityPercentage || 100,
              start_date: employee.projectStartDate || new Date().toISOString().slice(0, 10),
              end_date: employee.projectEndDate || null,
              role_in_project: null,
              po_number: employee.poNumber || null,
              billing_type: employee.billing || 'Monthly', // ✅ Add billing_type
              billing_rate: employee.rate || 0 // ✅ Add billing_rate
            });
            createdCount++;
            console.log(`✅ Created relationship: ${employee.name} -> ${projectName} (${employeeClient})`);
          } else {
            console.warn(`❌ Project not found: "${projectName}" for client "${employeeClient}" - employee ${employee.name}`);
          }
        }
      }
    }

    if (relationships.length > 0) {
      console.log(`🚀 Inserting ${relationships.length} employee-project relationships`);
      
      const { error } = await supabase
        .from('employee_projects')
        .insert(relationships);

      if (error) {
        console.error('❌ Failed to create employee-project relationships:', error);
      } else {
        console.log(`✅ Successfully created ${relationships.length} employee-project relationships`);
      }
    } else {
      console.log('ℹ️ No employee-project relationships to create');
    }
    */
  }

  /// Map database row to Employee interface
  private static mapDatabaseRowToEmployee(row: any): Employee {
    // Safe conversion function
    const safeString = (value: any): string => {
      if (value === null || value === undefined) return '';
      return String(value).trim();
    };
    
    // Format date to DD-MM-YYYY
    const formatDate = (value: any): string => {
      if (!value) return '';
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      } catch {
        return '';
      }
    };

    // ✅ ADD THIS CLEANING FUNCTION
    const cleanProjectsField = (projectsValue: any): string => {
      const projectsStr = safeString(projectsValue);
      if (!projectsStr) return '';
      
      // Remove PO numbers in brackets from projects field
      // This handles cases like "Project Name [PO123]" -> "Project Name"
      return projectsStr.replace(/\s*\[[^\]]*\]\s*/g, ' ').trim();
    };

    // ✅ CORRECTED: Support function employees should not have bench days
    const modeOfManagement = safeString(row.mode_of_management);
    const billabilityStatus = safeString(row.billability_status);
    const benchDays = row.bench_days;
    
    let correctedBenchDays = benchDays;
    if (modeOfManagement === 'SUPPORT_FUNCTIONS' && billabilityStatus !== 'Billable') {
      correctedBenchDays = 0; // Reset bench days for non-billable support function
    }

    return {
      id: row._id || row.id, // MongoDB uses _id
      sNo: row.s_no,
      employeeId: safeString(row.employee_id),
      name: safeString(row.name),
      email: safeString(row.email),
      department: safeString(row.department),
      designation: safeString(row.designation),
      modeOfManagement: modeOfManagement,
      client: safeString(row.client),
      billabilityStatus: billabilityStatus,
      poNumber: safeString(row.po_number),
      billing: safeString(row.billing),
      lastActiveDate: formatDate(row.last_active_date),
      // ✅ FIXED: Use cleaned projects field without PO numbers
      projects: cleanProjectsField(row.projects),
      billabilityPercentage: row.billability_percentage || 0,
      projectStartDate: formatDate(row.project_start_date),
      projectEndDate: formatDate(row.project_end_date),
      experienceBand: safeString(row.experience_band),
      rate: row.rate || 0,
      ageing: row.ageing || 0,
      benchDays: correctedBenchDays || 0, // ✅ Use corrected bench days
      phoneNumber: safeString(row.phone_number),
      emergencyContact: safeString(row.emergency_contact),
      ctc: row.ctc || 0,
      remarks: safeString(row.remarks),
      lastModifiedBy: typeof row.last_modified_by === 'object' && row.last_modified_by?.name 
        ? row.last_modified_by.name 
        : safeString(row.last_modified_by),
      lastUpdated: row.updated_at,
      position: safeString(row.position),
      joiningDate: formatDate(row.joining_date),
      location: safeString(row.location),
      manager: safeString(row.manager),
      skills: Array.isArray(row.skills) ? row.skills : [],
      dateOfSeparation: formatDate(row.date_of_separation),
      // ✅ Include employeeProjects if present
      employeeProjects: Array.isArray(row.employeeProjects) ? row.employeeProjects.map((ep: any) => ({
        id: ep.id || ep._id,
        projectId: ep.projectId,
        projectName: ep.projectName,
        client: ep.client,
        allocationPercentage: ep.allocationPercentage || 0,
        startDate: formatDate(ep.startDate),
        endDate: ep.endDate ? formatDate(ep.endDate) : undefined,
        roleInProject: ep.roleInProject,
        poNumber: ep.poNumber || '',
        billing: ep.billing,
        rate: ep.rate || 0
      })) : []
    };
  }
}