import { supabase } from './supabase';
import { Employee } from '../types';
import { NotificationService } from './notificationService';

export interface ProjectRecord {
  id: string;
  name: string;
  client: string;
  start_date: string;
  end_date: string | null;
  status: string;
  team_size: number;
  department?: string;
  po_number?: string | null;
}

export interface ClientWithProjects {
  client: string;
  totalEmployees?: number;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    teamSize: number;
    employeeCount: number;
    poNumber?: string | null;
  }>;
}

export interface POAmendment {
  id: string;
  project_id: string;
  po_number: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class ProjectService {
  static async getAllProjects(): Promise<ProjectRecord[]> {
    try {
      const { ProjectApi } = await import('./api/projectApi');
      const projects = await ProjectApi.getAllProjects();
      console.log(`📋 Raw projects from API:`, projects.slice(0, 2)); // Log first 2 projects
      const mapped = projects.map(p => {
        const id = p._id || p.id || '';
        if (!id) {
          console.warn('⚠️ Project without ID:', p);
        }
        return {
          id,
          name: p.name,
          client: p.client,
          start_date: p.start_date,
          end_date: p.end_date || null,
          status: p.status,
          team_size: p.team_size || 0,
          department: p.department,
          po_number: p.po_number || null
        };
      });
      console.log(`📋 Mapped projects:`, mapped.slice(0, 2)); // Log first 2 mapped projects
      return mapped;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  static async getProjectById(projectId: string): Promise<{
    id: string;
    name: string;
    client: string;
    description?: string | null;
    department?: string | null;
    start_date: string;
    end_date: string | null;
    status: string;
    po_number?: string | null;
    currency?: string | null;
    billing_type?: string | null;
    team_size: number;
  }> {
    try {
      const { ProjectApi } = await import('./api/projectApi');
      const project = await ProjectApi.getProjectById(projectId);
      return {
        id: project._id || project.id || '',
        name: project.name,
        client: project.client,
        description: project.description || null,
        department: project.department || null,
        start_date: project.start_date,
        end_date: project.end_date || null,
        status: project.status,
        po_number: project.po_number || null,
        currency: project.currency || null,
        billing_type: project.billing_type || null,
        team_size: project.team_size || 0
      };
    } catch (error) {
      console.error('Error fetching project by ID:', error);
      throw error;
    }
  }

  static async getClientsWithProjects(): Promise<ClientWithProjects[]> {
    try {
      // Get all projects from MongoDB
      const projects = await this.getAllProjects();
      
      // Get employee counts for each project
      const { ProjectApi } = await import('./api/projectApi');
      const employeeCountPromises = projects.map(async (project) => {
        try {
          const employees = await ProjectApi.getProjectEmployees(project.id);
          return { projectId: project.id, count: employees.length };
        } catch (error) {
          console.warn(`Failed to get employee count for project ${project.id}:`, error);
          return { projectId: project.id, count: 0 };
        }
      });
      
      const employeeCounts = await Promise.all(employeeCountPromises);
      const employeeCountMap = new Map(employeeCounts.map(ec => [ec.projectId, ec.count]));
      
      // Group projects by client
      const clientMap = new Map<string, ClientWithProjects>();
      
      for (const project of projects) {
        if (!clientMap.has(project.client)) {
          clientMap.set(project.client, {
            client: project.client,
            totalEmployees: 0,
            projects: []
          });
        }
        
        const employeeCount = employeeCountMap.get(project.id) || 0;
        const clientData = clientMap.get(project.client)!;
        clientData.totalEmployees = (clientData.totalEmployees || 0) + employeeCount;
        
        clientData.projects.push({
          id: project.id,
          name: project.name,
          status: project.status,
          teamSize: employeeCount,
          employeeCount: employeeCount,
          poNumber: project.po_number || null
        });
      }
      
      // Convert map to array and sort by client name
      const result = Array.from(clientMap.values()).sort((a, b) => 
        a.client.localeCompare(b.client)
      );
      
      return result;
    } catch (error) {
      console.error('Error in getClientsWithProjects:', error);
      return [];
    }
  }
  
  // OLD SUPABASE CODE - TO BE MIGRATED
  /*
  const [projects, employeesWithClientsResult, allEmployeeProjectsResult] = await Promise.all([
    this.getAllProjects(),
    supabase.from('employees').select('client, id').not('client', 'is', null),
    supabase.from('employee_projects').select('employee_id, project_id')
  ]);

  const employeesWithClients = employeesWithClientsResult as { data: Array<{ client: string; id: string }> | null; error: any };
  const allEmployeeProjects = allEmployeeProjectsResult as { data: Array<{ employee_id: string; project_id: string }> | null; error: any };

  const grouped: { [client: string]: ClientWithProjects } = {};
  const employeesByClient: { [client: string]: Set<string> } = {};
  
  // Get all unique clients from projects AND from employees
  const clientsFromProjects = [...new Set(projects.map(p => p.client))];
  const clientsFromEmployees = [...new Set((employeesWithClients.data || []).map(e => e.client))];
  const allUniqueClients = [...new Set([...clientsFromProjects, ...clientsFromEmployees])];
  
  // Initialize employee sets for each client
  allUniqueClients.forEach(client => {
    employeesByClient[client] = new Set<string>();
  });
  
  // ⚡ OPTIMIZED: Process all employees in memory (no database queries in loop)
  (employeesWithClients.data || []).forEach(emp => {
    if (emp.client && employeesByClient[emp.client]) {
      employeesByClient[emp.client].add(emp.id);
    }
  });
  
  // ⚡ OPTIMIZED: Build project-to-employees map in memory
  const projectEmployees: { [projectId: string]: Set<string> } = {};
  (allEmployeeProjects.data || []).forEach(mapping => {
    if (!projectEmployees[mapping.project_id]) {
      projectEmployees[mapping.project_id] = new Set();
    }
    projectEmployees[mapping.project_id].add(mapping.employee_id);
  });
  
  // ⚡ OPTIMIZED: Add project-assigned employees to client counts
  projects.forEach(project => {
    const projectEmps = projectEmployees[project.id] || new Set();
    projectEmps.forEach(empId => {
      if (employeesByClient[project.client]) {
        employeesByClient[project.client].add(empId);
      }
    });
  });
  
  // ⚡ OPTIMIZED: Build count map from in-memory data (no database queries)
  const countMap: { [projectId: string]: number } = {};
  projects.forEach(p => {
    countMap[p.id] = (projectEmployees[p.id] || new Set()).size;
  });

  for (const p of projects) {
    if (!grouped[p.client]) {
      grouped[p.client] = { 
        client: p.client, 
        projects: [],
        totalEmployees: employeesByClient[p.client]?.size || 0
      };
    }
    
    // Check if this is a default project (starts with __CLIENT_ONLY__ or name equals client name)
    const isDefaultProject = p.name.startsWith('__CLIENT_ONLY__') || p.name === p.client;
    
    // Get all projects for this client to determine if we should show default project
    const clientProjects = projects.filter(proj => proj.client === p.client);
    const hasRealProjects = clientProjects.some(proj => 
      !proj.name.startsWith('__CLIENT_ONLY__') && proj.name !== proj.client
    );
    
    // Show default project only if there are no real projects
    if (!isDefaultProject || (isDefaultProject && !hasRealProjects)) {
      // Clean up the display name - remove the __CLIENT_ONLY__ prefix or use client name
      let displayName = p.name;
      if (p.name.startsWith('__CLIENT_ONLY__')) {
        displayName = p.client; // Use client name for display
      } else if (p.name === p.client) {
        displayName = p.client; // Already using client name
      }
      
      grouped[p.client].projects.push({
        id: p.id,
        name: displayName,
        status: p.status,
        teamSize: p.team_size,
        employeeCount: countMap[p.id] || 0,
        poNumber: p.po_number
      });
    }
  }

  // ⚡ OPTIMIZED: CREATE DEFAULT PROJECTS IN BATCH
  const clientsNeedingProjects = allUniqueClients.filter(clientName => {
    const hasEmployees = (employeesByClient[clientName]?.size || 0) > 0;
    const hasProjects = grouped[clientName] && grouped[clientName].projects.length > 0;
    return hasEmployees && !hasProjects;
  });

  if (clientsNeedingProjects.length > 0) {
    try {
      // ⚡ Create all default projects in one batch insert
      const projectsToCreate = clientsNeedingProjects.map(clientName => ({
        name: clientName,
        client: clientName,
        description: `Default project for ${clientName}`,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: null,
        status: 'Active',
        po_number: null,
        team_size: 0,
        department: 'General',
        billing_type: 'Fixed',
        currency: 'USD'
      }));

      const { data: newProjects, error: createError } = await supabase
        .from('projects')
        .insert(projectsToCreate as any)
        .select('id, name, client, status, team_size, po_number');

      if (!createError && newProjects) {
        // ⚡ Build employee assignments in memory
        const employeeAssignments: any[] = [];
        
        newProjects.forEach((newProject: any) => {
          const clientName = newProject.client;
          
          // Initialize the client in grouped data
          if (!grouped[clientName]) {
            grouped[clientName] = {
              client: clientName,
              projects: [],
              totalEmployees: employeesByClient[clientName]?.size || 0
            };
          }
          
          const defaultProject = {
            id: newProject.id,
            name: clientName,
            status: 'Active',
            teamSize: 0,
            employeeCount: employeesByClient[clientName]?.size || 0,
            poNumber: null
          };
          
          grouped[clientName].projects.push(defaultProject);

          // ⚡ Prepare employee assignments for batch insert
          const clientEmployeeIds = Array.from(employeesByClient[clientName] || []);
          clientEmployeeIds.forEach(employeeId => {
            employeeAssignments.push({
              employee_id: employeeId,
              project_id: newProject.id,
              allocation_percentage: 100,
              role_in_project: 'Team Member',
              start_date: new Date().toISOString().slice(0, 10),
              billing_type: 'Monthly',
              billing_rate: 0
            });
          });
        });

        // ⚡ Insert all employee assignments in one batch (if any)
        if (employeeAssignments.length > 0) {
          const { error: linkError } = await supabase
            .from('employee_projects')
            .insert(employeeAssignments as any);
          
          if (linkError) {
            console.error('Failed to batch insert employee assignments:', linkError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to create default projects in batch:', error);
    }
  }

  return Object.values(grouped).sort((a, b) => a.client.localeCompare(b.client));
  */

  static async getProjectEmployees(projectId: string): Promise<Employee[]> {
    try {
      const { ProjectApi } = await import('./api/projectApi');
      const employees = await ProjectApi.getProjectEmployees(projectId);
      
      console.log(`📋 Fetched ${employees.length} employees for project ${projectId}`);
      console.log('Raw employee data:', employees);
      
      // Map to Employee format
      return employees.map((emp: any) => ({
        id: emp._id || emp.id,
        sNo: emp.s_no,
        employeeId: emp.employee_id,
        name: emp.name,
        email: emp.email || '',
        department: emp.department || '',
        designation: emp.designation || '',
        modeOfManagement: emp.mode_of_management || '',
        client: emp.client || '',
        billabilityStatus: emp.billability_status || '',
        poNumber: emp.po_number || '',
        billing: emp.billing_type || emp.billing || '',
        lastActiveDate: emp.last_active_date || '',
        projects: emp.projects || '',
        billabilityPercentage: emp.billability_percentage || 0,
        projectStartDate: emp.start_date || emp.project_start_date || '',
        projectEndDate: emp.end_date || emp.project_end_date || '',
        experienceBand: emp.experience_band || '',
        rate: emp.billing_rate || emp.rate || 0,
        ageing: emp.ageing || 0,
        benchDays: emp.bench_days || 0,
        phoneNumber: emp.phone_number || '',
        emergencyContact: emp.emergency_contact || '',
        ctc: emp.ctc || 0,
        remarks: emp.remarks || '',
        lastModifiedBy: emp.last_modified_by || '',
        lastUpdated: emp.updated_at,
        position: emp.position || '',
        joiningDate: emp.joining_date || '',
        location: emp.location || '',
        manager: emp.manager || '',
        skills: emp.skills || [],
        dateOfSeparation: emp.date_of_separation || ''
      }));
    } catch (error) {
      console.error('Error fetching project employees:', error);
      return [];
    }
    
    /* OLD SUPABASE CODE - TO BE MIGRATED
    const { data: project, error: pErr } = await supabase
      .from('projects')
      .select('client, name')
      .eq('id', projectId)
      .single();
    if (pErr) throw pErr;

    const { data: mappings, error: mErr } = await supabase
      .from('employee_projects')
      .select('employee_id, po_number, billing_type, billing_rate')
      .eq('project_id', projectId);
    if (mErr) throw mErr;
    const employeeIds = (mappings || []).map((m: any) => m.employee_id);

    let employees: any[] = [];

    if (employeeIds.length > 0) {
      const { data: mappedEmployees, error: eErr } = await supabase
        .from('employees')
        .select('*')
        .in('id', employeeIds);
      if (eErr) throw eErr;
      employees = mappedEmployees || [];
    }

    const assignmentDataByEmployee: Record<string, any> = {};
      (mappings || []).forEach((a: any) => {
        assignmentDataByEmployee[a.employee_id] = {
          poNumber: a.po_number || '',
          billing: a.billing_type || '',
          rate: a.billing_rate || 0
        };
      });

    const { data: assignmentData } = await supabase
      .from('employee_projects')
      .select('employee_id, po_number')
      .eq('project_id', projectId);
    const poByEmployee: Record<string, string> = {};
    (assignmentData || []).forEach((a: any) => {
      poByEmployee[a.employee_id] = a.po_number || '';
    });

     return (employees || []).map((row: any) => {
    const assignmentData = assignmentDataByEmployee[row.id] || {};
    
    return {
      id: row.id,
      sNo: row.s_no,
      employeeId: row.employee_id,
      name: row.name,
      email: row.email,
      department: row.department,
      designation: row.designation,
      modeOfManagement: row.mode_of_management,
      client: row.client || '',
      billabilityStatus: row.billability_status,
      poNumber: assignmentData.poNumber || row.po_number || '',
      billing: assignmentData.billing || row.billing || '', // ✅ Get from assignment first, then fallback
      lastActiveDate: row.last_active_date || '',
      projects: row.projects || '',
      billabilityPercentage: row.billability_percentage,
      projectStartDate: row.project_start_date || '',
      projectEndDate: row.project_end_date || '',
      experienceBand: row.experience_band,
      rate: assignmentData.rate || row.rate || 0, // ✅ Get from assignment first, then fallback
      ageing: row.ageing,
      benchDays: row.bench_days,
      phoneNumber: row.phone_number || '',
      emergencyContact: row.emergency_contact || '',
      ctc: row.ctc,
      remarks: row.remarks || '',
      lastModifiedBy: row.last_modified_by || '',
      lastUpdated: row.updated_at,
      position: row.position || '',
      joiningDate: row.joining_date || '',
      location: row.location || '',
      manager: row.manager || '',
      skills: row.skills || []
    };
  });
  */
  }

  static async getClientEmployees(clientName: string): Promise<Employee[]> {
  // Get ALL employees linked to this client (both by client field and by project assignments)
  
  // First, get employees whose client field matches this client
  const { data: clientFieldEmployees, error: clientFieldError } = await supabase
    .from('employees')
    .select('*')
    .eq('client', clientName);
  
  if (clientFieldError) throw clientFieldError;

  // Get projects for this client
  const { data: projects, error: pErr } = await supabase
    .from('projects')
    .select('id')
    .eq('client', clientName);
  
  if (pErr) throw pErr;

  let projectMappings: any[] = [];
  let assignedEmployeeIds = new Set<string>();

  if (projects && projects.length > 0) {
    // Get employee-project mappings for this client's projects with project names
    const projectIds = projects.map(p => p.id);
    const { data: mappings, error: mErr } = await supabase
      .from('employee_projects')
      .select(`
        employee_id, 
        project_id, 
        po_number, 
        billing_type, 
        billing_rate,
        projects!inner(
          id,
          name
        )
      `)
      .in('project_id', projectIds);
    
    if (mErr) throw mErr;

    projectMappings = mappings || [];
    
    // Track employees assigned to projects
    projectMappings.forEach(m => {
      assignedEmployeeIds.add(m.employee_id);
    });
  }

  // Get employees assigned to projects under this client
  const { data: projectAssignedEmployees, error: projectError } = await supabase
    .from('employees')
    .select('*')
    .in('id', Array.from(assignedEmployeeIds));
  
  if (projectError) throw projectError;

  // Combine both sets of employees (remove duplicates)
  const allEmployeeIds = new Set([
    ...(clientFieldEmployees || []).map(emp => emp.id),
    ...(projectAssignedEmployees || []).map(emp => emp.id)
  ]);

  // Get all unique employees
  const { data: allEmployees, error: allEmployeesError } = await supabase
    .from('employees')
    .select('*')
    .in('id', Array.from(allEmployeeIds));
  
  if (allEmployeesError) throw allEmployeesError;

  if (!allEmployees || allEmployees.length === 0) {
    return [];
  }

  // Build PO number mapping and track assigned employees
  let poByEmployee: Record<string, string> = {};
  const assignedEmployeeIdsSet = new Set<string>();

  projectMappings.forEach((m: any) => {
    assignedEmployeeIdsSet.add(m.employee_id);
    if (m.po_number && !poByEmployee[m.employee_id]) {
      poByEmployee[m.employee_id] = m.po_number;
    }
  });

  // Build assignment data mapping for billing and rate information
  const assignmentDataByEmployee: Record<string, any> = {};
  projectMappings.forEach((m: any) => {
    assignmentDataByEmployee[m.employee_id] = {
      poNumber: m.po_number || '',
      billing: m.billing_type || '',
      rate: m.billing_rate || 0
    };
  });

  // Transform employees and sort: project-assigned first, then unassigned
  const employeesWithAssignmentStatus = (allEmployees || [])
    .map((row: any) => {
      const isAssigned = assignedEmployeeIdsSet.has(row.id);
      const assignmentData = assignmentDataByEmployee[row.id] || {};
      
      // Get project names for assigned employees
      const projectNames = isAssigned ? projectMappings
        .filter(m => m.employee_id === row.id)
        .map(m => m.projects?.name || 'Unknown Project')
        .join(', ') : 'Not Assigned';
      
      return {
        id: row.id,
        sNo: row.s_no,
        employeeId: row.employee_id,
        name: row.name,
        email: row.email,
        department: row.department,
        designation: row.designation,
        modeOfManagement: row.mode_of_management,
        client: clientName, // Use the client name from the query parameter
        billabilityStatus: row.billability_status,
        poNumber: poByEmployee[row.id] ?? row.po_number ?? '',
        billing: assignmentData.billing || row.billing || '', // ✅ Get from assignment first
        lastActiveDate: row.last_active_date || '',
        projects: projectNames, // Show actual project names or 'Not Assigned'
        billabilityPercentage: row.billability_percentage,
        projectStartDate: row.project_start_date || '',
        projectEndDate: row.project_end_date || '',
        experienceBand: row.experience_band,
        rate: assignmentData.rate || row.rate || 0,
        ageing: row.ageing,
        benchDays: row.bench_days,
        phoneNumber: row.phone_number || '',
        emergencyContact: row.emergency_contact || '',
        ctc: row.ctc,
        remarks: row.remarks || '',
        lastModifiedBy: row.last_modified_by || '',
        lastUpdated: row.updated_at,
        position: row.position || '',
        joiningDate: row.joining_date || '',
        location: row.location || '',
        manager: row.manager || '',
        skills: row.skills || [],
        isAssigned: isAssigned, // Add flag for sorting
        employeeProjects: isAssigned ? projectMappings
          .filter(m => m.employee_id === row.id)
          .map(m => ({
            id: m.project_id,
            projectId: m.project_id,
            projectName: m.projects?.name || 'Unknown Project',
            client: clientName,
            allocationPercentage: 100, // Default since we don't store this in the mapping
            startDate: new Date().toISOString().slice(0, 10),
            endDate: undefined,
            roleInProject: 'Team Member',
            poNumber: m.po_number || '',
            poAmendments: []
          })) : []
      };
    })
    .sort((a, b) => {
      // Project-assigned employees first, then unassigned
      if (a.isAssigned && !b.isAssigned) return -1;
      if (!a.isAssigned && b.isAssigned) return 1;
      
      // If both are assigned or both unassigned, sort by name
      return a.name.localeCompare(b.name);
    });

  return employeesWithAssignmentStatus;
}

  static async createProject(input: { name: string; client: string; start_date?: string; end_date?: string | null; status?: string; po_number?: string | null; budget?: number | null; }): Promise<{ id: string }> {
    try {
      const { ProjectApi } = await import('./api/projectApi');
      const project = await ProjectApi.createProject({
        name: input.name,
        client: input.client,
        start_date: input.start_date || new Date().toISOString().slice(0, 10),
        end_date: input.end_date || null,
        status: input.status || 'Active',
        po_number: input.po_number || null
      });
      
      return { id: project._id || project.id || '' };
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  static async linkEmployeeToProject(params: { employeeId: string; projectId: string; allocationPercentage?: number; roleInProject?: string | null; startDate?: string; endDate?: string | null;billing?: string;
  rate?: number; }): Promise<void> {
    try {
      const { ProjectApi } = await import('./api/projectApi');
      await ProjectApi.assignEmployeeToProject(params.projectId, {
        employee_id: params.employeeId,
        allocation_percentage: params.allocationPercentage ?? 100,
        role_in_project: params.roleInProject ?? null,
        start_date: params.startDate || new Date().toISOString().slice(0, 10),
        end_date: params.endDate || null,
        billing_type: params.billing || 'Monthly',
        billing_rate: params.rate || 0
      });
    } catch (error) {
      console.error('Error linking employee to project:', error);
      throw error;
    }
  }

  static async getAllClients(): Promise<string[]> {
    try {
      const { ClientApi } = await import('./api/clientApi');
      return await ClientApi.getAllClients();
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  }

  static async addClient(clientData: { name: string; contactPerson?: string; email?: string; phone?: string; address?: string; description?: string }): Promise<void> {
    try {
      const { ClientApi } = await import('./api/clientApi');
      const { ProjectApi } = await import('./api/projectApi');
      
      // Check if client already exists
      const existingClients = await ClientApi.getAllClients();
      if (existingClients.some(c => c.toLowerCase() === clientData.name.toLowerCase())) {
        throw new Error('Client with this name already exists');
      }
      
      // Create a default project for the client
      await ProjectApi.createProject({
        name: clientData.name,
        client: clientData.name,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: null,
        status: 'Active',
        po_number: null
      });
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  }

  // Add this method to clean up existing default projects
static async migrateDefaultProjectNames(): Promise<void> {
  try {
    // Get all projects with __CLIENT_ONLY__ prefix
    const { data: oldDefaultProjects, error } = await supabase
      .from('projects')
      .select('id, name, client')
      .like('name', '__CLIENT_ONLY__%');
    
    if (error) throw error;
    
    if (oldDefaultProjects && oldDefaultProjects.length > 0) {
      for (const project of oldDefaultProjects) {
        // Update the project name to just the client name
        const { error: updateError } = await supabase
          .from('projects')
          .update({ name: project.client })
          .eq('id', project.id);
        
        if (updateError) {
          console.error(`Failed to update project ${project.id}:`, updateError);
        } else {
          console.log(`Updated project ${project.id} from "${project.name}" to "${project.client}"`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to migrate default project names:', error);
  }
}

  static async createFirstProjectForClient(clientName: string, projectData: {
    name: string;
    description?: string;
    department?: string;
    start_date: string;
    end_date?: string | null;
    status?: string;
    po_number?: string | null;
    currency?: string;
    billing_type?: string;
    team_size?: number;
  }): Promise<{ id: string }> {
    // Create the new project
    const result = await this.createProjectWithDetails({
      ...projectData,
      client: clientName
    });

    // Delete any default project for this client
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('client', clientName)
      .like('name', `__CLIENT_ONLY__%`);

    if (error) {
      console.warn('Failed to delete default project:', error);
      // Don't throw error here as the main project was created successfully
    }

    return result;
  }

  static async createProjectWithDetails(input: { 
    name: string; 
    client: string; 
    description?: string;
    department?: string;
    start_date: string; 
    end_date?: string | null; 
    status?: string; 
    po_number?: string | null; 
    currency?: string;
    billing_type?: string;
    team_size?: number;
  }): Promise<{ id: string }> {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: input.name,
        client: input.client,
        description: input.description || null,
        department: input.department || null,
        start_date: input.start_date,
        end_date: input.end_date || null,
        status: input.status || 'Active',
        po_number: input.po_number || null,
        currency: input.currency || 'USD',
        billing_type: input.billing_type || 'Fixed',
        team_size: input.team_size || 0
      } as any)
      .select('id')
      .single();
    if (error) throw error;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await NotificationService.createProjectNotification(
          'project_created',
          input.name,
          input.client,
          user.id,
          ['Admin', 'Lead']
        );
      }
    } catch (notificationError) {
      console.warn('Failed to create notification for project creation:', notificationError);
    }

    return { id: (data as any).id };
  }

  static async deleteProject(projectId: string): Promise<void> {
    const { data: project, error: projectFetchError } = await supabase
      .from('projects')
      .select('name, client')
      .eq('id', projectId)
      .single();
    
    if (projectFetchError) throw projectFetchError;

    const { data: mappings, error: mappingFetchError } = await supabase
      .from('employee_projects')
      .select('employee_id')
      .eq('project_id', projectId);
    
    if (mappingFetchError) throw mappingFetchError;

    if (mappings && mappings.length > 0) {
      const employeeIds = mappings.map(m => m.employee_id);
      const { error: updateError } = await supabase
        .from('employees')
        .update({ 
          billability_status: 'Bench',
          client: null,
          projects: null,
          billability_percentage: 0,
          project_start_date: null,
          project_end_date: null,
          last_active_date: new Date().toISOString().slice(0, 10)
        })
        .in('id', employeeIds);
      
      if (updateError) throw updateError;
    }

    const { error: mappingError } = await supabase
      .from('employee_projects')
      .delete()
      .eq('project_id', projectId);
    
    if (mappingError) throw mappingError;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (error) throw error;

    if (project) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await NotificationService.createProjectNotification(
            'project_deleted',
            project.name,
            project.client,
            user.id,
            ['Admin', 'Lead']
          );
        }
      } catch (notificationError) {
        console.warn('Failed to create notification for project deletion:', notificationError);
      }
    }
  }

  static async deleteClient(clientName: string): Promise<void> {
    const { data: clientEmployees, error: fetchError } = await supabase
      .from('employees')
      .select('id')
      .eq('client', clientName);
    
    if (fetchError) throw fetchError;

    if (clientEmployees && clientEmployees.length > 0) {
      const employeeIds = clientEmployees.map(emp => emp.id);
      const { error: updateError } = await supabase
        .from('employees')
        .update({ 
          billability_status: 'Bench',
          client: null,
          projects: null,
          billability_percentage: 0,
          project_start_date: null,
          project_end_date: null,
          last_active_date: new Date().toISOString().slice(0, 10)
        })
        .in('id', employeeIds);
      
      if (updateError) throw updateError;
    }

    const { data: clientProjects, error: projectsFetchError } = await supabase
      .from('projects')
      .select('id')
      .eq('client', clientName);
    
    if (projectsFetchError) throw projectsFetchError;

    if (clientProjects && clientProjects.length > 0) {
      const projectIds = clientProjects.map(p => p.id);
      const { error: mappingError } = await supabase
        .from('employee_projects')
        .delete()
        .in('project_id', projectIds);
      
      if (mappingError) throw mappingError;
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('client', clientName);
    
    if (error) throw error;
  }

  static async removeEmployeeFromProject(employeeId: string, projectId: string): Promise<void> {
    const { error } = await supabase
      .from('employee_projects')
      .delete()
      .eq('employee_id', employeeId)
      .eq('project_id', projectId);
    
    if (error) throw error;

    const { error: updateError } = await supabase
      .from('employees')
      .update({ 
        billability_status: 'Bench',
        projects: null,
        client: null
      })
      .eq('id', employeeId);
    
    if (updateError) throw updateError;
  }

  static async updateProject(projectId: string, updates: {
    name?: string;
    client?: string;
    description?: string;
    department?: string;
    start_date?: string;
    end_date?: string | null;
    status?: string;
    po_number?: string | null;
    currency?: string;
    billing_type?: string;
    team_size?: number;
  }): Promise<void> {
    const { data: project, error: projectFetchError } = await supabase
      .from('projects')
      .select('name, client')
      .eq('id', projectId)
      .single();
    
    if (projectFetchError) throw projectFetchError;

    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId);
    
    if (error) throw error;

    if (project) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await NotificationService.createProjectNotification(
            'project_updated',
            project.name,
            project.client,
            user.id,
            ['Admin', 'Lead']
          );
        }
      } catch (notificationError) {
        console.warn('Failed to create notification for project update:', notificationError);
      }
    }
  }

  // ✅ ADD THE MISSING METHOD - PO Amendment methods
  static async getPOAmendmentsForProject(projectId: string): Promise<POAmendment[]> {
    console.log('Fetching PO amendments for project:', projectId);
    
    const { data, error } = await supabase
      .from('po_amendments')
      .select('*')
      .eq('project_id', projectId)
      .order('start_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching PO amendments:', error);
      throw error;
    }
    
    console.log('Fetched amendments:', data);
    return (data || []) as POAmendment[];
  }


