/**
 * Project Service (MongoDB Backend)
 * Handles project-related operations using the Express API
 */

import ApiClient from './apiClient';
import { Employee } from '../types';

export interface Project {
  id: string;
  name: string;
  client: string;
  description?: string;
  department?: string;
  startDate: Date;
  endDate?: Date;
  status: 'Active' | 'Completed' | 'On Hold' | 'Cancelled';
  poNumber?: string;
  budget?: number;
  teamSize?: number;
  currency?: string;
  billingType?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectResponse {
  project: any;
}

interface ProjectsResponse {
  projects: any[];
  count?: number;
}

interface ClientsResponse {
  clients: string[];
}

export class ProjectService {
  /**
   * Transform backend project data to frontend Project type
   */
  private static transformProject(data: any): Project {
    return {
      id: data._id,
      name: data.name,
      client: data.client,
      description: data.description,
      department: data.department,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      status: data.status,
      poNumber: data.po_number,
      budget: data.budget,
      teamSize: data.team_size,
      currency: data.currency,
      billingType: data.billing_type,
      createdBy: data.created_by,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }

  /**
   * Transform frontend project data to backend format
   */
  private static transformToBackend(project: Partial<Project>): any {
    return {
      name: project.name,
      client: project.client,
      description: project.description,
      department: project.department,
      start_date: project.startDate,
      end_date: project.endDate,
      status: project.status,
      po_number: project.poNumber,
      budget: project.budget,
      team_size: project.teamSize,
      currency: project.currency,
      billing_type: project.billingType,
    };
  }

  /**
   * Transform backend employee data to frontend Employee type
   */
  private static transformEmployee(data: any): Employee {
    return {
      id: data._id,
      sNo: data.s_no,
      employeeId: data.employee_id,
      name: data.name,
      email: data.email,
      department: data.department,
      designation: data.designation,
      modeOfManagement: data.mode_of_management,
      client: data.client,
      billabilityStatus: data.billability_status,
      poNumber: data.po_number,
      billing: data.billing,
      lastActiveDate: data.last_active_date ? new Date(data.last_active_date) : undefined,
      projects: data.projects,
      billabilityPercentage: data.billability_percentage,
      projectStartDate: data.project_start_date ? new Date(data.project_start_date) : undefined,
      projectEndDate: data.project_end_date ? new Date(data.project_end_date) : undefined,
      experienceBand: data.experience_band,
      rate: data.rate,
      ageing: data.ageing,
      benchDays: data.bench_days,
      phoneNumber: data.phone_number,
      emergencyContact: data.emergency_contact,
      ctc: data.ctc,
      remarks: data.remarks,
      lastModifiedBy: data.last_modified_by,
      position: data.position,
      joiningDate: data.joining_date ? new Date(data.joining_date) : undefined,
      contactNumber: data.contact_number,
      location: data.location,
      manager: data.manager,
      skills: data.skills || [],
      dateOfSeparation: data.date_of_separation ? new Date(data.date_of_separation) : undefined,
      lastUpdated: data.updated_at ? new Date(data.updated_at) : new Date(),
      employeeProjects: [],
    };
  }

  /**
   * Get all projects
   */
  static async getAllProjects(): Promise<Project[]> {
    try {
      const response = await ApiClient.get<ProjectsResponse>('/projects');
      return response.projects.map(proj => this.transformProject(proj));
    } catch (error) {
      console.error('Get all projects error:', error);
      throw error;
    }
  }

  /**
   * Get project by ID
   */
  static async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const response = await ApiClient.get<ProjectResponse>(`/projects/${projectId}`);
      return this.transformProject(response.project);
    } catch (error) {
      console.error('Get project by ID error:', error);
      return null;
    }
  }

