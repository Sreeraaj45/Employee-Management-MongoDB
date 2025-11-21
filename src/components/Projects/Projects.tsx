import React, { useEffect, useMemo, useState } from 'react';
import { PlusCircle, Building2, FolderKanban, Users, ArrowLeft, Edit2, Trash2, MoreVertical, UserPlus, Edit, Search, X, Filter } from 'lucide-react';
import { ProjectService, ClientWithProjects } from '../../lib/projectService';
import { Employee } from '../../types';
import { useProjects } from '../../hooks/useProjects';
import AddClientDialog, { ClientData } from './AddClientDialog';
import AddProjectDialog, { ProjectData } from './AddProjectDialog';
import EditProjectDialog, { ProjectData as EditProjectData } from './EditProjectDialog';
import { showDeleteConfirm, showSuccess, showError } from '../../lib/sweetAlert';
import { RefreshCw } from "lucide-react";
import { SimpleAddEmployee } from '../Employees/SimpleAddEmployee';
import { EmployeeForm } from '../Employees/EmployeeForm';
import { EmployeeService } from '../../lib/employeeService';
import EditTeamMemberDialog from './EditTeamMemberDialog';
import { SkeletonProjects } from '../ui/SkeletonProjects';
import { SkeletonProjectDetail } from '../ui/SkeletonProjectDetail';


interface ProjectsProps { }

// Currency formatting disabled - using simple formatting
// const currency = (n: number, currencyCode: string = 'USD') => new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(n);
const currency = (n: number, currencyCode: string = 'USD') => `${currencyCode} ${n.toFixed(2)}`; // Simplified formatting

