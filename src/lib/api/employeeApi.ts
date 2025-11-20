import { apiClient } from '../apiClient';
import { Employee } from '../../types';

export class EmployeeApi {
  static async getAllEmployees(): Promise<Employee[]> {
    try {
      const response = await apiClient.get<{ employees: Employee[] }>('/api/employees');
      return response.employees;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  static async getEmployeeById(id: string): Promise<Employee> {
    try {
      const response = await apiClient.get<{ employee: Employee }>(`/api/employees/${id}`);
      return response.employee;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  }

  static async createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
    try {
      const response = await apiClient.post<{ employee: Employee }>('/api/employees', employeeData);
      return response.employee;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  static async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<Employee> {
    try {
      const response = await apiClient.put<{ employee: Employee }>(`/api/employees/${id}`, employeeData);
      return response.employee;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  static async deleteEmployee(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/employees/${id}`);
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  static async bulkCreateEmployees(employees: Partial<Employee>[], conflictResolution: 'skip' | 'overwrite' = 'skip'): Promise<any> {
    try {
      const response = await apiClient.post('/api/employees/bulk', { employees, conflictResolution });
      return response;
    } catch (error) {
      console.error('Error bulk creating employees:', error);
      throw error;
    }
  }

  static async bulkDeleteEmployees(ids: string[]): Promise<void> {
    try {
      await apiClient.delete('/api/employees/bulk').then(() => 
        apiClient.post('/api/employees/bulk-delete', { ids })
      );
    } catch (error) {
      console.error('Error bulk deleting employees:', error);
      throw error;
    }
  }
}