  /**
   * Create new project
   */
  static async createProject(input: {
    name: string;
    client: string;
    start_date?: string;
    end_date?: string | null;
    status?: string;
    po_number?: string | null;
    budget?: number | null;
    description?: string;
    department?: string;
  }): Promise<{ id: string }> {
    try {
      const response = await ApiClient.post<ProjectResponse>('/projects', input);
      return { id: response.project._id };
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  }

  /**
   * Update project
   */
  static async updateProject(
    projectId: string,
    updates: {
      name?: string;
      client?: string;
      description?: string;
      department?: string;
      start_date?: string;
      end_date?: string | null;
      status?: string;
      po_number?: string | null;
      budget?: number | null;
      team_size?: number;
      currency?: string;
      billing_type?: string;
    }
  ): Promise<void> {
    try {
      await ApiClient.put(`/projects/${projectId}`, updates);
    } catch (error) {
      console.error('Update project error:', error);
      throw error;
    }
  }

  /**
   * Delete project
   */
  static async deleteProject(projectId: string): Promise<void> {
    try {
      await ApiClient.delete(`/projects/${projectId}`);
    } catch (error) {
      console.error('Delete project error:', error);
      throw error;
    }
  }

  /**
   * Get project employees
   */
  static async getProjectEmployees(projectId: string): Promise<Employee[]> {
    try {
      const response = await ApiClient.get<{ employees: any[] }>(`/projects/${projectId}/employees`);
      return response.employees.map(emp => this.transformEmployee(emp));
    } catch (error) {
      console.error('Get project employees error:', error);
      throw error;
    }
  }

  /**
   * Link employee to project
   */
  static async linkEmployeeToProject(params: {
    employeeId: string;
    projectId: string;
    allocationPercentage?: number;
    roleInProject?: string | null;
    startDate?: string;
    endDate?: string | null;
    billing?: string;
    rate?: number;
  }): Promise<void> {
    try {
      await ApiClient.post(`/projects/${params.projectId}/employees`, {
        employee_id: params.employeeId,
        allocation_percentage: params.allocationPercentage,
        role_in_project: params.roleInProject,
        start_date: params.startDate,
        end_date: params.endDate,
        billing_type: params.billing,
        billing_rate: params.rate,
      });
    } catch (error) {
      console.error('Link employee to project error:', error);
      throw error;
    }
  }

  /**
   * Remove employee from project
   */
  static async removeEmployeeFromProject(employeeId: string, projectId: string): Promise<void> {
    try {
      await ApiClient.delete(`/projects/${projectId}/employees/${employeeId}`);
    } catch (error) {
      console.error('Remove employee from project error:', error);
      throw error;
    }
  }

  /**
   * Get all clients
   */
  static async getAllClients(): Promise<string[]> {
    try {
      const response = await ApiClient.get<ClientsResponse>('/clients');
      return response.clients;
    } catch (error) {
      console.error('Get all clients error:', error);
      throw error;
    }
  }

  /**
   * Add client
   */
  static async addClient(clientData: {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    description?: string;
  }): Promise<void> {
    try {
      await ApiClient.post('/clients', clientData);
    } catch (error) {
      console.error('Add client error:', error);
      throw error;
    }
  }

  /**
   * Delete client
   */
  static async deleteClient(clientName: string): Promise<void> {
    try {
      await ApiClient.delete(`/clients/${encodeURIComponent(clientName)}`);
    } catch (error) {
      console.error('Delete client error:', error);
      throw error;
    }
  }

  /**
   * Create project with details
   */
  static async createProjectWithDetails(input: {
    name: string;
    client: string;
    description?: string;
    department?: string;
    start_date: string;
    end_date?: string | null;
    status?: string;
    po_number?: string | null;
    budget?: number | null;
    team_size?: number;
    currency?: string;
    billing_type?: string;
  }): Promise<{ id: string }> {
    try {
      const response = await ApiClient.post<ProjectResponse>('/projects', input);
      return { id: response.project._id };
    } catch (error) {
      console.error('Create project with details error:', error);
      throw error;
    }
  }

  /**
   * Get client employees
   */
  static async getClientEmployees(clientName: string): Promise<Employee[]> {
    try {
      const response = await ApiClient.get<{ employees: any[] }>(
        `/employees?client=${encodeURIComponent(clientName)}`
      );
      return response.employees.map(emp => this.transformEmployee(emp));
    } catch (error) {
      console.error('Get client employees error:', error);
      throw error;
    }
  }
}

export default ProjectService;
