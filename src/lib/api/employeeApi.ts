import { apiClient } from '../apiClient';
import { Employee } from '../../types';

export class EmployeeApi {
  // Helper to convert date formats
  private static convertDateFormat(dateStr: any): string | undefined {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    
    const trimmed = dateStr.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined;
    
    // Check if it's in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split('-');
      return `${year}-${month}-${day}`;
    }
    // Check if it's in DD/MM/YYYY format
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split('/');
      return `${year}-${month}-${day}`;
    }
    
    return trimmed;
  }

  // Transform camelCase to snake_case for backend
  private static toSnakeCase(employeeData: Partial<Employee>): any {
    const result: any = {};
    
    // Only include fields that are defined
    if (employeeData.employeeId !== undefined) result.employee_id = employeeData.employeeId;
    if (employeeData.name !== undefined) result.name = employeeData.name;
    if (employeeData.email !== undefined) result.email = employeeData.email || '';
    if (employeeData.department !== undefined) result.department = employeeData.department;
    if (employeeData.designation !== undefined) result.designation = employeeData.designation;
    if (employeeData.modeOfManagement !== undefined) result.mode_of_management = employeeData.modeOfManagement;
    if (employeeData.client !== undefined) result.client = employeeData.client;
    if (employeeData.billabilityStatus !== undefined) result.billability_status = employeeData.billabilityStatus;
    if (employeeData.poNumber !== undefined) result.po_number = employeeData.poNumber;
    if (employeeData.billing !== undefined) result.billing = employeeData.billing;
    if (employeeData.lastActiveDate !== undefined) result.last_active_date = this.convertDateFormat(employeeData.lastActiveDate);
    if (employeeData.projects !== undefined) result.projects = employeeData.projects;
    if (employeeData.billabilityPercentage !== undefined) result.billability_percentage = employeeData.billabilityPercentage;
    if (employeeData.projectStartDate !== undefined) result.project_start_date = this.convertDateFormat(employeeData.projectStartDate);
    if (employeeData.projectEndDate !== undefined) result.project_end_date = this.convertDateFormat(employeeData.projectEndDate);
    if (employeeData.experienceBand !== undefined) result.experience_band = employeeData.experienceBand;
    if (employeeData.rate !== undefined) result.rate = employeeData.rate;
    if (employeeData.ageing !== undefined) result.ageing = employeeData.ageing;
    if (employeeData.benchDays !== undefined) result.bench_days = employeeData.benchDays;
    if (employeeData.phoneNumber !== undefined) result.phone_number = employeeData.phoneNumber;
    if (employeeData.emergencyContact !== undefined) result.emergency_contact = employeeData.emergencyContact;
    if (employeeData.ctc !== undefined) result.ctc = employeeData.ctc;
    if (employeeData.remarks !== undefined) result.remarks = employeeData.remarks;
    if (employeeData.position !== undefined) result.position = employeeData.position;
    if (employeeData.joiningDate !== undefined) result.joining_date = this.convertDateFormat(employeeData.joiningDate);
    if (employeeData.location !== undefined) result.location = employeeData.location;
    if (employeeData.manager !== undefined) result.manager = employeeData.manager;
    if (employeeData.skills !== undefined) result.skills = employeeData.skills;
    if (employeeData.dateOfSeparation !== undefined) result.date_of_separation = this.convertDateFormat(employeeData.dateOfSeparation);
    
    return result;
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
