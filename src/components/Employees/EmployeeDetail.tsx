import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Trash2,
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Building, 
  DollarSign,
  Clock,
  TrendingUp,
  Users,
  FileText,
  ChevronRight,
  Star,
  Award,
  Briefcase,
  Target,
  Activity,
  X
} from 'lucide-react';
import { ExcelParser } from '../../lib/excelParser';
import { EmployeeService } from '../../lib/employeeService';
import { useAuth } from '../../hooks/useAuth';
import { PersonalInformation } from './PersonalInformation';
import { ProfessionalInformation } from './ProfessionalInformation';
import { FinancialInformation, PerformanceMetrics, SystemInformation } from './FinancialInformation';
import { Skills } from './Skills';
import { Remarks } from './Remarks';
import { PersonalInformationEditForm } from './PersonalInformationEditForm';
import { ProfessionalInformationEditForm } from './ProfessionalInformationEditForm';
import { FinancialInformationEditForm } from './FinancialInformationEditForm';
import { SkillsEditForm } from './SkillsEditForm';
import { RemarksEditForm } from './RemarksEditForm';
import { AmendPODialog } from '../Projects/AmendPODialog'; 
import { Employee, EmployeeProject } from '../../types'; 

interface EmployeeDetailProps {
  employee: Employee;
  onEdit: (employee: Employee, section?: string) => void;
  onBack: () => void;
  onDelete?: (employeeId: string) => void;
}

interface TimelineEvent {
  id: string;
  date: string;
  type: 'project_start' | 'project_end' | 'status_change' | 'joining' | 'promotion' | 'other';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export const EmployeeDetail = ({ employee, onEdit, onBack, onDelete }: EmployeeDetailProps) => {
  const { user } = useAuth();
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
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'projects' | 'documents' | 'skills'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(employee);
  const [activeEditForm, setActiveEditForm] = useState<string | null>(null);

  // Add this helper function with other helper functions
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

  const handleDeleteEmployee = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await EmployeeService.deleteEmployee(currentEmployee.id);
      if (onDelete) {
        onDelete(currentEmployee.id);
      }
      onBack(); // Go back to employee list
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee. Please try again.');
    }
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleEditSection = (section: string) => {
    setActiveEditForm(section);
  };

  const handleSaveEdit = (updatedEmployee: Employee) => {
    setCurrentEmployee(updatedEmployee);
    setActiveEditForm(null);
  };

  const handleCancelEdit = () => {
    setActiveEditForm(null);
  };

  // Generate timeline events from employee data
  const generateTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Joining date
    if (currentEmployee.joiningDate) {
      events.push({
        id: 'joining',
        date: currentEmployee.joiningDate,
        type: 'joining',
        title: 'Joined Company',
        description: `Started as ${currentEmployee.designation} in ${currentEmployee.department}`,
        icon: <User className="h-4 w-4" />,
        color: 'bg-green-500'
      });
    }

    // Project events
    if (currentEmployee.employeeProjects && currentEmployee.employeeProjects.length > 0) {
      currentEmployee.employeeProjects.forEach((project) => {
        events.push({
          id: `project-start-${project.id}`,
          date: project.startDate,
          type: 'project_start',
          title: `Started Project: ${project.projectName}`,
          description: `Assigned to ${project.client} project with ${project.allocationPercentage}% allocation`,
          icon: <Briefcase className="h-4 w-4" />,
          color: 'bg-blue-500'
        });

        if (project.endDate) {
          const endDate = new Date(project.endDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
          
          if (endDate < today) {
            events.push({
              id: `project-end-${project.id}`,
              date: project.endDate,
              type: 'project_end',
              title: `Completed Project: ${project.projectName}`,
              description: `Successfully completed ${project.client} project`,
              icon: <Award className="h-4 w-4" />,
              color: 'bg-purple-500'
            });
          } else {
            events.push({
              id: `project-end-${project.id}`,
              date: project.endDate,
              type: 'project_end',
              title: `Project End Date: ${project.projectName}`,
              description: `Scheduled to end on ${project.endDate}`,
              icon: <Calendar className="h-4 w-4" />,
              color: 'bg-orange-500'
            });
          }
        }
      });
    }

    // Sort events by date (newest first)
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const timelineEvents = generateTimelineEvents();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Billable': return 'bg-green-100 text-green-800 border-green-200';
      case 'Bench': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Trainee': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Buffer': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ML': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return ExcelParser.formatDateToDDMMYYYY(dateString);
  };

