import { apiClient } from '../apiClient';

export interface Project {
  _id: string;
  id?: string;
  name: string;
  client: string;
  start_date: string;
  end_date?: string;
  status: string;
  team_size?: number;
  department?: string;
  po_number?: string;
  created_at?: string;
  updated_at?: string;
}

export class ProjectApi {
  static async getAllProjects(): Promise<Project[]> {
    try {
      const response = await apiClient.get<{ projects: Project[] }>('/api/projects');
      return response.projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  static async getProjectById(id: string): Promise<Project> {
    try {
      const response = await apiClient.get<{ project: Project }>(`/api/projects/${id}`);
      return response.project;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  }

  static async createProject(projectData: Partial<Project>): Promise<Project> {
    try {
      const response = await apiClient.post<{ project: Project }>('/api/projects', projectData);
      return response.project;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  static async updateProject(id: string, projectData: Partial<Project>): Promise<Project> {
    try {
      const response = await apiClient.put<{ project: Project }>(`/api/projects/${id}`, projectData);
      return response.project;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  static async deleteProject(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/projects/${id}`);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  static async getProjectEmployees(id: string): Promise<any[]> {
    try {
      const response = await apiClient.get<{ employees: any[] }>(`/api/projects/${id}/employees`);
      return response.employees;
    } catch (error) {
      console.error('Error fetching project employees:', error);
      throw error;
    }
  }

  static async assignEmployeeToProject(projectId: string, assignmentData: any): Promise<any> {
    try {
      const response = await apiClient.post(`/api/projects/${projectId}/employees`, assignmentData);
      return response;
    } catch (error) {
      console.error('Error assigning employee to project:', error);
      throw error;
    }
  }

  static async removeEmployeeFromProject(projectId: string, employeeId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/projects/${projectId}/employees/${employeeId}`);
    } catch (error) {
      console.error('Error removing employee from project:', error);
      throw error;
    }
  }

  // Helper method to get projects by client
  static async getProjectsByClient(clientName: string): Promise<Project[]> {
    try {
      const allProjects = await this.getAllProjects();
      return allProjects.filter(p => p.client === clientName);
    } catch (error) {
      console.error('Error fetching projects by client:', error);
      throw error;
    }
  }

  // Helper method to check if project exists
  static async projectExists(name: string, client: string): Promise<boolean> {
    try {
      const allProjects = await this.getAllProjects();
      return allProjects.some(p => 
        p.name.toLowerCase() === name.toLowerCase() && 
        p.client.toLowerCase() === client.toLowerCase()
      );
    } catch (error) {
      console.error('Error checking project existence:', error);
      return false;
    }
  }
}