  static async getActivePOAmendment(projectId: string): Promise<POAmendment | null> {
    const { data, error } = await supabase
      .from('po_amendments')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as POAmendment | null;
  }

  static async getActivePOAmendmentForProject(projectId: string): Promise<POAmendment | null> {
  const now = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD
  
  const { data, error } = await supabase
    .from('po_amendments')
    .select('*')
    .eq('project_id', projectId)
    .lte('start_date', now) // Start date is today or in past
    .or(`end_date.is.null,end_date.gte.${now}`) // No end date OR end date is in future
    .order('start_date', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error('Error fetching active PO amendment:', error);
    throw error;
  }
  
  return data && data.length > 0 ? (data[0] as POAmendment) : null;
}

static async recalculateActivePOAmendment(projectId: string): Promise<POAmendment | null> {
  // First deactivate all amendments for this project
  const { error: deactivateError } = await supabase
    .from('po_amendments')
    .update({ is_active: false })
    .eq('project_id', projectId);
  
  if (deactivateError) throw deactivateError;
  
  // Find and activate the appropriate amendment based on current date
  const activeAmendment = await this.getActivePOAmendmentForProject(projectId);
  
  if (activeAmendment) {
    const { error: activateError } = await supabase
      .from('po_amendments')
      .update({ is_active: true })
      .eq('id', activeAmendment.id);
    
    if (activateError) throw activateError;
    
    // Return the updated amendment
    return { ...activeAmendment, is_active: true };
  }
  
  return null;
}

static async createPOAmendment(projectId: string, poData: {
  po_number: string;
  start_date: string;
  end_date?: string | null;
}): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('po_amendments')
    .insert({
      project_id: projectId,
      po_number: poData.po_number,
      start_date: poData.start_date,
      end_date: poData.end_date || null,
      is_active: false // Start as inactive, will be recalculated
    })
    .select('id')
    .single();
  
