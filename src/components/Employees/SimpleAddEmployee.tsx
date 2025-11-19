import React, { useState, useEffect } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { Employee } from '../../types';
import { EmployeeService } from '../../lib/employeeService';
import { ProjectService } from '../../lib/projectService';
import { supabase } from '../../lib/supabase';
import { showSuccess, showError, showConfirm } from '../../lib/sweetAlert';

interface SimpleAddEmployeeProps {
  onClose: () => void;
  onEmployeeAdded: () => void;
  clientName?: string;
  projectName?: string;
  projectId?: string;
  existingProjectEmployees?: Employee[];
}

export const SimpleAddEmployee: React.FC<SimpleAddEmployeeProps> = ({ onClose, onEmployeeAdded, clientName, projectName, projectId, existingProjectEmployees = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Search for employees when search term changes
  useEffect(() => {
    const searchEmployees = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await EmployeeService.searchEmployees(searchTerm.trim());
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching employees:', error);
        showError('Search Failed', 'Failed to search employees');
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchEmployees, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleEmployeeSelect = async (employee: Employee) => {
    // Check if employee is already selected
    const isAlreadySelected = selectedEmployees.some(emp => emp.id === employee.id);
    if (isAlreadySelected) {
      showError('Already Selected', `Employee "${employee.name}" is already selected.`);
      return;
    }

    // Check if employee is already in the current project
    const isAlreadyInProject = existingProjectEmployees.some(emp => emp.id === employee.id);
    if (isAlreadyInProject) {
      showError('Employee Already in Project', `Employee "${employee.name}" is already assigned to this project.`);
      return;
    }

    // Check if employee is already assigned to a different project
    if (employee.client && employee.projects && (employee.client !== clientName || employee.projects !== projectName)) {
      const confirmMessage = `Employee "${employee.name}" is currently assigned to client "${employee.client}" (PROJECT ${employee.projects}).\n\nDo you want to:\n• Remove them from the old project and add to this project?\n• Keep them in both projects?`;
      
      const result = await showConfirm(
        'Employee Already Assigned',
        confirmMessage,
        'Remove from Old Project',
        'Keep in Both Projects'
      );
      
      // Store the user's choice for later use
      employee._removeFromOldProject = result.isConfirmed;
    } else {
      employee._removeFromOldProject = false; // No old project to remove from
    }

    // Add to selected employees
    setSelectedEmployees(prev => [...prev, employee]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleAddEmployees = async () => {
    if (selectedEmployees.length === 0) {
      showError('No Selection', 'Please select at least one employee to add');
      return;
    }

    setIsAdding(true);
    try {
      // If this is for a specific project, handle each employee individually
      if (projectId && clientName && projectName) {
        const employeesWithDifferentProject = [];
        
        for (const employee of selectedEmployees) {
          // Check if employee was assigned to a different project and user chose to remove from old project
          if (employee.client && employee.projects && (employee.client !== clientName || employee.projects !== projectName)) {
            if ((employee as any)._removeFromOldProject) {
              // Remove from old project first
              try {
                const { data: oldProject } = await supabase
                  .from('projects')
                  .select('id')
                  .eq('client', employee.client)
                  .eq('name', employee.projects)
                  .single();
                
                if (oldProject) {
                  await supabase
                    .from('employee_projects')
                    .delete()
                    .eq('employee_id', employee.id)
                    .eq('project_id', oldProject.id);
                  console.log(`Removed employee ${employee.name} from old project ${employee.client} - ${employee.projects}`);
                }
              } catch (error) {
                console.warn(`Failed to remove employee from old project: ${error}`);
              }
            } else {
              // User chose to keep in both projects - still update billability status to Billable
              await EmployeeService.updateEmployee(employee.id, {
                ...employee,
                billabilityStatus: 'Billable' // Set billability status to Billable even when keeping multiple projects
              });
              employeesWithDifferentProject.push(`${employee.name} - Kept in client ${employee.client} (PROJECT ${employee.projects})`);
            }
          }
          
          // Add employee to the new project
          await ProjectService.linkEmployeeToProject({
            employeeId: employee.id,
            projectId: projectId,
            allocationPercentage: employee.billabilityPercentage || 100,
            startDate: employee.projectStartDate || new Date().toISOString().slice(0, 10),
            endDate: employee.projectEndDate || null
          });
          
          // Update the employee record only if they were removed from old project
          if ((employee as any)._removeFromOldProject || !employee.client || !employee.projects) {
            await EmployeeService.updateEmployee(employee.id, {
              ...employee,
              client: clientName,
              projects: projectName,
              billabilityStatus: 'Billable' // Set billability status to Billable when assigned to project
            });
          }
        }
        
        const employeeNames = selectedEmployees.map(emp => emp.name).join(', ');
        
        // Show different messages based on whether employees were already in different projects
        if (employeesWithDifferentProject.length > 0) {
          const message = `Employees have been added to ${clientName} - ${projectName}:\n\n${employeesWithDifferentProject.join('\n')}`;
          showSuccess('Employees Added (Some Kept in Multiple Projects)', message);
        } else {
          showSuccess('Employees Added', `${selectedEmployees.length} employee(s) (${employeeNames}) have been successfully added to ${clientName} - ${projectName}.`);
        }
        onEmployeeAdded();
        
        // Clear selection
        setSelectedEmployees([]);
        setSearchTerm('');
        setSearchResults([]);
      } else {
        showError('Invalid Project', 'Project information is missing');
      }
    } catch (error) {
      console.error('Error adding employees to project:', error);
      showError('Add Failed', error instanceof Error ? error.message : 'Failed to add employees to project');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  };

  const handleClearAllSelections = () => {
    setSelectedEmployees([]);
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {clientName && projectName ? `Add Employee to ${clientName} - ${projectName}` : 'Add Employee'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Project Info */}
          {clientName && projectName && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <div className="font-medium text-blue-900">Adding to: {clientName} - {projectName}</div>
              <div className="text-blue-700">Current team size: {existingProjectEmployees.length} employees</div>
            </div>
          )}
          
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isAdding}
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
              {searchResults.map((employee) => {
                const isAlreadyInProject = existingProjectEmployees.some(emp => emp.id === employee.id);
                const isAssignedToOtherProject = employee.client && employee.projects && (employee.client !== clientName || employee.projects !== projectName);
                
                return (
                  <button
                    key={employee.id}
                    onClick={() => handleEmployeeSelect(employee)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                      isAlreadyInProject ? 'bg-red-50 cursor-not-allowed' : 
                      isAssignedToOtherProject ? 'bg-yellow-50' : ''
                    }`}
                    disabled={isAlreadyInProject}
                  >
                    <div className="font-medium text-gray-900">
                      {employee.name} ({employee.employeeId})
                    </div>
                    <div className="text-sm text-gray-500">
                      {employee.department} • {employee.designation}
                    </div>
                    {isAlreadyInProject && (
                      <div className="text-xs text-red-600 mt-1">
                        Already in this project
                      </div>
                    )}
                    {isAssignedToOtherProject && !isAlreadyInProject && (
                      <div className="text-xs text-yellow-600 mt-1">
                        ⚠️ Already in: {employee.client} (PROJECT {employee.projects})
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Employees Display */}
          {selectedEmployees.length > 0 && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-green-900">
                  Selected Employees ({selectedEmployees.length})
                </div>
                <button
                  onClick={handleClearAllSelections}
                  className="text-green-600 hover:text-green-800 transition-colors text-sm"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2">
                {selectedEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between bg-white rounded p-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {employee.name} ({employee.employeeId})
                      </div>
                      <div className="text-sm text-gray-500">
                        {employee.department} • {employee.designation}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveEmployee(employee.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results Message */}
          {searchTerm.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-4 text-gray-500">
              No employees found matching "{searchTerm}"
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isAdding}
            >
              Close
            </button>
            <button
              onClick={handleAddEmployees}
              disabled={selectedEmployees.length === 0 || isAdding}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isAdding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add {selectedEmployees.length > 0 ? `${selectedEmployees.length} Employee${selectedEmployees.length > 1 ? 's' : ''}` : 'to Project'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};