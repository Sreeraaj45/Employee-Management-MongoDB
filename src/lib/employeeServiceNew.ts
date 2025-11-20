/**
 * Employee Service (MongoDB Backend)
 * Handles employee-related operations using the Express API
 */

import ApiClient from './apiClient';
import { Employee, EmployeeProject, ConflictResolution } from '../types';

interface EmployeeResponse {
  employee: any;
}

interface EmployeesResponse {
  employees: any[];
  count?: number;
}

interface BulkUploadResponse {
  message: string;
  employees: any[];
  conflicts?: any[];
}

export class EmployeeService {
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
      employeeProjects: [] // Will be populated separately if needed
    };
  }

  /**
   * Transform frontend employee data to backend format
   */
  private static transformToBackend(employee: Partial<Employee>): any {
    return {
      employee_id: employee.employeeId,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      designation: employee.designation,
      mode_of_management: employee.modeOfManagement,
      client: employee.client,
      billability_status: employee.billabilityStatus,
      po_number: employee.poNumber,
      billing: employee.billing,
      last_active_date: employee.lastActiveDate,
      projects: employee.projects,
      billability_percentage: employee.billabilityPercentage,
      project_start_date: employee.projectStartDate,
      project_end_date: employee.projectEndDate,
      experience_band: employee.experienceBand,
      rate: employee.rate,
      ageing: employee.ageing,
      bench_days: employee.benchDays,
      phone_number: employee.phoneNumber,
      emergency_contact: employee.emergencyContact,
      ctc: employee.ctc,
      remarks: employee.remarks,
      position: employee.position,
      joining_date: employee.joiningDate,
      contact_number: employee.contactNumber,
      location: employee.location,
      manager: employee.manager,
      skills: employee.skills,
      date_of_separation: employee.dateOfSeparation
    };
  }

  /**
   * Get all employees
   */
  static async getAllEmployees(): Promise<Employee[]> {
    try {
      const response = await ApiClient.get<EmployeesResponse>('/employees');
      return response.employees.map(emp => this.transformEmployee(emp));
    } catch (error) {
      console.error('Get all employees error:', error);
      throw error;
    }
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const response = await ApiClient.get<EmployeeResponse>(`/employees/${id}`);
      return this.transformEmployee(response.employee);
    } catch (error) {
      console.error('Get employee by ID error:', error);
      return null;
    }
  }

  /**
   * Create new employee
   */
  static async createEmployee(employeeData: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>): Promise<Employee> {
    try {
      const backendData = this.transformToBackend(employeeData);
      const response = await ApiClient.post<EmployeeResponse>('/employees', backendData);
      return this.transformEmployee(response.employee);
    } catch (error) {
      console.error('Create employee error:', error);
      throw error;
    }
  }

  /**
   * Update employee
   */
  static async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<Employee> {
    try {
      const backendData = this.transformToBackend(employeeData);
      const response = await ApiClient.put<EmployeeResponse>(`/employees/${id}`, backendData);
      return this.transformEmployee(response.employee);
    } catch (error) {
      console.error('Update employee error:', error);
      throw error;
    }
  }

  /**
   * Delete employee
   */
  static async deleteEmployee(id: string): Promise<void> {
    try {
      await ApiClient.delete(`/employees/${id}`);
    } catch (error) {
      console.error('Delete employee error:', error);
      throw error;
    }
  }

  /**
   * Bulk upload employees
   */
  static async bulkUploadEmployees(employeesData: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[]): Promise<Employee[]> {
    try {
      const backendData = employeesData.map(emp => this.transformToBackend(emp));
      const response = await ApiClient.post<BulkUploadResponse>('/employees/bulk', {
        employees: backendData
      });
      return response.employees.map(emp => this.transformEmployee(emp));
    } catch (error) {
      console.error('Bulk upload employees error:', error);
      throw error;
    }
  }

  /**
   * Bulk upload employees with conflict resolution
   */
  static async bulkUploadEmployeesWithConflicts(
    employeesData: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[],
    resolutions: ConflictResolution[]
  ): Promise<Employee[]> {
    try {
      const backendData = employeesData.map(emp => this.transformToBackend(emp));
      const response = await ApiClient.post<BulkUploadResponse>('/employees/bulk', {
        employees: backendData,
        resolutions
      });
      return response.employees.map(emp => this.transformEmployee(emp));
    } catch (error) {
      console.error('Bulk upload with conflicts error:', error);
      throw error;
    }
  }

  /**
   * Mass delete employees
   */
  static async massDeleteEmployees(ids: string[]): Promise<void> {
    try {
      await ApiClient.post('/employees/bulk-delete', { ids });
    } catch (error) {
      console.error('Mass delete employees error:', error);
      throw error;
    }
  }

  /**
   * Search employees
   */
  static async searchEmployees(query: string): Promise<Employee[]> {
    try {
      const response = await ApiClient.get<EmployeesResponse>(`/employees?search=${encodeURIComponent(query)}`);
      return response.employees.map(emp => this.transformEmployee(emp));
    } catch (error) {
      console.error('Search employees error:', error);
      throw error;
    }
  }

  /**
   * Get employees by department
   */
  static async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    try {
      const response = await ApiClient.get<EmployeesResponse>(`/employees?department=${encodeURIComponent(department)}`);
      return response.employees.map(emp => this.transformEmployee(emp));
    } catch (error) {
      console.error('Get employees by department error:', error);
      throw error;
    }
  }

  /**
   * Get employees by billability status
   */
  static async getEmployeesByStatus(status: string): Promise<Employee[]> {
    try {
      const response = await ApiClient.get<EmployeesResponse>(`/employees?billability_status=${encodeURIComponent(status)}`);
      return response.employees.map(emp => this.transformEmployee(emp));
    } catch (error) {
      console.error('Get employees by status error:', error);
      throw error;
    }
  }

  /**
   * Get employees by mode of management
   */
  static async getEmployeesByMode(mode: string): Promise<Employee[]> {
    try {
      const response = await ApiClient.get<EmployeesResponse>(`/employees?mode_of_management=${encodeURIComponent(mode)}`);
      return response.employees.map(emp => this.transformEmployee(emp));
    } catch (error) {
      console.error('Get employees by mode error:', error);
      throw error;
    }
  }

  /**
   * Update employee project assignments
   */
  static async updateEmployeeProjects(employeeId: string, employeeProjects: EmployeeProject[]): Promise<void> {
    try {
      await ApiClient.put(`/employees/${employeeId}/projects`, {
        projects: employeeProjects
      });
    } catch (error) {
      console.error('Update employee projects error:', error);
      throw error;
    }
  }
}

export default EmployeeService;
