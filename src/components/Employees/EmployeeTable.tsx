import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Upload,
  RefreshCw,
  Settings,
  Trash,
  MoreVertical,
  FileText,
  ChevronUp
} from 'lucide-react';
import { Employee, ConflictData, ConflictResolution } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useEmployees } from '../../hooks/useEmployees';
import { useProjects } from '../../hooks/useProjects';
import { useDropdownOptions } from '../../hooks/useDropdownOptions';
import { ExcelParser } from '../../lib/excelParser';
import { ConflictResolutionModal } from './ConflictResolutionModal';
import { showDeleteConfirm, showSuccess, showError } from '../../lib/sweetAlert';
import { SkeletonTable } from '../ui/SkeletonTable';
import { SkeletonEmployeeHeader } from '../ui/SkeletonEmployeeHeader';
import { SkeletonPagination } from '../ui/SkeletonPagination';
import { AmendPODialog } from '../Projects/AmendPODialog';
import { EmployeeProject } from '../../types';
import { CustomSelect } from './CustomSelect';
import { EmployeeService } from '../../lib/employeeService';

interface EmployeeTableProps {
  onEdit: (employee: Employee) => void;
  onAdd: () => void;
  onView: (employee: Employee) => void;
}

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  responsive?: string; // Tailwind responsive class like 'hidden lg:table-cell'
}

