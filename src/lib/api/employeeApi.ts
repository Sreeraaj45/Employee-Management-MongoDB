import { apiClient } from '../apiClient';
import { Employee } from '../../types';

export class EmployeeApi {
  // Transform camelCase to snake_case for backend
  private static toSnakeCase(employeeData: Partial<Employee>): any {
    return {
      employee_id: employeeData.employeeId,
      name: employeeData.name,
      email: employeeData.email,
      department: employeeData.department,
      designation: employeeData.designation,
      mode_of_management: employeeData.modeOfManagement,
      client: employeeData.client,
      billability_status: employeeData.billabilityStatus,
      po_number: employeeData.poNumber,
      billing: employeeData.billing,
      last_active_date: employeeData.lastActiveDate,
      projects: employeeData.projects,
      billability_percentage: employeeData.billabilityPercentage,
      project_start_date: employeeData.projectStartDate,
      project_end_date: employeeData.projectEndDate,
      experience_band: employeeData.experienceBand,
      rate: employeeData.rate,
      ageing: employeeData.ageing,
      bench_days: employeeData.benchDays,
      phone_number: employeeData.phoneNumber,
      emergency_contact: employeeData.emergencyContact,
      ctc: employeeData.ctc,
      remarks: employeeData.remarks,
      position: employeeData.position,
      joining_date: employeeData.joiningDate,
      location: employeeData.location,
      manager: employeeData.manager,
      skills: employeeData.skills,
      date_of_separation: employeeData.dateOfSeparation,
    };
  }

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
      const snakeCaseData = this.toSnakeCase(employeeData);
      const response = await apiClient.post<{ employee: Employee }>('/api/employees', snakeCaseData);
      return response.employee;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  static async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<Employee> {
    try {
      const snakeCaseData = this.toSnakeCase(employeeData);
      const response = await apiClient.put<{ employee: Employee }>(`/api/employees/${id}`, snakeCaseData);
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
      // Transform all employees to snake_case
      const snakeCaseEmployees = employees.map(emp => this.toSnakeCase(emp));
      const response = await apiClient.post('/api/employees/bulk', { 
        employees: snakeCaseEmployees, 
        conflictResolution 
      });
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
