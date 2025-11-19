// services/dashboardService.ts
import { supabase } from './supabase';
import { ProjectService } from './projectService';

export interface DashboardMetrics {
  totalEmployees: number;
  billableEmployees: number;
  benchEmployees: number;
  billabilityPercentage: number;
  departmentDistribution: Record<string, number>;
  clientDistribution: Record<string, number>;
  projectDistribution: Record<string, number>;
}

export class DashboardService {
  static async calculateDashboardMetrics(): Promise<DashboardMetrics> {
    // Get all necessary data in parallel for better performance
    const [
      employeesData,
      clientsWithProjects,
      allProjects
    ] = await Promise.all([
      this.getEmployeesData(),
      ProjectService.getClientsWithProjects(),
      ProjectService.getAllProjects()
    ]);

    // Calculate basic metrics
    const totalEmployees = employeesData.length;
    const billableEmployees = employeesData.filter(emp => 
      emp.billabilityStatus === 'Billable'
    ).length;
    const benchEmployees = employeesData.filter(emp => 
      emp.billabilityStatus === 'Bench'
    ).length;
    const billabilityPercentage = totalEmployees > 0 ? 
      (billableEmployees / totalEmployees) * 100 : 0;

    // Calculate department distribution
    const departmentDistribution = this.calculateDepartmentDistribution(employeesData);

    // Calculate client distribution
    const clientDistribution = this.calculateClientDistribution(clientsWithProjects);

    // Calculate project distribution
    const projectDistribution = await this.calculateProjectDistribution(allProjects);

    return {
      totalEmployees,
      billableEmployees,
      benchEmployees,
      billabilityPercentage,
      departmentDistribution,
      clientDistribution,
      projectDistribution
    };
  }

  private static async getEmployeesData(): Promise<any[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  private static calculateDepartmentDistribution(employees: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    employees.forEach(employee => {
      const department = employee.department || 'Unassigned';
      distribution[department] = (distribution[department] || 0) + 1;
    });
    
    return distribution;
  }

  private static calculateClientDistribution(clientsWithProjects: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    clientsWithProjects.forEach(client => {
      distribution[client.client] = client.totalEmployees || 0;
    });
    
    return distribution;
  }

  private static async calculateProjectDistribution(projects: any[]): Promise<Record<string, number>> {
    const distribution: Record<string, number> = {};
    
    // Get employee counts for all projects in parallel
    const projectEmployeeCounts = await Promise.all(
      projects.map(async (project) => {
        // Skip client placeholder projects
        if (project.name.startsWith('[Client]') || project.name.startsWith('__CLIENT_ONLY__')) {
          return { projectId: project.id, projectName: project.name, count: 0 };
        }
        
        const { count, error } = await supabase
          .from('employee_projects')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id);
        
        if (error) {
          console.error(`Error counting employees for project ${project.id}:`, error);
          return { projectId: project.id, projectName: project.name, count: 0 };
        }
        
        return { projectId: project.id, projectName: project.name, count: count || 0 };
      })
    );

    // Create distribution map
    projectEmployeeCounts.forEach(({ projectName, count }) => {
      if (count > 0 && !projectName.startsWith('[Client]') && !projectName.startsWith('__CLIENT_ONLY__')) {
        distribution[projectName] = count;
      }
    });
    
    return distribution;
  }

  // Alternative method to get only client distribution
  static async getClientDistribution(): Promise<Record<string, number>> {
    const clientsWithProjects = await ProjectService.getClientsWithProjects();
    return this.calculateClientDistribution(clientsWithProjects);
  }

  // Alternative method to get only project distribution
  static async getProjectDistribution(): Promise<Record<string, number>> {
    const projects = await ProjectService.getAllProjects();
    return this.calculateProjectDistribution(projects);
  }

  // Method to get real-time counts (useful for refreshing data)
  static async getRealTimeCounts() {
    const [
      { count: totalEmployees, error: totalError },
      { count: billableEmployees, error: billableError },
      { count: benchEmployees, error: benchError }
    ] = await Promise.all([
      supabase.from('employees').select('*', { count: 'exact', head: true }),
      supabase.from('employees').select('*', { count: 'exact', head: true }).eq('billability_status', 'Billable'),
      supabase.from('employees').select('*', { count: 'exact', head: true }).eq('billability_status', 'Bench')
    ]);

    if (totalError || billableError || benchError) {
      throw new Error('Error fetching employee counts');
    }

    return {
      totalEmployees: totalEmployees || 0,
      billableEmployees: billableEmployees || 0,
      benchEmployees: benchEmployees || 0
    };
  }
}