  if (error) throw error;
  
  // Recalculate active amendment after creating new one
  await this.recalculateActivePOAmendment(projectId);
  
  return { id: (data as any).id };
}

static async updatePOAmendment(amendmentId: string, updates: {
  po_number: string;
  start_date: string;
  end_date?: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from('po_amendments')
    .update(updates)
    .eq('id', amendmentId);
  
  if (error) throw error;
  
  // Get project ID and recalculate active amendment
  const { data: amendment } = await supabase
    .from('po_amendments')
    .select('project_id')
    .eq('id', amendmentId)
    .single();
  
  if (amendment) {
    await this.recalculateActivePOAmendment(amendment.project_id);
  }
}

  static async deletePOAmendment(amendmentId: string): Promise<void> {
    const { error } = await supabase
      .from('po_amendments')
      .delete()
      .eq('id', amendmentId);
    
    if (error) throw error;
  }

  static async activatePOAmendment(amendmentId: string): Promise<void> {
    const { error } = await supabase
      .from('po_amendments')
      .update({ is_active: true })
      .eq('id', amendmentId);
    
    if (error) throw error;
  }

  static async deactivatePOAmendment(amendmentId: string): Promise<void> {
    const { error } = await supabase
      .from('po_amendments')
      .update({ is_active: false })
      .eq('id', amendmentId);
    
    if (error) throw error;
  }

  static async deactivateOldPOAmendments(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('po_amendments')
      .update({ is_active: false })
      .eq('project_id', projectId)
      .eq('is_active', true);
    
    if (error) throw error;
  }
}