  const getAgeingColor = (ageing: number) => {
    if (ageing === 0) return 'text-green-600';
    if (ageing <= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBenchDaysColor = (benchDays: number) => {
    if (benchDays === 0) return 'text-green-600';
    if (benchDays <= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User className="h-4 w-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Activity className="h-4 w-4" /> },
    { id: 'projects', label: 'Projects', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
    { id: 'skills', label: 'Skills', icon: <Award className="h-4 w-4" /> },
  ];

  // Helper function to check if employee is inactive based on DOS
  const isEmployeeInactive = (dateOfSeparation: string | undefined | null): boolean => {
    if (!dateOfSeparation) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dosDate = new Date(dateOfSeparation);
    dosDate.setHours(0, 0, 0, 0);
    
    // Employee is inactive if DOS is today or in the past
    return dosDate <= today;
  };

  return (
    <div className="h-screen bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Employees</span>
              </button>
            </div>
            <button
              onClick={handleDeleteEmployee}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Employee</span>
            </button>
          </div>
        </div>
      </div>

      {/* Employee Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className={`h-20 w-20 rounded-full flex items-center justify-center ${
                  isEmployeeInactive(currentEmployee.dateOfSeparation) 
                    ? 'bg-gradient-to-br from-red-500 to-red-600'  // Red for inactive employees
                    : 'bg-gradient-to-br from-blue-500 to-purple-600' // Blue/purple for active
                }`}>
                  <span className="text-white text-4xl font-bold">
                    {currentEmployee.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold text-gray-900 truncate">{currentEmployee.name}</h1>
                <p className="text-lg text-gray-600 truncate">{currentEmployee.designation}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray px-3 py-1 bg-green-100 rounded-full border border-green-400">ID: {currentEmployee.employeeId}</span>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${
                    getStatusColor(currentEmployee.billabilityStatus)
                  }`}>
                    {currentEmployee.billabilityStatus}
                  </span>
                 
                  {/* Add DOS display here */}
                  {currentEmployee.dateOfSeparation && (
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${
                      isEmployeeInactive(currentEmployee.dateOfSeparation)
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-blue-200 bg-blue-50 text-blue-700'
                    }`}>
                      DOS: {ExcelParser.formatDateToDDMMYYYY(currentEmployee.dateOfSeparation)}
                      {!isEmployeeInactive(currentEmployee.dateOfSeparation) && ' (Upcoming)'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 lg:mt-0 lg:ml-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{currentEmployee.experienceBand}</div>
                  <div className="text-sm text-gray-500">Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(currentEmployee.rate)}</div>
                  <div className="text-sm text-gray-500">Rate</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getAgeingColor(calculateAgeing(currentEmployee.joiningDate))}`}>
                    {currentEmployee.joiningDate ? calculateAgeing(currentEmployee.joiningDate) : '-'}
                  </div>
                  <div className="text-sm text-gray-500">Ageing</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getBenchDaysColor(currentEmployee.benchDays || 0)}`}>
                    {isNaN(currentEmployee.benchDays) ? 0 : currentEmployee.benchDays}
                  </div>
                  <div className="text-sm text-gray-500">Bench Days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[73px] z-10 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'timeline' | 'projects' | 'documents' | 'skills')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{currentEmployee.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <PersonalInformation 
                employee={currentEmployee} 
                onEdit={() => handleEditSection('personal')} 
              />
              <ProfessionalInformation 
                employee={currentEmployee} 
                onEdit={() => handleEditSection('professional')} 
              />
              <Skills 
                employee={currentEmployee} 
                onEdit={() => handleEditSection('skills')} 
              />
              <Remarks 
                employee={currentEmployee} 
                onEdit={() => handleEditSection('remarks')} 
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Financial Information - Visible to Admin and Lead only */}
              {(user?.role === 'Admin' || user?.role === 'Lead') && (
                <FinancialInformation 
                  employee={currentEmployee} 
                  onEdit={() => handleEditSection('financial')} 
                />
              )}
              
              {/* Performance Metrics - Visible to All */}
              <PerformanceMetrics employee={currentEmployee} />
              
              {/* System Information - Visible to All */}
              <SystemInformation employee={currentEmployee} />
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Employee Timeline
              </h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-6">
                  {timelineEvents.map((event) => (
                    <div key={event.id} className="relative flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${event.color} text-white`}>
                        {event.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                          <time className="text-sm text-gray-500">{formatDate(event.date)}</time>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                      </div>
                    </div>
                  ))}
                  {timelineEvents.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No timeline events available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Project History
              </h3>
              {currentEmployee.employeeProjects && currentEmployee.employeeProjects.length > 0 ? ( // FIXED: changed employee to currentEmployee
                <div className="space-y-4">
                  {currentEmployee.employeeProjects.map((project) => ( // FIXED: changed employee to currentEmployee
                    <div key={project.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{project.projectName}</h4>
                            <div className="flex items-center space-x-2">
                              {/* Amend PO Button */}
                              <button
                                onClick={() => handleAmendPO(currentEmployee, project)}
                                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                                title="Amend PO"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                PO: {project.poNumber || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-3">{project.client}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Allocation:</span>
                              <span className="ml-2 font-medium">{project.allocationPercentage}%</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Start Date:</span>
                              <span className="ml-2 font-medium">{formatDate(project.startDate)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">End Date:</span>
                              <span className="ml-2 font-medium">
                                {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
                              </span>
                            </div>
                          </div>
                          {project.roleInProject && (
                            <div className="mt-3">
                              <span className="text-gray-500">Role:</span>
                              <span className="ml-2 font-medium">{project.roleInProject}</span>
                            </div>
                          )}
                          
                          {/* PO Amendments */}
                          {project.poAmendments && project.poAmendments.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h5 className="text-sm font-medium text-gray-700 mb-3">PO Amendments</h5>
                              <div className="space-y-2">
                                {project.poAmendments.map((amendment) => (
                                  <div
                                    key={amendment.id}
                                    className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                                      amendment.is_active 
                                        ? 'bg-green-50 border border-green-200' 
                                        : 'bg-gray-50 border border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <span className="font-mono">{amendment.po_number}</span>
                                      {amendment.is_active && (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                          Active
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-gray-500 text-sm">
                                      {new Date(amendment.start_date).toLocaleDateString('en-IN')}
                                      {amendment.end_date && ` - ${new Date(amendment.end_date).toLocaleDateString('en-IN')}`}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No project history available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Documents
              </h3>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Document management feature coming soon</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <EmployeeSkillsTab employeeId={currentEmployee.employeeId} />
        )}
      </div>

      {/* Edit Forms */}
      {activeEditForm === 'personal' && (
        <PersonalInformationEditForm
          employee={currentEmployee}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}

      {activeEditForm === 'professional' && (
        <ProfessionalInformationEditForm
          employee={currentEmployee}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}

      {activeEditForm === 'financial' && (user?.role === 'Admin' || user?.role === 'Lead') && (
        <FinancialInformationEditForm
          employee={currentEmployee}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}

      {activeEditForm === 'skills' && (
        <SkillsEditForm
          employee={currentEmployee}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}

      {activeEditForm === 'remarks' && (
        <RemarksEditForm
          employee={currentEmployee}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Amend PO Dialog - FIXED: removed the comment and placed properly */}
      {showAmendPODialog && (
        <AmendPODialog
          isOpen={showAmendPODialog}
          onClose={() => setShowAmendPODialog(false)}
          employee={selectedEmployee}
          projectAssignment={selectedProject}
          onPOAmended={() => {
            setShowAmendPODialog(false);
            // Refresh the employee data
            // You might need to implement a refetch mechanism here
          }}
        />
      )}
    </div>
  );
};

// Employee Skills Tab Component
interface EmployeeSkillsTabProps {
  employeeId: string;
}

const EmployeeSkillsTab: React.FC<EmployeeSkillsTabProps> = ({ employeeId }) => {
  const [skillData, setSkillData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkillData = async () => {
      setLoading(true);
      try {
        const { skillMappingApi } = await import('../../lib/api/skillMappingApi');
        const data = await skillMappingApi.getResponses();
        
        if (!Array.isArray(data)) {
          setSkillData(null);
          return;
        }
        
        const normalizedId = employeeId.replace(/\s+/g, '').toUpperCase();
        const employee = data.find((emp: any) => {
          const empId = emp.employee_id?.replace(/\s+/g, '').toUpperCase();
          return empId === normalizedId;
        });
        
        setSkillData(employee || null);
      } catch (err) {
        console.error('Error fetching skill data:', err);
        setSkillData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSkillData();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading skills data...</span>
          </div>
        </div>
      </div>
    );
  }

  const hasManagerReview = skillData?.manager_ratings && skillData.manager_ratings.length > 0;
  const skillCount = skillData?.skill_ratings?.length || 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Award className="h-5 w-5 mr-2" />
          Skills & Competencies
        </h3>
        
        {!skillData ? (
          <div className="text-center py-8">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No skill mapping data available</p>
            <p className="text-sm text-gray-400">This employee hasn't completed the skill mapping form yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
                <div className="text-2xl font-bold text-indigo-600">{skillCount}</div>
                <div className="text-sm text-gray-600">Skills Rated</div>
              </div>
              <div className={`bg-gradient-to-br rounded-lg p-4 border ${hasManagerReview ? 'from-green-50 to-emerald-50 border-green-100' : 'from-red-50 to-rose-50 border-red-100'}`}>
                <div className={`text-2xl font-bold flex items-center justify-center ${hasManagerReview ? 'text-green-600' : 'text-red-600'}`}>
                  {hasManagerReview ? '✓' : <X className="h-6 w-6" />}
                </div>
                <div className="text-sm text-gray-600">
                  {hasManagerReview ? 'Manager Reviewed' : 'Not Reviewed'}
                </div>
              </div>
            </div>

            {/* Submitted Date */}
            {skillData.timestamp && (
              <div className="text-sm text-gray-500">
                Submitted on: {new Date(skillData.timestamp).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            )}

            {/* View Details Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  // Store the employee response ID to open the review directly
                  sessionStorage.setItem('openEmployeeReview', skillData._id);
                  // Navigate to skill responses page which will auto-open the review
                  window.location.href = '/skill-responses';
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-700 border-2 border-indigo-200 rounded-lg hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-300 transition-all font-medium"
              >
                <Award className="h-5 w-5" />
                View Full Skill Details
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};