export const EmployeeTable = ({
  onEdit,
  onAdd,
  onView
}: EmployeeTableProps) => {
  // Add these state variables with other state declarations
  const [showAmendPODialog, setShowAmendPODialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedProject, setSelectedProject] = useState<EmployeeProject | null>(null);

  // Add this handler function with other handler functions
  const handleAmendPO = (employee: Employee, project: EmployeeProject) => {
    setSelectedEmployee(employee);
    setSelectedProject(project);
    setShowAmendPODialog(true);
  };

  // Rest of your existing code...
  const { user } = useAuth();
  const {
    allEmployees,
    loading,
    error,
    bulkUploadEmployees,
    bulkUploadEmployeesWithConflicts,
    clearError,
    deleteEmployee,
    massDeleteEmployees,
    refetch
  } = useEmployees();

  const { clientNames, getProjectsForClient } = useProjects();
  const { options } = useDropdownOptions();

  const handleDelete = async (id: string) => {
    const employee = allEmployees.find(emp => emp.id === id);
    const result = await showDeleteConfirm(
      'Delete Employee',
      'Are you sure you want to delete this employee? This action cannot be undone.',
      employee?.name || 'this employee'
    );

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteEmployee(id);
      showSuccess('Employee Deleted', `Employee "${employee?.name || 'Unknown'}" has been successfully deleted.`);
    } catch (err) {
      showError('Delete Failed', err instanceof Error ? err.message : 'Failed to delete employee');
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Employee>('sNo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [showConflictResolution, setShowConflictResolution] = useState(false);
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [showMassDeleteConfirm, setShowMassDeleteConfirm] = useState(false);
  const [showKebabMenu, setShowKebabMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  // Add this helper function to EmployeeTable component
  const calculateAgeing = (joiningDate: string): number => {
    if (!joiningDate) return 0;

    try {
      const joinDate = new Date(joiningDate);
      const today = new Date();

      // Reset time parts for accurate day calculation
      joinDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      // Calculate difference in days
      const diffTime = today.getTime() - joinDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      return Math.max(0, diffDays); // Ensure non-negative
    } catch (error) {
      console.error('Error calculating ageing:', error);
      return 0;
    }
  };

  const itemsPerPage = 10;

  // Column configuration
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([
    { key: 'checkbox', label: 'Select', visible: false },
    { key: 'sNo', label: 'S.No', visible: true },
    { key: 'employeeId', label: 'EMP ID', visible: true },
    { key: 'name', label: 'Employee Name', visible: true },
    { key: 'department', label: 'Department', visible: true },
    { key: 'designation', label: 'Designation', visible: true },
    { key: 'projects', label: 'Projects & Allocation', visible: true },
    { key: 'modeOfManagement', label: 'Mode of Management', visible: true },
    { key: 'billabilityStatus', label: 'Billability Status', visible: true },
    { key: 'lastActiveDate', label: 'Last Active Date', visible: true, responsive: 'hidden lg:table-cell' },
    { key: 'experienceBand', label: 'Experience Band', visible: true },
    { key: 'ageing', label: 'Ageing', visible: true },
    { key: 'ctc', label: 'CTC', visible: true, responsive: 'hidden lg:table-cell' },
    { key: 'benchDays', label: 'Bench Days', visible: true },
    { key: 'phoneNumber', label: 'Phone Number', visible: true, responsive: 'hidden xl:table-cell' },
    { key: 'emergencyContact', label: 'Emergency Number', visible: true, responsive: 'hidden xl:table-cell' },
    { key: 'remarks', label: 'Remarks', visible: true, responsive: 'hidden xl:table-cell' },
    { key: 'lastModifiedBy', label: 'Last Modified By', visible: true, responsive: 'hidden xl:table-cell' },
    { key: 'actions', label: 'Actions', visible: true }
  ]);
  // Get unique departments, statuses, and modes (from full dataset)
  const departments = useMemo(() => [...new Set(allEmployees.map(emp => emp.department))], [allEmployees]);
  const statuses = useMemo(() => [...new Set(allEmployees.map(emp => emp.billabilityStatus))], [allEmployees]);
  const modes = useMemo(() => [...new Set(allEmployees.map(emp => emp.modeOfManagement))], [allEmployees]);
  const [filterClient, setFilterClient] = useState('');
  const clients = useMemo(() => [...new Set(allEmployees.map(emp => emp.client).filter(Boolean))], [allEmployees]);

  // Reset pagination when filters/search change
  useEffect(() => {
    setCurrentPage(1);
    // Clear selected employees when filters change to avoid confusion
    setSelectedEmployees(new Set());
  }, [searchTerm, filterDepartment, filterStatus, filterMode, filterClient])
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      if (showColumnToggle && !target.closest('.column-toggle-dropdown')) {
        setShowColumnToggle(false);
      }

      if (showKebabMenu && !target.closest('.kebab-menu-dropdown')) {
        setShowKebabMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnToggle, showKebabMenu]);

  // In EmployeeTable component, add this useEffect
  useEffect(() => {
    const autoUpdateStatuses = async () => {
      if (!loading && allEmployees.length > 0) {
        console.log('🔄 Checking for employees needing status updates...');
        
        let updatedCount = 0;
        
        for (const employee of allEmployees) {
          try {
            const updatedEmployee = await EmployeeService.autoUpdateEmployeeStatus(employee);
            if (updatedEmployee) {
              updatedCount++;
            }
          } catch (error) {
            console.error(`Failed to update status for ${employee.name}:`, error);
          }
        }
        
        if (updatedCount > 0) {
          console.log(`✅ Auto-updated ${updatedCount} employee statuses`);
          // Refresh the data to show updated statuses
          refetch();
        }
      }
    };

    autoUpdateStatuses();
  }, [allEmployees, loading, refetch]);

  const isEmployeeInactive = (dateOfSeparation: string | undefined | null): boolean => {
    if (!dateOfSeparation) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dosDate = new Date(dateOfSeparation);
    dosDate.setHours(0, 0, 0, 0);
    
    // Employee is inactive if DOS is today or in the past
    return dosDate <= today;
  };

  // Derived filtered list (client-side, deterministic)
  const filteredEmployees = useMemo(() => {
    let data = allEmployees;
    
    if (filterDepartment) {
      data = data.filter(emp => emp.department === filterDepartment);
    }
    
    // Status filter - now includes active/inactive
    if (filterStatus) {
      if (filterStatus === 'active') {
        data = data.filter(emp => !isEmployeeInactive(emp.dateOfSeparation));
      } else if (filterStatus === 'inactive') {
        data = data.filter(emp => isEmployeeInactive(emp.dateOfSeparation));
      } else {
        // Regular billability status filter
        data = data.filter(emp => emp.billabilityStatus === filterStatus);
      }
    }
    
    if (filterMode) {
      data = data.filter(emp => emp.modeOfManagement === filterMode);
    }
    if (filterClient) {
      data = data.filter(emp => emp.client === filterClient);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      data = data.filter(emp => {
        const projectNames = emp.employeeProjects?.map(p => p.projectName).join(' ') || '';
        const haystack = [
          emp.employeeId,
          emp.name,
          emp.email,
          emp.department,
          emp.designation,
          emp.client,
          emp.manager,
          emp.location,
          (emp.skills || []).join(' '),
          projectNames
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return data;
  }, [allEmployees, filterDepartment, filterStatus, filterMode, filterClient, searchTerm, isEmployeeInactive]); // ✅ ADD isEmployeeInactive to dependencies

  // Sort employees
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle numeric sorting for sNo
    if (sortField === 'sNo') {
      aValue = aValue ?? 0;
      bValue = bValue ?? 0;

      if (sortDirection === 'asc') {
        return (aValue as number) - (bValue as number);
      } else {
        return (bValue as number) - (aValue as number);
      }
    }

    // Handle string sorting for other fields
    if (sortDirection === 'asc') {
      return (aValue ?? '') < (bValue ?? '') ? -1 : (aValue ?? '') > (bValue ?? '') ? 1 : 0;
    } else {
      return (aValue ?? '') > (bValue ?? '') ? -1 : (aValue ?? '') < (bValue ?? '') ? 1 : 0;
    }
  });

  // Paginate results
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = sortedEmployees.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof Employee) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleColumnVisibility = (columnKey: string) => {
    setColumnConfig(prev =>
      prev.map(col =>
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      )
    );
  };

  // Checkbox handling functions
  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedEmployees.size === paginatedEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(paginatedEmployees.map(emp => emp.id)));
    }
  };

  const handleMassDelete = async () => {
    if (selectedEmployees.size === 0) return;

    const result = await showDeleteConfirm(
      'Mass Delete Employees',
      `Are you sure you want to delete ${selectedEmployees.size} selected employee(s)? This action cannot be undone.`,
      `${selectedEmployees.size} employees`
    );

    if (!result.isConfirmed) {
      return;
    }

    try {
      await massDeleteEmployees(Array.from(selectedEmployees));
      setSelectedEmployees(new Set());
      setShowMassDeleteConfirm(false);
      showSuccess('Employees Deleted', `${selectedEmployees.size} employee(s) have been successfully deleted.`);
    } catch (err) {
      showError('Delete Failed', err instanceof Error ? err.message : 'Failed to delete employees');
    }
  };

  const getColumnClassName = (column: ColumnConfig) => {
    if (!column.visible) return 'hidden';
    return column.responsive || '';
  };

  // Enhanced refresh function in EmployeeTable
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // First update statuses, then refresh data
      console.log('🔄 Refreshing and updating employee statuses...');
      
      let updatedCount = 0;
      for (const employee of allEmployees) {
        const updatedEmployee = await EmployeeService.autoUpdateEmployeeStatus(employee);
        if (updatedEmployee) {
          updatedCount++;
        }
      }
      
      // Then refresh the data
      await refetch();
      
      if (updatedCount > 0) {
        showSuccess('Data Refreshed', `Employee data has been updated. ${updatedCount} statuses were automatically updated.`);
      } else {
        showSuccess('Data Refreshed', 'Employee data has been updated successfully.');
      }
    } catch (err) {
      showError('Refresh Failed', err instanceof Error ? err.message : 'Failed to refresh employee data.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderCellContent = (employee: Employee, columnKey: string) => {

    // ✅ FIX: Helper function to handle date display with special values
    const formatDateForDisplay = (dateValue: string | undefined): string => {
      if (!dateValue || dateValue.trim() === '') return 'NA';

      const trimmedDate = dateValue.trim();
      const lowerDate = trimmedDate.toLowerCase();

      // ✅ PRESERVE special values as they are
      if (lowerDate === 'milestone' || lowerDate === 'sow' || lowerDate === 'na') {
        return trimmedDate; // Return original value with correct casing
      }

      // Try to format as date, if it fails return original value
      try {
        return ExcelParser.formatDateToDDMMYYYY(trimmedDate);
      } catch {
        return trimmedDate; // Return original if can't parse as date
      }
    };

    // Add this helper function to check if PO is active
    const isPOActive = (startDate: string, endDate?: string): boolean => {
      if (!startDate) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today to start of day

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      // ✅ FIX: If end date exists, PO is active only until end date (inclusive)
      // Status changes from the next day after end date
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);

        // PO is active if today is between start date and end date (inclusive)
        const isAfterStart = today >= start;
        const isBeforeOrOnEnd = today <= end;

        return isAfterStart && isBeforeOrOnEnd;
      }

      // If no end date, PO is active if today is after start date
      return today >= start;
    };

    // ✅ ADD HELPER FUNCTION TO GET LATEST PO END DATE
    const getLatestPOEndDate = (projects: EmployeeProject[]): string => {
      let latestEndDate: string | null = null;

      projects.forEach(project => {
        // Check main PO end date
        if (project.endDate) {
          if (!latestEndDate || new Date(project.endDate) > new Date(latestEndDate)) {
            latestEndDate = project.endDate;
          }
        }

        // Check PO amendments end dates
        if (project.poAmendments) {
          project.poAmendments.forEach(amendment => {
            if (amendment.end_date) {
              if (!latestEndDate || new Date(amendment.end_date) > new Date(latestEndDate)) {
                latestEndDate = amendment.end_date;
              }
            }
          });
        }
      });

      return latestEndDate || '';
    };

    switch (columnKey) {
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={selectedEmployees.has(employee.id)}
            onChange={() => handleSelectEmployee(employee.id)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        );
      case 'sNo':
        return <span className="text-sm">{employee.sNo}</span>;
      case 'employeeId':
        return <span className="text-sm">{employee.employeeId}</span>;
      case 'name':
        console.log('Employee DOS:', employee.name, employee.dateOfSeparation);
        const isInactive = isEmployeeInactive(employee.dateOfSeparation);
        
        return (
          <div className="flex items-center group">
            <div className="flex-shrink-0 h-10 w-10 relative">
              {/* Main Avatar */}
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                isInactive
                  ? 'bg-gradient-to-br from-red-400 to-red-600 ring-2 ring-red-200'  // Red for inactive
                  : 'bg-gradient-to-br from-blue-500 to-blue-700 ring-2 ring-blue-200' // Blue for active
              }`}>
                <span className="text-white font-bold text-sm tracking-tight">
                  {employee.name.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Status Indicator - Small circle at bottom right */}
              <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-all duration-300 ${
                isInactive 
                  ? 'bg-red-500' 
                  : 'bg-green-500'
              }`}>
                {/* Cross icon for inactive */}
                {isInactive ? (
                  <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  /* Check icon for active */
                  <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Minimal hover tooltip */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20">
                  <div className={`text-white text-xs py-1 px-2 rounded-md font-medium shadow-lg ${
                    isInactive ? 'bg-red-500' : 'bg-green-500'
                  }`}>
                    <div className="flex">
                      <div className={`{isInactive ? 'bg-red-300' : 'bg-green-300'}`}></div>
                      <span>{isInactive ? 'Inactive' : 'Active'}</span>
                    </div>
                  </div>
                  <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 rotate-45 ${
                    isInactive ? 'bg-red-500' : 'bg-green-500'
                  }`}></div>
                </div>
            </div>

            {/* Employee Info */}
            <div className="ml-3 min-w-0 flex-1">
              <button
                onClick={() => onView(employee)}
                className="text-sm font-semibold text-gray-900 hover:text-blue-700 truncate block text-left transition-all duration-200 hover:translate-x-1 w-full group/name"
                title={`View details for ${employee.name}`}
              >
                <span className="flex items-center">
                  {employee.name}
                  <span className="inline-block ml-2 opacity-0 group-hover/name:opacity-100 transition-all duration-300 transform group-hover/name:translate-x-1">
                    <svg className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </span>
                </span>
              </button>
              
              <div className="flex items-center space-x-2 mt-1">
                <div className="text-xs text-gray-500 truncate font-medium">
                  {employee.email}
                </div>
              </div>
            </div>
          </div>
        );
      case 'department':
        return <span className="text-xs">{employee.department}</span>;
      case 'designation':
        return <span className="text-xs">{employee.designation}</span>;
      case 'modeOfManagement':
        return <span className="text-xs">{employee.modeOfManagement}</span>;
      case 'client':
        return employee.client || '-';

      case 'billabilityStatus':
      // Check if employee has any active projects with active POs (both main PO and amendments)
      const hasActivePO = employee.employeeProjects?.some(project => {
        // Check if project has active PO amendments
        const hasActiveAmendment = project.poAmendments?.some(amendment => amendment.is_active) || false;

        // ✅ FIX: Also check if the main PO is active
        const isMainPOActive = isPOActive(project.startDate, project.endDate || undefined);

        return hasActiveAmendment || isMainPOActive;
      });

      // Support functions logic
      const isSupportFunction = employee.modeOfManagement === 'SUPPORT_FUNCTIONS';
      const isBillable = employee.billabilityStatus === 'Billable';
      const isNA = employee.billabilityStatus === 'NA';

      let displayStatus = employee.billabilityStatus;
      let statusClass = '';

      if (isSupportFunction) {
        if (isNA) {
          displayStatus = 'NA';
          statusClass = 'bg-gray-100 text-gray-800';
        } else if (isBillable) {
          displayStatus = 'Billable';
          statusClass = 'bg-green-100 text-green-800';
        } else {
          displayStatus = employee.billabilityStatus;
          statusClass = 'bg-gray-100 text-gray-800';
        }
      } else {
        // Regular employees - check if they have active PO (main or amendments)
        if (!hasActivePO && employee.billabilityStatus === 'Billable') {
          displayStatus = 'Bench';
          statusClass = 'bg-yellow-100 text-yellow-800';
          
          // Note: Auto-update is handled by the useEffect at the component level
          // Don't call hooks inside render functions
          
        } else {
          statusClass = employee.billabilityStatus === 'Billable'
            ? 'bg-green-100 text-green-800'
            : employee.billabilityStatus === 'Bench'
              ? 'bg-yellow-100 text-yellow-800'
              : employee.billabilityStatus === 'Trainee'
                ? 'bg-purple-100 text-purple-800'
                : employee.billabilityStatus === 'Buffer'
                  ? 'bg-orange-100 text-orange-800'
                  : employee.billabilityStatus === 'ML'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-gray-100 text-gray-800';
        }
      }

      return (
        <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${statusClass}`}>
          {displayStatus}
        </span>
      );
      case 'billing':
        return employee.billing || '-';
      case 'lastActiveDate':
        // ✅ AUTO-CALCULATE: Get latest PO end date from all projects
        const latestEndDate = employee.employeeProjects ? getLatestPOEndDate(employee.employeeProjects) : null;
        const displayLastActiveDate = latestEndDate || employee.lastActiveDate;

        return <span className="text-xs">{formatDateForDisplay(displayLastActiveDate)}</span>;
      case 'projects':
        // ✅ FIXED: Show client details and project info even when no projects exist
        const hasProjects = employee.employeeProjects && employee.employeeProjects.length > 0;
        const client = employee.client || 'NA';
        const poNumber = employee.poNumber || 'NA';

        // ✅ FIX: Use the helper function for dates
        const projectStartDate = formatDateForDisplay(employee.projectStartDate);
        const projectEndDate = formatDateForDisplay(employee.projectEndDate);

        // ADD COLLAPSIBLE LOGIC HERE
        if (!hasProjects) {
          return (
            <div className="rounded-lg border border-slate-200 p-3 bg-gray-50 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base font-semibold text-gray-500 truncate max-w-[200px]">
                  Not Assigned
                </span>
                <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 ml-4">
                  {poNumber}
                </span>
              </div>
              <div className="mt-1 text-xs md:text-sm text-gray-500 flex items-center justify-between">
                <span className="truncate max-w-[180px]">{client}</span>
                <span className="text-gray-400 ml-2 whitespace-nowrap">
                  {projectStartDate} → {projectEndDate}
                </span>
              </div>
            </div>
          );
        }

        // Show first project + dropdown for additional projects
        const firstProject = employee.employeeProjects[0];
        const remainingProjects = employee.employeeProjects.slice(1);
        const projStartDate = formatDateForDisplay(firstProject.startDate);
        const projEndDate = formatDateForDisplay(firstProject.endDate);

        const isExpanded = expandedEmployeeId === employee.id;

        // Reusable Project Card Component with gradient hover effects
        const ProjectCard = ({ project, isAdditional = false }) => {
          const startDate = formatDateForDisplay(project.startDate);
          const endDate = formatDateForDisplay(project.endDate);

          return (
            <div className="group relative">
              <div className="rounded-lg border border-slate-200 p-3 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-blue-200 hover:bg-gradient-to-br hover:from-white hover:to-blue-50/80">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
                    {project.projectName}
                  </span>
                  <span className="text-xs font-mono text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 transition-colors group-hover:bg-blue-100 group-hover:border-blue-300">
                    {project.poNumber || poNumber}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-600 flex items-center justify-between">
                  <span className="truncate max-w-[120px]">{project.client || client}</span>
                  <span className="text-gray-500 ml-2 whitespace-nowrap">
                    {startDate} → {endDate}
                  </span>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Allocation: {project.allocationPercentage}%</span>
                  {project.rate && project.rate > 0 && (
                    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 transition-colors group-hover:bg-green-100 group-hover:border-green-300">
                      {project.billing}: ₹{project.rate}
                    </span>
                  )}
                </div>

                {/* PO Amendments */}
                {project.poAmendments && project.poAmendments.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 group-hover:border-blue-100 transition-colors">
                    <div className="space-y-1">
                      {project.poAmendments.map((amendment) => (
                        <div
                          key={amendment.id}
                          className={`flex items-center justify-between p-1 rounded text-xs transition-colors ${amendment.is_active
                              ? 'bg-green-50 border border-green-200 group-hover:bg-green-100 group-hover:border-green-300'
                              : 'bg-gray-50 border border-gray-200 group-hover:bg-blue-50 group-hover:border-blue-200'
                            }`}
                        >
                          <div className="flex items-center space-x-1">
                            <span className="font-mono">{amendment.po_number}</span>
                            {amendment.is_active && (
                              <span className="px-1 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px] transition-colors group-hover:bg-green-200">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-gray-500 text-[10px]">
                            {new Date(amendment.start_date).toLocaleDateString('en-IN')}
                            {amendment.end_date && ` - ${new Date(amendment.end_date).toLocaleDateString('en-IN')}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-2 min-w-[280px]">
            {/* First Project with Overlapping Button */}
            <div className="relative">
              <ProjectCard project={firstProject} />

              {/* Overlapping "+ more" Button - Top Right Corner */}
              {remainingProjects.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedEmployeeId(isExpanded ? null : employee.id);
                  }}
                  className="absolute -top-2 -right-5 text-xs text-blue-600 hover:text-blue-800 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 h-8 w-8 rounded-full border border-blue-300 shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg z-10 flex items-center justify-center"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-600" />
                  ) : (
                    `+${remainingProjects.length}`
                  )}
                </button>
              )}
            </div>

            {/* Show remaining projects when expanded */}
            {isExpanded && remainingProjects.length > 0 && (
              <div className="space-y-2">
                {remainingProjects.map((project) => {
                  const projStart = formatDateForDisplay(project.startDate);
                  const projEnd = formatDateForDisplay(project.endDate);

                  return (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      isAdditional={true}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      case 'billabilityPercentage':
        return `${employee.billabilityPercentage}%`;
      case 'projectStartDate':
        return formatDateForDisplay(employee.projectStartDate);
      case 'projectEndDate':
        return formatDateForDisplay(employee.projectEndDate);
      case 'experienceBand':
        return <span className="text-xs">{employee.experienceBand}</span>;
      case 'rate':
        return `₹${employee.rate}`;
      case 'ageing':
        const employeeAgeing = calculateAgeing(employee.joiningDate);
        return (
          <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${employeeAgeing >= 90
              ? 'bg-green-100 text-green-800'  // Green for long-serving employees (90+ days)
              : employeeAgeing >= 30
                ? 'bg-yellow-100 text-yellow-800' // Yellow for medium (30-89 days)
                : 'bg-red-100 text-red-800'       // Red for new employees (0-29 days)
            }`}>
            {employeeAgeing}
          </span>
        );
      case 'ctc':
        const ctcInLPA = (employee.ctc / 100000).toFixed(2);
        return <span className="text-xs">₹{ctcInLPA} LPA</span>;
      case 'benchDays':
        return (
          <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${employee.benchDays === 0
              ? 'bg-green-100 text-green-800'
              : employee.benchDays <= 30
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
            {employee.benchDays}
          </span>
        );
      case 'phoneNumber':
        return employee.phoneNumber || '-';
      case 'emergencyContact':
        return employee.emergencyContact || '-';
      case 'remarks':
        return (
          <span className="max-w-xs truncate" title={employee.remarks || ''}>
            {employee.remarks || '-'}
          </span>
        );
      case 'lastModifiedBy':
        return employee.lastModifiedBy || '-';
      case 'actions':
        return (
          <div className="flex space-x-1">
            {canEdit && (
              <button
                onClick={() => onEdit(employee)}
                className="text-slate-600 hover:text-slate-900 p-1 rounded hover:bg-slate-50 transition-colors"
              >
                <Edit className="h-3 w-3" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => handleDelete(employee.id)}
                className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      default:
        return '-';
    }
  };

  const exportToExcel = async () => {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employees');

    // Define headers - ADD DOS FIELD
    const headers = [
      'S.No', 'Employee ID', 'Name', 'Email', 'Department', 'Designation', 'Mode of Management',
      'Client', 'Billability Status', 'PO Number', 'Billing', 'Billing Last Active Date',
      'Projects', 'Billability %', 'PO Start Date', 'PO End Date', 'Experience Band', 'Rate',
      'Ageing', 'Bench Days', 'Phone Number', 'Emergency Number', 'CTC', 'Remarks', 'Last Modified By',
      'Joining Date', 'Location', 'Manager', 'Skills', 'Date of Separation' // ✅ ADD DOS FIELD HERE
    ];

    // Add headers to worksheet
    worksheet.addRow(headers);

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E5BFF' } // Blue background
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // ✅ FIX: Helper function to handle date values for export
    const getDateForExport = (dateValue: string | undefined): string => {
      if (!dateValue || dateValue.trim() === '') return '';

      const trimmedDate = dateValue.trim().toLowerCase();

      // ✅ PRESERVE special values as empty strings for Excel
      if (trimmedDate === 'milestone' || trimmedDate === 'sow' || trimmedDate === 'na') {
        return '';
      }

      // Convert valid dates to DD-MM-YYYY format
      return ExcelParser.formatDateToDDMMYYYY(dateValue);
    };

    // Add data rows - INCLUDE DOS DATA
    filteredEmployees.forEach(emp => {
      const row = worksheet.addRow([
        emp.sNo,
        emp.employeeId,
        emp.name,
        emp.email,
        emp.department,
        emp.designation,
        emp.modeOfManagement,
        emp.client,
        emp.billabilityStatus, // Export actual database value
        emp.poNumber || '',
        emp.billing || '',
        // ✅ FIXED: Use helper function to handle special date values
        getDateForExport(emp.lastActiveDate),

        // Projects field
        emp.employeeProjects && emp.employeeProjects.length > 0
          ? emp.employeeProjects.map(p => p.projectName).join('; ')
          : emp.projects || '',

        emp.billabilityPercentage,
        // ✅ FIXED: Use helper function to handle special date values
        getDateForExport(emp.projectStartDate),
        getDateForExport(emp.projectEndDate),

        emp.experienceBand,
        emp.rate,
        emp.ageing,
        emp.benchDays,
        emp.phoneNumber || '',
        emp.emergencyContact || '',
        emp.ctc,
        emp.remarks || '',
        emp.lastModifiedBy || '',
        // ✅ FIXED: Use helper function to handle special date values
        getDateForExport(emp.joiningDate),

        emp.location,
        emp.manager,
        emp.skills.join('; '),
        // ✅ ADD DOS FIELD DATA HERE
        getDateForExport(emp.dateOfSeparation)
      ]);

      // Add alternating row colors for better readability
      if (row.number % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F4FF' } // Light blue for even rows
        };
      }
    });

    // Auto-fit columns for better Excel experience
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 50); // Min width 10, max width 50
    });

    // Freeze the header row for easier scrolling
    worksheet.views = [
      { state: 'frozen', ySplit: 1 }
    ];

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Trigger download first
    document.body.appendChild(a);
    a.click();

    // Clean up and show success
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Export Successful', 'Employee data has been exported to Excel successfully.');
    }, 100);

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    showError('Export Failed', 'Failed to export employee data to Excel. Please try again.');
  }
};

  const canEdit = user?.role === 'Admin' || user?.role === 'Lead' || user?.role === 'HR' || user?.role === 'Delivery';
  const canDelete = user?.role === 'Admin' || user?.role === 'Delivery';

  // Handle bulk upload with enhanced error handling and automatic refresh
  const handleBulkUpload = async () => {
    if (!excelFile) return;

    try {
      const ext = excelFile.name.split('.').pop()?.toLowerCase();
      let parsedExcelRows;

      if (ext === 'xlsx' || ext === 'xls') {
        setUploadProgress('Reading Excel file...');
        const buf = await excelFile.arrayBuffer();
        setUploadProgress('Parsing Excel data...');
        parsedExcelRows = await ExcelParser.parseXLSXToRows(buf);
      } else {
        setUploadProgress('Reading Excel file...');
        const buf = await excelFile.arrayBuffer();
        setUploadProgress('Parsing Excel data...');
        parsedExcelRows = await ExcelParser.parseXLSXToRows(buf);
      }

      setUploadProgress('Validating data...');
      const validation = ExcelParser.validateExcel(parsedExcelRows);
      if (!validation.isValid) {
        const errorMessage = validation.errors.length === 1
          ? validation.errors[0]
          : `Found ${validation.errors.length} validation errors. Please check your data format.`;
        setUploadProgress(`Validation Error: ${errorMessage}`);
        console.error(`Validation errors:\n${validation.errors.join('\n')}`);
        return;
      }

      setUploadProgress('Checking for conflicts...');
      const conflictAnalysis = await ExcelParser.detectConflictsEnhanced(parsedExcelRows, allEmployees);

      if (conflictAnalysis.conflicts.length > 0) {
        // Show conflict resolution modal
        setExcelRows(parsedExcelRows);
        setConflicts(conflictAnalysis.conflicts);
        setShowConflictResolution(true);
        setShowBulkUpload(false);
        setUploadProgress('');
        return;
      }

      // No conflicts, proceed with normal upload
      setUploadProgress('Converting to employee data...');
      const employeeData = ExcelParser.excelRowsToEmployees(parsedExcelRows);

      setUploadProgress('Uploading to database...');
      await bulkUploadEmployees(employeeData);

      // ✅ AUTOMATIC REFRESH AFTER SUCCESSFUL UPLOAD
      setUploadProgress('Refreshing employee data...');
      await refetch();

      setUploadProgress('Upload completed successfully!');
      setShowBulkUpload(false);
      setExcelFile(null);

      showSuccess('Bulk Upload Successful', `${employeeData.length} employees have been uploaded successfully.`);

      // Reset progress after 2 seconds
      setTimeout(() => setUploadProgress(''), 2000);
    } catch (error) {
      // ✅ REPLACE THIS ENTIRE CATCH BLOCK:
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUploadProgress(`Error: ${errorMessage}`);
      console.error('Bulk upload error:', error);

      // ✅ IMPROVED ERROR HANDLING WITH SPECIFIC MESSAGES
      if (errorMessage.includes('DUPLICATE_EMAIL')) {
        showError('Upload Failed', 'One or more employees with the same email already exist in the system. Please check your file for duplicate emails or use the conflict resolution feature.');
      } else if (errorMessage.includes('DUPLICATE_EMPLOYEE_ID')) {
        showError('Upload Failed', 'One or more employees with the same Employee ID already exist in the system. Please check your file for duplicate Employee IDs.');
      } else if (errorMessage.includes('No valid employees')) {
        showError('Upload Failed', 'No valid employees to upload after filtering duplicates. Please check your data for duplicate emails or Employee IDs.');
      } else if (errorMessage.includes('DATABASE_CONSTRAINT_VIOLATION')) {
        showError('Upload Failed', 'Database constraint violation. Please check your data for duplicates or contact support.');
      } else {
        showError('Upload Failed', errorMessage);
      }
    }
  };

  // Handle conflict resolution with enhanced progress tracking and automatic refresh
  const handleConflictResolution = async (resolutions: ConflictResolution[]) => {
    try {
      setUploadProgress('Processing conflict resolutions...');

      // Convert Excel rows to employee data
      const employeeData = ExcelParser.excelRowsToEmployees(excelRows);

      // Update resolutions with existing employee IDs
      const updatedResolutions = resolutions.map((resolution, index) => {
        const conflict = conflicts[index];
        if (conflict && resolution.action === 'use_excel') {
          return {
            ...resolution,
            existingEmployeeId: conflict.existingEmployee.id
          };
        }
        return resolution;
      });

      setUploadProgress('Uploading employees to database...');

      // Process the upload with conflict resolution
      await bulkUploadEmployeesWithConflicts(employeeData, updatedResolutions, conflicts);

      // ✅ AUTOMATIC REFRESH AFTER SUCCESSFUL CONFLICT RESOLUTION
      setUploadProgress('Refreshing employee data...');
      await refetch();

      setUploadProgress('Upload completed successfully!');
      setShowConflictResolution(false);
      setConflicts([]);
      setExcelRows([]);
      setExcelFile(null);

      showSuccess('Bulk Upload Successful', `${employeeData.length} employees have been uploaded successfully.`);

      // Reset progress after 2 seconds
      setTimeout(() => setUploadProgress(''), 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUploadProgress(`Error: ${errorMessage}`);
      console.error('Conflict resolution error:', error);
      showError('Upload Failed', errorMessage);
    }
  };

  // Handle conflict resolution cancellation
  const handleConflictResolutionCancel = () => {
    setShowConflictResolution(false);
    setConflicts([]);
    setExcelRows([]);
    setExcelFile(null);
    setUploadProgress('');
  };

  // Clear bulk upload state
  const clearBulkUploadState = () => {
    setShowBulkUpload(false);
    setExcelFile(null);
    setUploadProgress('');
    setConflicts([]);
    setExcelRows([]);
  };

  const downloadTemplate = async () => {
  try {
    // Get all projects from all clients
    const allProjects = clientNames.flatMap(client =>
      getProjectsForClient(client).map(project => project.name)
    );

    // Convert dropdown options to the format expected by the template
    const dropdownOptions: { [key: string]: string[] } = {};
    Object.keys(options).forEach(key => {
      dropdownOptions[key] = options[key].map(option => option.optionValue);
    });

    const blob = await ExcelParser.generateTemplateXLSX(
      clientNames,
      allProjects,
      dropdownOptions,
      true // Include DOS field in template
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating template:', error);
    // Fallback to default template if there's an error
    const blob = await ExcelParser.generateTemplateXLSX();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }
};

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Error Display - Compact */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <div className="flex-shrink-0">
                <div className="h-4 w-4 text-red-400">⚠️</div>
              </div>
              <div className="ml-2 min-w-0">
                <p className="text-sm text-red-800 truncate">{error}</p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600 flex-shrink-0 ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex-1">
          {/* Header Skeleton */}
          <SkeletonEmployeeHeader showBulkUpload={user?.role === 'Admin'} />

          {/* Table Skeleton */}
          <SkeletonTable rows={10} showAvatar={true} showActions={true} columnConfig={columnConfig} />

          {/* Pagination Skeleton */}
          <SkeletonPagination />
        </div>
      )}

      {/* Conflict Resolution Modal */}
      {showConflictResolution && (
        <ConflictResolutionModal
          conflicts={conflicts}
          onResolve={handleConflictResolution}
          onCancel={handleConflictResolutionCancel}
        />
      )}

      {/* Mass Delete Confirmation Modal */}
      {showMassDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Confirm Mass Delete</h2>
              <button
                onClick={() => setShowMassDeleteConfirm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Delete {selectedEmployees.size} employee(s)?
                  </p>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone. All selected employees will be permanently deleted.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMassDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMassDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete {selectedEmployees.size} Employee(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Bulk Upload Employees</h2>
              <button
                onClick={clearBulkUploadState}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excel File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {uploadProgress && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-blue-800">{uploadProgress}</p>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={downloadTemplate}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Download Template
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!excelFile || uploadProgress.includes('Uploading')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Only show when not loading */}
      {!loading && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header Section */}
          <div className="p-4 border-b bg-white mt-1">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center w-full">
              {/* Search Bar - Full width on mobile */}
              <div className="relative flex-1 min-w-0 max-w-100px">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search Employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-xs"
                />
              </div>
              
              {/* Filters */}
              <div className="flex gap-2 min-w-0 flex-shrink-0">
                {/* Department Filter */}
                <CustomSelect
                  value={filterDepartment}
                  onChange={setFilterDepartment}
                  options={[
                    { value: '', label: 'All Dept' },
                    ...departments.map(dept => ({ value: dept, label: dept }))
                  ]}
                  className="w-[160px]"
                />

                {/* Client Filter */}
                <CustomSelect
                  value={filterClient}
                  onChange={setFilterClient}
                  options={[
                    { value: '', label: 'All Clients' },
                    ...clients.map(client => ({ value: client, label: client }))
                  ]}
                  className="w-[120px]"
                />

                {/* Status Filter */}
                <CustomSelect
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { value: '', label: 'Status' },
                    ...statuses.map(status => ({ value: status, label: status })),
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' }
                  ]}
                  className="w-[80px]"
                />

                {/* Mode Filter */}
                <CustomSelect
                  value={filterMode}
                  onChange={setFilterMode}
                  options={[
                    { value: '', label: 'All Modes' },
                    ...modes.map(mode => ({ value: mode, label: mode }))
                  ]}
                  className="w-[140px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-shrink-0 items-center">
                {/* Column Toggle */}
                <div className="relative">
                  <button
                    onClick={() => setShowColumnToggle(!showColumnToggle)}
                    className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs h-9"
                    title="Toggle columns"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden lg:inline ml-2">Columns</span>
                  </button>

                  {/* Column Toggle Dropdown - unchanged */}
                  {showColumnToggle && (
                    <div className="column-toggle-dropdown absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900">Toggle Columns</h3>
                      </div>
                      <div className="p-3 space-y-2">
                        {columnConfig.map((column) => (
                          <label key={column.key} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={column.visible}
                              onChange={() => toggleColumnVisibility(column.key)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{column.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="p-3 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setColumnConfig(prev => prev.map(col => ({ ...col, visible: true })));
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Show All
                        </button>
                        <button
                          onClick={() => {
                            setColumnConfig(prev => prev.map(col => ({ ...col, visible: false })));
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 ml-4"
                        >
                          Hide All
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Kebab Menu for Secondary Actions */}
                <div className="relative">
                  <button
                    onClick={() => setShowKebabMenu(!showKebabMenu)}
                    className="flex items-center justify-center px-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm h-9 w-8"
                    title="More actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {/* Kebab Menu Dropdown - unchanged */}
                  {showKebabMenu && (
                    <div className="kebab-menu-dropdown absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        {/* Refresh */}
                        <button
                          onClick={() => {
                            handleRefresh();
                            setShowKebabMenu(false);
                          }}
                          disabled={loading || isRefreshing}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className={`h-4 w-4 mr-3 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
                          Refresh Data
                        </button>

                        {/* Export to Excel */}
                        <button
                          onClick={() => {
                            exportToExcel();
                            setShowKebabMenu(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Download className="h-4 w-4 mr-3" />
                          Export to Excel
                        </button>

                        {/* Bulk Upload - Admin Only */}
                        {user?.role === 'Admin' || user?.role === 'Delivery' && (
                          <button
                            onClick={() => {
                              setShowBulkUpload(true);
                              setShowKebabMenu(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Upload className="h-4 w-4 mr-3" />
                            Bulk Upload
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mass Delete */}
                {user?.role === 'Admin' && selectedEmployees.size > 0 && (
                  <button
                    onClick={() => setShowMassDeleteConfirm(true)}
                    className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm h-9"
                    title={`Delete ${selectedEmployees.size} selected`}
                  >
                    <Trash className="h-4 w-4" />
                    <span className="hidden lg:inline ml-2">({selectedEmployees.size})</span>
                  </button>
                )}

                {/* Add Employee */}
                {(user?.role === 'Admin' || user?.role === 'Delivery') && (
                  <button
                    onClick={onAdd}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs h-9"
                    title="Add new employee"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden lg:inline ml-2">Add Employee</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Table container with proper scrolling */}
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-0">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {columnConfig.map((column) => (
                      <th
                        key={column.key}
                        className={`px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide ${getColumnClassName(column)} ${column.key !== 'actions' && column.key !== 'checkbox' ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
                          }`}
                        onClick={column.key !== 'actions' && column.key !== 'checkbox' ? () => handleSort(column.key as keyof Employee) : undefined}
                      >
                        {column.key === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={selectedEmployees.size === paginatedEmployees.length && paginatedEmployees.length > 0}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        ) : (
                          <span className="whitespace-nowrap">{column.label}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      {columnConfig.map((column) => (
                        <td
                          key={column.key}
                          className={`px-3 py-2.5 text-sm text-gray-900 ${getColumnClassName(column)} ${column.key === 'name' ? '' : 'whitespace-nowrap'
                            } ${column.key === 'actions' ? 'font-medium' : ''}`}
                        >
                          {renderCellContent(employee, column.key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination - Ultra Compact */}
            {paginatedEmployees.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-600 font-medium">
                    Showing <span className="text-slate-900 font-semibold">{sortedEmployees.length === 0 ? 0 : startIndex + 1}</span> to{' '}
                    <span className="text-slate-900 font-semibold">{Math.min(startIndex + itemsPerPage, sortedEmployees.length)}</span> of{' '}
                    <span className="text-slate-900 font-semibold">{sortedEmployees.length}</span> employees
                  </div>
                  <div className="flex items-center gap-0">
                    {/* First & Previous Group */}
                    <div className="flex items-center rounded-lg border-slate-300 overflow-hidden">
                      {/* First Page Button */}
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-all duration-200 border-r border-slate-300"
                        title="First page"
                      >
                        <div className="flex -space-x-3">
                          <ChevronLeft className="h-4 w-4 text-slate-600" />
                          <ChevronLeft className="h-4 w-4 text-slate-600" />
                        </div>
                      </button>

                      {/* Previous Page Button */}
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-all duration-200"
                        title="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4 text-slate-600" />
                      </button>
                    </div>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1 mx-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`min-w-[32px] h-8 px-2 rounded-lg font-semibold text-sm transition-all duration-200 border border-slate-300 ${currentPage === pageNum
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next & Last Group */}
                    <div className="flex items-center rounded-lg border-slate-300 overflow-hidden">
                      {/* Next Page Button */}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-all duration-200 border-r border-slate-300"
                        title="Next page"
                      >
                        <ChevronRight className="h-4 w-4 text-slate-600" />
                      </button>

                      {/* Last Page Button */}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-all duration-200"
                        title="Last page"
                      >
                        <div className="flex -space-x-3">
                          <ChevronRight className="h-4 w-4 text-slate-600" />
                          <ChevronRight className="h-4 w-4 text-slate-600" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Amend PO Dialog */}
      {showAmendPODialog && (
        <AmendPODialog
          isOpen={showAmendPODialog}
          onClose={() => setShowAmendPODialog(false)}
          employee={selectedEmployee}
          projectAssignment={selectedProject}
          onPOAmended={() => {
            setShowAmendPODialog(false);
            refetch(); // Refresh the employee data
          }}
        />
      )}
    </div>
  );
};