export const Projects: React.FC<ProjectsProps> = () => {
  const { 
    clients, 
    clientNames, 
    loading, 
    error, 
    refresh,
    refreshClient,
    refreshProject,
    addProjectToState,
    removeProjectFromState,
    updateProjectEmployeeCount
  } = useProjects();
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string; clientName: string } | null>(null);
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectEmployees, setProjectEmployees] = useState<Employee[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [showAddProjectDialog, setShowAddProjectDialog] = useState(false);
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [filteredClients, setFilteredClients] = useState<ClientWithProjects[]>([]);
  const [editingProject, setEditingProject] = useState<{
    id: string;
    name: string;
    client: string;
    description?: string;
    department?: string;
    startDate: string;
    endDate?: string;
    status: string;
    poNumber?: string;
    currency: string;
    billingType: string;
    teamSize: number;
  } | null>(null);
  const [showProjectMenu, setShowProjectMenu] = useState<string | null>(null);
  const [isProjectOverviewCollapsed, setIsProjectOverviewCollapsed] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showEditTeamMemberDialog, setShowEditTeamMemberDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);


  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-menu]')) {
        setShowProjectMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle skeleton loading with very low delay
  useEffect(() => {
    if (loading) {
      setShowSkeleton(true);
      // Very low delay - less than 10ms
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 5);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Add this useEffect to filter clients based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const filtered = clients.filter(client => {
      const clientNameMatch = client.client.toLowerCase().includes(searchTerm.toLowerCase());

      const projectMatches = client.projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return clientNameMatch || projectMatches.length > 0;
    });

    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const handleOpenProject = async (projectId: string, projectName: string, clientName: string) => {
    // console.log(`🖱️ Project clicked: ${projectName} (ID: ${projectId})`);
    
    if (!projectId || projectId === 'undefined') {
      console.error('❌ Invalid project ID:', projectId);
      return;
    }
    
    setSelectedProject({ id: projectId, name: projectName, clientName });
    try {
      setDetailLoading(true);
      // console.log(`🔍 Loading project details for: ${projectId}`);
      const [projectData, emps] = await Promise.all([
        ProjectService.getProjectById(projectId),
        ProjectService.getProjectEmployees(projectId)
      ]);
      // console.log(`✅ Project data loaded:`, projectData);
      // console.log(`✅ Project employees loaded: ${emps.length} employees`, emps);
      setProjectDetails(projectData);
      setProjectEmployees(emps);
    } catch (e) {
      console.error('❌ Error loading project details:', e);
      setError(e instanceof Error ? e.message : 'Failed to load project details');
    } finally {
      setDetailLoading(false);
    }
  };

  const totals = useMemo(() => {
    const totalEmployees = projectEmployees.length;
    const totalBilling = projectEmployees.reduce((sum, e) => sum + (Number(e.rate) || 0), 0);
    return { totalEmployees, totalBilling };
  }, [projectEmployees]);

  const handleAddClient = async (clientData: ClientData) => {
    try {
      await ProjectService.addClient(clientData);
      // Reload data to refresh the client list
      setShowSkeleton(true);
      await refresh();
    } catch (error) {
      throw error; // Re-throw to let the dialog handle the error display
    }
  };

  const handleAddProject = async (projectData: ProjectData) => {
    try {
      const result = await ProjectService.createProjectWithDetails({
        name: projectData.name,
        client: projectData.client,
        description: projectData.description,
        department: projectData.department,
        start_date: projectData.startDate,
        end_date: projectData.endDate || null,
        status: projectData.status,
        po_number: projectData.poNumber || null,
        currency: projectData.currency,
        billing_type: projectData.billingType,
        team_size: projectData.teamSize
      });

      // Add the new project to state immediately
      addProjectToState({
        id: result.id,
        name: projectData.name,
        client: projectData.client,
        status: projectData.status || 'Active',
        teamSize: projectData.teamSize || 0,
        employeeCount: 0,
        poNumber: projectData.poNumber || null
      });

      // Refresh just that client to get accurate employee counts
      await refreshClient(projectData.client);
      
    } catch (error) {
      throw error;
    }
  };

  const handleEditProject = async (projectId: string, clientName: string) => {
    try {
      const full = await ProjectService.getProjectById(projectId);
      setEditingProject({
        id: full.id,
        name: full.name,
        client: clientName || full.client,
        description: (full as any).description || '',
        department: (full as any).department || '',
        startDate: full.start_date || '',
        endDate: full.end_date || '',
        status: full.status || 'Active',
        poNumber: (full as any).po_number || '',
        currency: (full as any).currency || 'USD',
        billingType: (full as any).billing_type || 'Fixed',
        teamSize: full.team_size || 0
      });
      setShowEditProjectDialog(true);
      setShowProjectMenu(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load project details');
    }
  };

  const handleUpdateProject = async (projectId: string, projectData: EditProjectData) => {
    try {
      await ProjectService.updateProject(projectId, {
        name: projectData.name,
        client: projectData.client,
        description: projectData.description,
        department: projectData.department,
        start_date: projectData.startDate,
        end_date: projectData.endDate || null,
        status: projectData.status,
        po_number: projectData.poNumber || null,
        currency: projectData.currency,
        billing_type: projectData.billingType,
        team_size: projectData.teamSize
      });

      // Refresh just the project
      await refreshProject(projectId);
      
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteProject = async (projectId: string, clientName: string) => {
    try {
      await ProjectService.deleteProject(projectId);
      
      // Remove from state immediately
      removeProjectFromState(projectId, clientName);
      
      showSuccess('Project Deleted', 'Project has been successfully deleted.');
    } catch (error) {
      showError('Delete Failed', error instanceof Error ? error.message : 'Failed to delete project');
    }
  };

  const handleDeleteClient = async (clientName: string) => {
    const result = await showDeleteConfirm(
      'Delete Client',
      `Are you sure you want to delete the client "${clientName}" and all their projects?`,
      clientName
    );

    if (!result.isConfirmed) {
      return;
    }

    try {
      await ProjectService.deleteClient(clientName);
      setShowSkeleton(true);
      await refresh();
      showSuccess('Client Deleted', `Client "${clientName}" and all associated projects have been deleted successfully.`);
    } catch (error) {
      showError('Delete Failed', error instanceof Error ? error.message : 'Failed to delete client');
    }
  };

  const handleRemoveEmployeeFromProject = async (employeeId: string, projectId: string, clientName: string) => {
    try {
      await ProjectService.removeEmployeeFromProject(employeeId, projectId);

      // Update employee count for the project
      const employees = await ProjectService.getProjectEmployees(projectId);
      updateProjectEmployeeCount(projectId, clientName, employees.length);
      
      showSuccess('Employee Removed', 'Employee has been successfully removed from the project.');
    } catch (error) {
      showError('Remove Failed', error instanceof Error ? error.message : 'Failed to remove employee from project');
    }
  };

  const handleAddEmployeeToProject = async (projectId: string, clientName: string) => {
    try {
      // Update employee count for the project
      const employees = await ProjectService.getProjectEmployees(projectId);
      updateProjectEmployeeCount(projectId, clientName, employees.length);
    } catch (error) {
      showError('Refresh Failed', error instanceof Error ? error.message : 'Failed to refresh project employees');
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowEditTeamMemberDialog(true);
  };

  const handleUpdateEmployee = async (employeeData: Omit<Employee, 'id' | 'lastUpdated'>) => {
    if (!editingEmployee) return;

    try {
      await EmployeeService.updateEmployee(editingEmployee.id, employeeData);

      // Reload project employees
      if (selectedProject) {
        const emps = await ProjectService.getProjectEmployees(selectedProject.id);
        setProjectEmployees(emps);
      }

      showSuccess('Employee Updated', 'Employee has been successfully updated.');
      setShowEditTeamMemberDialog(false);
      setEditingEmployee(null);
    } catch (error) {
      showError('Update Failed', error instanceof Error ? error.message : 'Failed to update employee');
    }
  };

  //Handlers and necessary state for client-level employee display
  const [selectedClient, setSelectedClient] = useState<{ name: string } | null>(null);
  const [clientEmployees, setClientEmployees] = useState<Employee[]>([]);
  const [clientDetailLoading, setClientDetailLoading] = useState(false);
  const [isClientEmployeesCollapsed, setIsClientEmployeesCollapsed] = useState(false);

  // Add this handler function
  const handleOpenClientEmployees = async (clientName: string) => {
    setSelectedClient({ name: clientName });
    try {
      setClientDetailLoading(true);
      const employees = await ProjectService.getClientEmployees(clientName);
      setClientEmployees(employees);
    } catch (e) {
      console.error('Error loading client employees:', e);
      showError('Load Failed', e instanceof Error ? e.message : 'Failed to load client employees');
    } finally {
      setClientDetailLoading(false);
    }
  };

  // Add client employee totals calculation
  const clientTotals = useMemo(() => {
    const totalEmployees = clientEmployees.length;
    const totalBilling = clientEmployees.reduce((sum, e) => sum + (Number(e.rate) || 0), 0);
    return { totalEmployees, totalBilling };
  }, [clientEmployees]);

  // Add handler for removing employee from client (removes from all projects under client)
  const handleRemoveEmployeeFromClient = async (employeeId: string, clientName: string) => {
    try {
      // Get all projects for this client
      const projects = await ProjectService.getAllProjects();
      const clientProjects = projects.filter(p => p.client === clientName);

      // Remove employee from all projects under this client
      for (const project of clientProjects) {
        try {
          await ProjectService.removeEmployeeFromProject(employeeId, project.id);
        } catch (e) {
          console.warn(`Failed to remove employee from project ${project.name}:`, e);
        }
      }

      // Reload client employees
      if (selectedClient) {
        const emps = await ProjectService.getClientEmployees(selectedClient.name);
        setClientEmployees(emps);
      }
      showSuccess('Employee Removed', 'Employee has been successfully removed from all projects under this client.');
    } catch (error) {
      showError('Remove Failed', error instanceof Error ? error.message : 'Failed to remove employee from client');
    }
  };

  if (loading || showSkeleton) {
    return <SkeletonProjects />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6 text-rose-600">{error}</div>
    );
  }

  // Detail view in a separate full view (with Back/Close)
  if (selectedProject) {
    return (
      <div className="space-y-4">
        {/* Header with Client, Project, Back and Add Employee buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 pb-4">
          {/* Left side: Back button */}
          <button
            onClick={() => {
              setSelectedProject(null);
              setProjectDetails(null);
              setProjectEmployees([]);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm 
              hover:bg-gray-100 hover:border-gray-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {/* Center: Client and Project info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Client:</span>
              <span className="text-base sm:text-lg font-bold text-gray-900">
                {selectedProject.clientName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Project:</span>
              <span className="text-base sm:text-lg font-bold text-gray-900">
                {selectedProject.name}
              </span>
            </div>
          </div>

          {/* Right side: Add Employee button */}
          <button
            onClick={() => setShowEmployeeForm(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-400 to-blue-400 text-white rounded-lg text-sm 
              hover:from-slate-500 hover:to-blue-500 transition-colors"
          >
            <UserPlus className="h-4 w-4" /> Add Employee
          </button>
        </div>

        {detailLoading ? (
          <SkeletonProjectDetail employeeCount={5} />
        ) : (
          <div className="space-y-6">
            {/* Combined Project & Team Information Card */}
            {projectDetails && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div
                  className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 px-6 py-4 border-b cursor-pointer"
                  onClick={() => setIsProjectOverviewCollapsed(!isProjectOverviewCollapsed)}
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${isProjectOverviewCollapsed ? 'rotate-0' : 'rotate-90'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <h2 className="text-xl font-semibold text-slate-800">Project Overview</h2>
                  </div>
                </div>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isProjectOverviewCollapsed ? 'max-h-0 p-0' : 'max-h-screen p-6'}`}>
                  {/* Project Information Section */}
                  <div className="mb-8">

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-sm font-medium text-slate-600">Department</span>
                            <span className="text-sm text-slate-700">{projectDetails.department || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between items-start py-2 border-b border-slate-100">
                            <span className="text-sm font-medium text-slate-600">Description</span>
                            <span className="text-sm text-slate-700 text-right max-w-xs">{projectDetails.description || 'No description provided'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-sm font-medium text-slate-600">Start Date</span>
                            <span className="text-sm text-slate-700">{new Date(projectDetails.start_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-sm font-medium text-slate-600">End Date</span>
                            <span className="text-sm text-slate-700">{projectDetails.end_date ? new Date(projectDetails.end_date).toLocaleDateString() : 'Ongoing'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b border-slate-100 mt-[-6px]">
                            <span className="text-sm font-medium text-slate-600">Status</span>
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-md border ${projectDetails.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              projectDetails.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                projectDetails.status === 'On Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-slate-50 text-slate-700 border-slate-200'
                              }`}>
                              {projectDetails.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-sm font-medium text-slate-600">PO Number</span>
                            <span className="text-sm text-slate-700">{projectDetails.po_number || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-sm font-medium text-slate-600">Currency</span>
                            <span className="text-sm text-slate-700">{projectDetails.currency || 'USD'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-sm font-medium text-slate-600">Billing Type</span>
                            <span className="text-sm text-slate-700">{projectDetails.billing_type || 'Fixed'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Team Summary Section */}
                  <div>
                    {/* <h3 className="text-lg font-medium text-slate-700 mb-6 pb-2 border-b border-slate-100">Team Analytics</h3> */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-700">{totals.totalEmployees}</div>
                          <div className="text-sm text-blue-600 font-medium">Total Employees</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-700">{currency(totals.totalBilling, projectDetails?.currency || 'USD')}</div>
                          <div className="text-sm text-emerald-600 font-medium">Total Billing Rate</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-700">{projectDetails?.team_size || 0}</div>
                          <div className="text-sm text-purple-600 font-medium">Planned Team Size</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-700">
                            {projectDetails?.team_size ? Math.round((totals.totalEmployees / projectDetails.team_size) * 100) : 0}%
                          </div>
                          <div className="text-sm text-amber-600 font-medium">Team Utilization</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Employee Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emp ID</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">PO Number</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Billing Type</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Rate</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projectEmployees.map((e) => (
                      <tr key={e.id} className="group hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-700">{e.employeeId}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-700">{e.name}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">
                          <span className="font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                            {e.poNumber || 'Not assigned'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">{e.billing || '-'}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-700">{currency(Number(e.rate) || 0, projectDetails?.currency || 'USD')}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditEmployee(e)}
                              className="text-slate-600 hover:text-slate-900 p-1 rounded hover:bg-slate-50 transition-colors"
                              title="Edit employee"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async (event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                const result = await showDeleteConfirm(
                                  'Remove Employee',
                                  `Are you sure you want to remove ${e.name} from this project?`,
                                  e.name
                                );
                                if (result.isConfirmed) {
                                  await handleRemoveEmployeeFromProject(e.id, selectedProject.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                              title="Remove employee from project"
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {projectEmployees.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 sm:px-4 py-8 text-center text-sm text-gray-500">No employees linked to this project.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Employee Form Modal */}
        {showEmployeeForm && selectedProject && (
          <SimpleAddEmployee
            clientName={selectedProject.clientName}
            projectName={selectedProject.name}
            projectId={selectedProject.id}
            existingProjectEmployees={projectEmployees}
            onEmployeeAdded={handleAddEmployeeToProject}
            onClose={() => setShowEmployeeForm(false)}
          />
        )}

        {/* Edit Team Member Dialog */}
        {showEditTeamMemberDialog && editingEmployee && selectedProject && (
          <EditTeamMemberDialog
            employee={editingEmployee}
            projectId={selectedProject.id}
            projectName={selectedProject.name}
            onSave={handleUpdateEmployee}
            onClose={() => {
              setShowEditTeamMemberDialog(false);
              setEditingEmployee(null);
            }}
          />
        )}
      </div>
    );
  }

  // Client Employees detail view
  if (selectedClient) {
    return (
      <div className="space-y-4">
        {/* Header with Back button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 pb-4">
          <button
            onClick={() => {
              setSelectedClient(null);
              setClientEmployees([]);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm 
              hover:bg-gray-100 hover:border-gray-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Client:</span>
            <span className="text-base sm:text-lg font-bold text-gray-900">
              {selectedClient.name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users className="h-4 w-4" />
            <span>{clientEmployees.length} employees</span>
          </div>
        </div>

        {clientDetailLoading ? (
          <SkeletonProjectDetail employeeCount={5} />
        ) : (
          <div className="space-y-6">
            {/* Client Employees Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b cursor-pointer"
                onClick={() => setIsClientEmployeesCollapsed(!isClientEmployeesCollapsed)}
              >
                <div className="flex items-center space-x-3">
                  <svg
                    className={`w-4 h-4 text-green-600 transition-transform duration-200 ${isClientEmployeesCollapsed ? 'rotate-0' : 'rotate-90'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <h2 className="text-xl font-semibold text-green-800">Client Employee Summary</h2>
                </div>
              </div>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isClientEmployeesCollapsed ? 'max-h-0 p-0' : 'max-h-screen p-6'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700">{clientTotals.totalEmployees}</div>
                      <div className="text-sm text-blue-600 font-medium">Total Employees</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-700">
                        {currency(clientTotals.totalBilling, 'USD')}
                      </div>
                      <div className="text-sm text-emerald-600 font-medium">Total Billing Rate</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-700">
                        {clientEmployees.filter(e => e.billabilityStatus === 'Billable').length}
                      </div>
                      <div className="text-sm text-purple-600 font-medium">Billable Employees</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Employee Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-green-800">All Client Employees</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emp ID</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Project</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">PO Number</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Billing Type</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Rate</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clientEmployees.map((e) => (
                      <tr key={e.id} className="group hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-700">{e.employeeId}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-700">{e.name}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">
                          {e.projects === 'Not Assigned' ? (
                            <span className="text-gray-400 italic">Not Assigned</span>
                          ) : (
                            e.projects || 'Multiple'
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">
                          <span className="font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                            {e.poNumber || 'Not assigned'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">{e.billing || '-'}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-700">{currency(Number(e.rate) || 0, 'USD')}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditEmployee(e)}
                              className="text-slate-600 hover:text-slate-900 p-1 rounded hover:bg-slate-50 transition-colors"
                              title="Edit employee"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async (event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                const result = await showDeleteConfirm(
                                  'Remove Employee',
                                  `Are you sure you want to remove ${e.name} from all projects under ${selectedClient.name}?`,
                                  e.name
                                );
                                if (result.isConfirmed) {
                                  await handleRemoveEmployeeFromClient(e.id, selectedClient.name);
                                }
                              }}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                              title="Remove employee from all client projects"
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {clientEmployees.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 sm:px-4 py-8 text-center text-sm text-gray-500">
                          No employees found for this client across all projects.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }


  // List view
  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          {/* Search Bar - Left side */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients or projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
              onClick={() => {
                setShowSkeleton(true);
                refresh();
              }}
              disabled={loading}
              className="group inline-flex items-center justify-center gap-2 px-3 py-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Stats in the middle */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-400">
              <div className="text-sm font-medium text-blue-700">Clients:</div>
              <div className="text-sm font-bold text-blue-800 rounded-md min-w-6 text-center">
                {clients.length}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-400">
              <div className="text-sm font-medium text-emerald-700">Projects:</div>
              <div className="text-sm font-bold text-emerald-800 rounded-md min-w-6 text-center">
                {clients.reduce((total, client) => total + client.projects.filter(p =>
                  !p.name.startsWith('[Client]') && !p.name.startsWith('__CLIENT_ONLY__')
                ).length, 0)}
              </div>
            </div>
          </div>

          {/* Action Buttons - Right side */}
          <div className="flex gap-2 flex-shrink-0">

            <button
              onClick={() => setShowAddClientDialog(true)}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 hover:shadow-md transition-all duration-300"
            >
              <PlusCircle className="h-4 w-4" /> <span className="hidden sm:inline">Add Client</span>
            </button>
            <button
              onClick={() => setShowAddProjectDialog(true)}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-teal-700 hover:shadow-md transition-all duration-300"
            >
              <PlusCircle className="h-4 w-4" /> <span className="hidden sm:inline">Add Project</span>
            </button>
          </div>
        </div>
      </div>


      {/* Search Results Info - Full width below */}
      {searchTerm && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Filter className="h-4 w-4" />
            <span>
              Showing {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} matching "<span className="font-semibold">{searchTerm}</span>"
            </span>
          </div>
        </div>
      )}


      {/* Clients grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredClients.map((c) => {
          // Calculate total employees across all projects for this client
          const totalClientEmployees = c.totalEmployees || c.projects.reduce((sum, p) => sum + p.employeeCount, 0);

          return (
            <div key={c.client} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200">
              {/* Make the entire client header clickable */}
              <button
                onClick={() => handleOpenClientEmployees(c.client)}
                className="w-full p-4 border-b flex items-center justify-between hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-slate-400 to-blue-400 flex-shrink-0">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 text-sm truncate">{c.client}</div>
                    <div className="text-xs text-gray-500">
                      {c.projects.filter((p) =>
                        !p.name.startsWith('[Client]') && !p.name.startsWith('__CLIENT_ONLY__')
                      ).length} projects
                    </div>
                  </div>
                </div>

                {/* Employee Count Display - Now just a display element, not a button */}
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-800">
                    {totalClientEmployees}
                  </span>
                </div>
              </button>

              <div className="divide-y">
                {(() => {
                  const realProjects = c.projects;

                  if (realProjects.length === 0) {
                    return (
                      <div className="p-3 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <FolderKanban className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs">Not Allotted</span>
                        </div>
                      </div>
                    );
                  }

                  return realProjects.map((p) => (
                    <div key={p.id} className="p-3 hover:bg-slate-50 flex items-center justify-between group relative transition-colors duration-150">
                      <button
                        onClick={() => handleOpenProject(p.id, p.name, c.client)}
                        className="flex-1 text-left flex items-center gap-2"
                      >
                        <div className="p-1.5 rounded-md bg-slate-100">
                          <FolderKanban className="h-3.5 w-3.5 text-slate-700" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">{p.name}</div>
                          <div className="text-xs text-gray-500 truncate">Status: {p.status}</div>
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-gray-700">
                          <Users className="h-3.5 w-3.5" />
                          <span>{p.employeeCount}</span>
                        </div>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowProjectMenu(showProjectMenu === p.id ? null : p.id);
                            }}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-all duration-200 opacity-80 hover:opacity-100"
                            title="Project actions"
                          >
                            <MoreVertical className="h-3.5 w-3.5 text-gray-600" />
                          </button>
                          {showProjectMenu === p.id && (
                            <div data-menu className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditProject(p.id, c.client);
                                  }}
                                  className="w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50 text-xs flex items-center transition-colors duration-150"
                                >
                                  <Edit2 className="h-3.5 w-3.5 mr-2" />
                                  Edit Project
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      <AddClientDialog
        isOpen={showAddClientDialog}
        onClose={() => setShowAddClientDialog(false)}
        onAddClient={handleAddClient}
      />

      <AddProjectDialog
        isOpen={showAddProjectDialog}
        onClose={() => setShowAddProjectDialog(false)}
        onAddProject={handleAddProject}
        clients={clientNames}
      />

      <EditProjectDialog
        isOpen={showEditProjectDialog}
        onClose={() => {
          setShowEditProjectDialog(false);
          setEditingProject(null);
        }}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        project={editingProject}
        clients={clientNames}
      />
    </div>
  );
};

export default Projects;


