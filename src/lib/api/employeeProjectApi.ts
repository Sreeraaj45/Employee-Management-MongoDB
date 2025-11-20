import { apiClient } from '../apiClient';

export class EmployeeProjectApi {
  /**
   * Update an employee project assignment
   */
  static async updateEmployeeProject(
    projectId: string,
    employeeId: string,
    assignmentData: {
      allocation_percentage?: number;
      start_date?: string;
      end_date?: string | null;
      role_in_project?: string;
      po_number?: string;
      billing_type?: string;
      billing_rate?: number;
    }
  ): Promise<any> {
    try {
      const response = await apiClient.put(
        `/api/projects/${projectId}/employees/${employeeId}`,
        assignmentData
      );
      return response;
    } catch (error) {
      console.error('Error updating employee project:', error);
      throw error;
    }
  }

  /**
   * Delete an employee project assignment
   */
  static async deleteEmployeeProject(projectId: string, employeeId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/projects/${projectId}/employees/${employeeId}`);
    } catch (error) {
      console.error('Error deleting employee project:', error);
      throw error;
    }
  }

  /**
   * Assign employee to project
   */
  static async assignEmployeeToProject(
    projectId: string,
    assignmentData: {
      employee_id: string;
      allocation_percentage?: number;
      start_date: string;
      end_date?: string | null;
      role_in_project?: string;
      po_number?: string;
      billing_type?: string;
      billing_rate?: number;
    }
  ): Promise<any> {
    try {
      const response = await apiClient.post(
        `/api/projects/${projectId}/employees`,
        assignmentData
      );
      return response;
    } catch (error) {
      console.error('Error assigning employee to project:', error);
      throw error;
    }
  }
}
