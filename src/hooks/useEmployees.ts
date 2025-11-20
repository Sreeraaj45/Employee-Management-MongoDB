import { useState, useEffect, useCallback } from 'react';
import { Employee, ConflictData, ConflictResolution } from '../types';
import { EmployeeService } from '../lib/employeeService';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all employees
  const fetchEmployees = useCallback(async () => {
    // Check if user is authenticated before fetching
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await EmployeeService.getAllEmployees();
      setEmployees(data);
      setAllEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new employee
  const createEmployee = useCallback(async (employeeData: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>) => {
    try {
      setError(null);
      setLoading(true);
      const newEmployee = await EmployeeService.createEmployee(employeeData);
      // Refetch to ensure s_no, ordering, and joined fields are accurate
      await fetchEmployees();
      return newEmployee;
    } catch (err) {
      const errorMessage = (err as any)?.message || 'Failed to create employee';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees]);

  // Update employee
  const updateEmployee = useCallback(async (id: string, employeeData: Partial<Employee>) => {
    try {
      setError(null);
      setLoading(true);
      const updatedEmployee = await EmployeeService.updateEmployee(id, employeeData);
      // Refetch to pick up DB-calculated fields and keep ordering consistent
      await fetchEmployees();
      return updatedEmployee;
    } catch (err) {
      const errorMessage = (err as any)?.message || 'Failed to update employee';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees]);

  // Delete employee
  const deleteEmployee = useCallback(async (id: string) => {
    try {
      setError(null);
      await EmployeeService.deleteEmployee(id);
      // Refetch to ensure s_no is refreshed and ordering is correct
      await fetchEmployees();
    } catch (err) {
      const errorMessage = (err as any)?.message || 'Failed to delete employee';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchEmployees]);

  // Mass delete employees
  const massDeleteEmployees = useCallback(async (ids: string[]) => {
    try {
      setError(null);
      setLoading(true);
      await EmployeeService.massDeleteEmployees(ids);
      // Refetch to ensure s_no is refreshed and ordering is correct
      await fetchEmployees();
    } catch (err) {
      const errorMessage = (err as any)?.message || 'Failed to mass delete employees';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees]);

  
  // Bulk upload employees
  const bulkUploadEmployees = useCallback(async (employeesData: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[]) => {
    try {
      setError(null);
      setLoading(true);
      
      // ✅ ADD THIS: Filter out employees with duplicate emails within the current batch
      const uniqueEmails = new Set();
      const employeesToUpload = employeesData.filter(employee => {
        // Allow employees without email
        if (!employee.email || employee.email.trim() === '') {
          return true;
        }
        
        const emailLower = employee.email.toLowerCase();
        
        // Check for duplicates within the current batch
        if (uniqueEmails.has(emailLower)) {
          console.warn(`Skipping duplicate email in current batch: ${employee.email}`);
          return false;
        }
        
        uniqueEmails.add(emailLower);
        return true;
      });

      if (employeesToUpload.length === 0) {
        throw new Error('No valid employees to upload after filtering duplicates');
      }

      // ✅ ADD THIS: Check for conflicts with existing employees
      const existingEmails = new Set(allEmployees.map(emp => emp.email.toLowerCase()));
      const employeesWithoutConflicts = employeesToUpload.filter(employee => {
        if (!employee.email) return true;
        return !existingEmails.has(employee.email.toLowerCase());
      });

      if (employeesWithoutConflicts.length === 0) {
        throw new Error('All employees in this batch have email conflicts with existing employees. Please use conflict resolution.');
      }

      if (employeesWithoutConflicts.length < employeesToUpload.length) {
        console.warn(`Filtered out ${employeesToUpload.length - employeesWithoutConflicts.length} employees due to email conflicts`);
      }

      const newEmployees = await EmployeeService.bulkUploadEmployees(employeesWithoutConflicts);
      setEmployees(prev => [...prev, ...newEmployees]);
      setAllEmployees(prev => [...prev, ...newEmployees]);
      return newEmployees;
    } catch (err) {
      const errorMessage = (err as any)?.message || 'Failed to bulk upload employees';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [allEmployees]); // ✅ ADD allEmployees to dependencies

  // Bulk upload employees with conflict resolution
  const bulkUploadEmployeesWithConflicts = useCallback(async (
    employeesData: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[],
    resolutions: ConflictResolution[],
    conflicts: ConflictData[]
  ) => {
    try {
      setError(null);
      setLoading(true);
      const newEmployees = await EmployeeService.bulkUploadEmployeesWithConflicts(employeesData, resolutions, conflicts);
      // Refetch all employees to get updated data
      await fetchEmployees();
      return newEmployees;
    } catch (err) {
      const errorMessage = (err as any)?.message || 'Failed to bulk upload employees with conflicts';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees]);

  // Search employees
  const searchEmployees = useCallback(async (query: string) => {
    try {
      setError(null);
      setLoading(true);
      const results = await EmployeeService.searchEmployees(query);
      setEmployees(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search employees');
      console.error('Error searching employees:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get employees by department
  const getEmployeesByDepartment = useCallback(async (department: string) => {
    try {
      setError(null);
      setLoading(true);
      const results = await EmployeeService.getEmployeesByDepartment(department);
      setEmployees(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees by department');
      console.error('Error fetching employees by department:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get employees by status
  const getEmployeesByStatus = useCallback(async (status: string) => {
    try {
      setError(null);
      setLoading(true);
      const results = await EmployeeService.getEmployeesByStatus(status);
      setEmployees(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees by status');
      console.error('Error fetching employees by status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get employees by mode
  const getEmployeesByMode = useCallback(async (mode: string) => {
    try {
      setError(null);
      setLoading(true);
      const results = await EmployeeService.getEmployeesByMode(mode);
      setEmployees(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees by mode');
      console.error('Error fetching employees by mode:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset to all employees
  const resetToAllEmployees = useCallback(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get dashboard metrics
  const getDashboardMetrics = useCallback(() => {
    if (allEmployees.length === 0) {
      return {
        totalEmployees: 0,
        billableEmployees: 0,
        benchEmployees: 0,
        billabilityPercentage: 0,
        avgBenchDays: 0,
        departmentDistribution: {},
        ageingDistribution: {},
        clientDistribution: {},
        projectDistribution: {}
      };
    }

    // ✅ CORRECTED: Use actual value from your data - SUPPORT_FUNCTIONS
    const billableEmployees = allEmployees.filter(emp => 
      emp.billabilityStatus === 'Billable'
    ).length;
    
    const benchEmployees = allEmployees.filter(emp => 
      emp.billabilityStatus === 'Bench' && 
      emp.modeOfManagement !== 'SUPPORT_FUNCTIONS' // Use actual value from your data
    ).length;
    
    // ✅ CORRECTED: Calculate billability percentage
    const employeesForBenchCalculation = allEmployees.filter(emp => 
      emp.modeOfManagement !== 'SUPPORT_FUNCTIONS' || emp.billabilityStatus === 'Billable'
    );
    
    const effectiveBillabilityPercentage = employeesForBenchCalculation.length > 0 
      ? (billableEmployees / employeesForBenchCalculation.length) * 100 
      : 0;
    
    // ✅ CORRECTED: Calculate bench days excluding non-billable SUPPORT_FUNCTIONS employees
    const employeesWithValidBenchDays = allEmployees.filter(emp => 
      !(emp.modeOfManagement === 'SUPPORT_FUNCTIONS' && emp.billabilityStatus !== 'Billable')
    );
    
    const avgBenchDays = employeesWithValidBenchDays.length > 0 
      ? employeesWithValidBenchDays.reduce((sum, emp) => sum + emp.benchDays, 0) / employeesWithValidBenchDays.length 
      : 0;

    // Calculate department distribution
    const departmentDistribution = allEmployees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Calculate ageing distribution
    const ageingDistribution = allEmployees.reduce((acc, emp) => {
      if (emp.ageing <= 30) {
        acc['0-30 days'] = (acc['0-30 days'] || 0) + 1;
      } else if (emp.ageing <= 90) {
        acc['31-90 days'] = (acc['31-90 days'] || 0) + 1;
      } else if (emp.ageing <= 180) {
        acc['91-180 days'] = (acc['91-180 days'] || 0) + 1;
      } else {
        acc['180+ days'] = (acc['180+ days'] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    // Calculate client distribution
    const clientDistribution = allEmployees.reduce((acc, emp) => {
      const client = emp.client || 'Unassigned';
      acc[client] = (acc[client] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Calculate project distribution
    const projectDistribution = allEmployees.reduce((acc, emp) => {
      if (emp.employeeProjects && emp.employeeProjects.length > 0) {
        emp.employeeProjects.forEach(proj => {
          const projectName = proj.projectName || 'Unassigned';
          acc[projectName] = (acc[projectName] || 0) + 1;
        });
      } else {
        acc['Unassigned'] = (acc['Unassigned'] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalEmployees: allEmployees.length,
      billableEmployees,
      benchEmployees,
      billabilityPercentage: effectiveBillabilityPercentage,
      avgBenchDays,
      departmentDistribution,
      ageingDistribution,
      clientDistribution,
      projectDistribution
    };
  }, [allEmployees]);

  // Initial fetch
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    allEmployees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    massDeleteEmployees,
    bulkUploadEmployees,
    bulkUploadEmployeesWithConflicts,
    searchEmployees,
    getEmployeesByDepartment,
    getEmployeesByStatus,
    getEmployeesByMode,
    resetToAllEmployees,
    clearError,
    getDashboardMetrics,
    refetch: fetchEmployees
  };
};