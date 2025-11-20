import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Edit, FileText, CheckCircle, Clock } from 'lucide-react';
import { Employee, EmployeeProject } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useDropdownOptions } from '../../hooks/useDropdownOptions';
import { EmployeeService } from '../../lib/employeeService';
import { useProjects } from '../../hooks/useProjects';
import { AmendPODialog } from '../Projects/AmendPODialog';
import { formatDateForInput } from '../../lib/dateUtils'; 


interface EmployeeFormProps {
  employee?: Employee;
  onSave: (employee: Omit<Employee, 'id' | 'lastUpdated'>) => void;
  onClose: () => void;
  disableClientProject?: boolean;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onSave, onClose, disableClientProject = false }) => {
  // Add these state variables with other state declarations
  const [showAmendPODialog, setShowAmendPODialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<EmployeeProject | null>(null);

  // Add this handler function with other handler functions
  const handleAmendPO = (assignment: EmployeeProject) => {
    setShowAmendPODialog(true);
    setSelectedAssignment(assignment);
  };
  const { user } = useAuth();
  const { options, addOption } = useDropdownOptions();
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    department: '',
    designation: '',
    modeOfManagement: 'Managed Service',
    client: '',
    billabilityStatus: 'Bench',
    lastActiveDate: '',
    projects: '',
    billabilityPercentage: 0,
    projectStartDate: '',
    projectEndDate: '',
    ageing: 0,
    benchDays: 0,
    phoneNumber: '',
    emergencyContact: '',
    ctc: 0,
    // ctcCurrency: 'INR' as 'INR' | 'USD' | 'EUR', // DISABLED
    remarks: '',
    lastModifiedBy: '',

    // Legacy fields
    position: '',
    joiningDate: '',
    location: '',
    manager: '',
    skills: [] as string[],
    dateOfSeparation: '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [newOptionInputs, setNewOptionInputs] = useState<{ [key: string]: string }>({});
  const { clientNames, getProjectsForClient } = useProjects();
  
  // State for multiple project assignments
  const [employeeProjects, setEmployeeProjects] = useState<EmployeeProject[]>([]);
  const [newProjectAssignment, setNewProjectAssignment] = useState({
    client: '',
    projectId: '',
    projectName: '',
    allocationPercentage: 0,
    startDate: '',
    endDate: '',
    roleInProject: '',
    poNumber: '',
    billing: 'Monthly', 
    rate: 0         
  });
  
  // State for editing project assignments
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectAssignment, setEditProjectAssignment] = useState({
    client: '',
    projectId: '',
    projectName: '',
    allocationPercentage: 0,
    startDate: '',
    endDate: '',
    roleInProject: '',
    poNumber: '',
    billing: 'Monthly', 
    rate: 0
  });

  // ✅ UPDATE HELPER FUNCTION TO CHECK IF PO IS ACTIVE - Include end date properly
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

  // ✅ ADD HELPER FUNCTION TO GET BILLABILITY STATUS
  const getAssignmentBillabilityStatus = (assignment: EmployeeProject): { status: string; isActive: boolean } => {
    // First check if there are any active PO amendments
    if (assignment.poAmendments && assignment.poAmendments.length > 0) {
      const activeAmendment = assignment.poAmendments.find(amendment => amendment.is_active);
      if (activeAmendment) {
        return { status: 'Billable', isActive: true };
      }
    }
    
    // If no active amendments, check the main assignment PO
    if (assignment.poNumber && assignment.startDate) {
      const isActive = isPOActive(assignment.startDate, assignment.endDate || undefined);
      return { 
        status: isActive ? 'Billable' : 'Bench', 
        isActive 
      };
    }
    
    // If no PO at all, it's bench
    return { status: 'Bench', isActive: false };
  };

  useEffect(() => {
    const loadEmployee = async () => {
      if (!employee) return;
      try {
        const full = await EmployeeService.getEmployeeById(employee.id);
        const e = full || employee;
        setFormData(prev => ({
          ...prev,
          employeeId: e.employeeId || '',
          name: e.name || '',
          email: e.email || '',
          department: e.department || '',
          designation: e.designation || '',
          modeOfManagement: e.modeOfManagement || 'Managed Service',
          client: e.client || '',
          billabilityStatus: e.billabilityStatus || 'Bench',
          // Removed global PO number (now per-assignment)
          billing: e.billing || '',
          // billingCurrency: e.billingCurrency || 'INR', // DISABLED
          lastActiveDate: e.lastActiveDate || '',
          projects: e.projects || '',
          billabilityPercentage: e.billabilityPercentage ?? 0,
          projectStartDate: e.projectStartDate || '',
          projectEndDate: e.projectEndDate || '',
          experienceBand: e.experienceBand || '0-2 years',
          rate: e.rate ?? 0,
          // rateCurrency: e.rateCurrency || 'INR', // DISABLED
          ageing: e.ageing ?? 0,
          benchDays: e.benchDays ?? 0,
          phoneNumber: e.phoneNumber || '',
          emergencyContact: e.emergencyContact || '',
          ctc: e.ctc ?? 0,
          // ctcCurrency: e.ctcCurrency || 'INR', // DISABLED
          remarks: e.remarks || '',
          lastModifiedBy: e.lastModifiedBy || '',
          position: e.position || '',
          joiningDate: e.joiningDate || '',
          location: e.location || '',
          manager: e.manager || '',
          skills: e.skills || [],
          dateOfSeparation: e.dateOfSeparation || '',
        }));
        
        // Load employee projects
        if (e.employeeProjects) {
          setEmployeeProjects(e.employeeProjects);
        }
      } catch (err) {
        console.error('Failed to load full employee data', err);
        // fall back to existing partial data
        const e = employee;
        setFormData(prev => ({
          ...prev,
          employeeId: e.employeeId || '',
          name: e.name || '',
          email: e.email || '',
          department: e.department || '',
          designation: e.designation || '',
          modeOfManagement: e.modeOfManagement || 'Managed Service',
          client: e.client || '',
          billabilityStatus: e.billabilityStatus || 'Bench',
          // Removed global PO number (now per-assignment)
          billing: e.billing || '',
          // billingCurrency: e.billingCurrency || 'INR', // DISABLED
          lastActiveDate: e.lastActiveDate || '',
          projects: e.projects || '',
          billabilityPercentage: e.billabilityPercentage ?? 0,
          projectStartDate: e.projectStartDate || '',
          projectEndDate: e.projectEndDate || '',
          experienceBand: e.experienceBand || '0-2 years',
          rate: e.rate ?? 0,
          // rateCurrency: e.rateCurrency || 'INR', // DISABLED
          ageing: e.ageing ?? 0,
          benchDays: e.benchDays ?? 0,
          phoneNumber: e.phoneNumber || '',
          emergencyContact: e.emergencyContact || '',
          ctc: e.ctc ?? 0,
          // ctcCurrency: e.ctcCurrency || 'INR', // DISABLED
          remarks: e.remarks || '',
          lastModifiedBy: e.lastModifiedBy || '',
          position: e.position || '',
          joiningDate: e.joiningDate || '',
          location: e.location || '',
          manager: e.manager || '',
          skills: e.skills || [],
          dateOfSeparation: e.dateOfSeparation || '',
        }));
        
        // Load employee projects from fallback data
        if (e.employeeProjects) {
          setEmployeeProjects(e.employeeProjects);
        }
      }
    };
    loadEmployee();
  }, [employee]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ FINAL VALIDATION: Check total allocation before submitting
    const totalAllocation = getTotalAllocation();
    if (totalAllocation > 100) {
      alert(`❌ Cannot save: Total allocation exceeds 100% (currently ${totalAllocation}%). Please adjust project allocations before saving.`);
      return;
    }

    if (totalAllocation < 0) {
      alert(`❌ Cannot save: Total allocation cannot be negative.`);
      return;
    }

    // ✅ AUTO-SET Billing Last Active Date to latest PO end date
    const latestPOEndDate = getLatestPOEndDate(employeeProjects);
    const finalLastActiveDate = latestPOEndDate || formData.lastActiveDate;

    // Create the employee data object with all required fields
    const employeeData: Omit<Employee, 'id' | 'lastUpdated'> = {
      sNo: 0, // This will be auto-generated by the database
      employeeId: formData.employeeId,
      name: formData.name,
      email: formData.email,
      department: formData.department,
      designation: formData.designation,
      modeOfManagement: formData.modeOfManagement,
      client: formData.client,
      billabilityStatus: formData.billabilityStatus,
      billing: formData.billing,
      lastActiveDate: finalLastActiveDate, // ✅ Use the calculated latest PO end date
      projects: formData.projects,
      employeeProjects: employeeProjects, // Include multiple project assignments
      billabilityPercentage: formData.billabilityPercentage,
      projectStartDate: formData.projectStartDate,
      projectEndDate: formData.projectEndDate,
      experienceBand: formData.experienceBand,
      rate: formData.rate,
      ageing: formData.ageing,
      benchDays: formData.benchDays,
      phoneNumber: formData.phoneNumber,
      emergencyContact: formData.emergencyContact,
      ctc: formData.ctc,
      remarks: formData.remarks,
      lastModifiedBy: formData.lastModifiedBy,
      position: formData.position,
      joiningDate: formData.joiningDate,
      location: formData.location,
      manager: formData.manager,
      skills: formData.skills,
      dateOfSeparation: formData.dateOfSeparation,
    };

    onSave(employeeData);
    onClose();
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const handleAddNewOption = async (fieldName: string) => {
    const newValue = newOptionInputs[fieldName]?.trim();
    if (!newValue) return;

    const result = await addOption(fieldName, newValue);
    if (result.success) {
      setFormData({ ...formData, [fieldName === 'mode_of_management' ? 'modeOfManagement' : fieldName === 'billability_status' ? 'billabilityStatus' : fieldName]: newValue });
      setNewOptionInputs({ ...newOptionInputs, [fieldName]: '' });
    } else {
      console.error(`Error adding option: ${result.error}`);
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    });
  };

  const addProjectAssignment = () => {
    if (!newProjectAssignment.client || !newProjectAssignment.projectId) return;
    
    const project = getProjectsForClient(newProjectAssignment.client).find(p => p.id === newProjectAssignment.projectId);
    if (!project) return;

    // Calculate current total allocation
    const currentTotalAllocation = employeeProjects.reduce((sum, p) => sum + p.allocationPercentage, 0);
    const newTotalAllocation = currentTotalAllocation + newProjectAssignment.allocationPercentage;

    // ✅ ENHANCED VALIDATION
    if (newProjectAssignment.allocationPercentage <= 0) {
      alert(`❌ Allocation percentage must be greater than 0%.`);
      return;
    }

    if (newTotalAllocation > 100) {
      alert(`❌ Total allocation cannot exceed 100%. Current total would be ${newTotalAllocation}%. Please reduce the allocation percentage.`);
      return;
    }

    const newAssignment: EmployeeProject = {
      id: `temp-${Date.now()}`, // Temporary ID for new assignments
      projectId: newProjectAssignment.projectId,
      projectName: project.name,
      client: newProjectAssignment.client,
      allocationPercentage: newProjectAssignment.allocationPercentage,
      startDate: newProjectAssignment.startDate || new Date().toISOString().split('T')[0],
      endDate: newProjectAssignment.endDate || undefined,
      roleInProject: newProjectAssignment.roleInProject || undefined,
      poNumber: (newProjectAssignment.poNumber?.trim() || project.poNumber || ''),
      billing: newProjectAssignment.billing || 'Monthly',
      rate: newProjectAssignment.rate || 0
    };

    setEmployeeProjects([...employeeProjects, newAssignment]);
    setNewProjectAssignment({
      client: '',
      projectId: '',
      projectName: '',
      allocationPercentage: Math.min(100, getRemainingAllocation()), // ✅ Auto-set to remaining allocation
      startDate: '',
      endDate: '',
      roleInProject: '',
      poNumber: '',
      billing: 'Monthly',
      rate: 0
    });
  };

  const removeProjectAssignment = (assignmentId: string) => {
    setEmployeeProjects(employeeProjects.filter(ep => ep.id !== assignmentId));
  };

  // Edit project assignment functions
  const startEditProjectAssignment = (assignment: EmployeeProject) => {
    setEditingProjectId(assignment.id);
    setEditProjectAssignment({
      client: assignment.client,
      projectId: assignment.projectId,
      projectName: assignment.projectName,
      allocationPercentage: assignment.allocationPercentage,
      startDate: assignment.startDate,
      endDate: assignment.endDate || '',
      roleInProject: assignment.roleInProject || '',
      poNumber: assignment.poNumber || '',
      billing: assignment.billing || 'Monthly',
      rate: assignment.rate || 0
    });
  };

  const cancelEditProjectAssignment = () => {
    setEditingProjectId(null);
    setEditProjectAssignment({
      client: '',
      projectId: '',
      projectName: '',
      allocationPercentage: 0,
      startDate: '',
      endDate: '',
      roleInProject: '',
      poNumber: '',
      billing: 'Monthly',
      rate: 0
    });
  };

  const saveEditProjectAssignment = () => {
    if (!editingProjectId || !editProjectAssignment.client || !editProjectAssignment.projectId) return;
    
    const project = getProjectsForClient(editProjectAssignment.client).find(p => p.id === editProjectAssignment.projectId);
    if (!project) return;

    // ✅ FIXED: Calculate current total allocation excluding the one being edited
    const currentTotalAllocation = employeeProjects
      .filter(ep => ep.id !== editingProjectId)
      .reduce((sum, p) => sum + p.allocationPercentage, 0);
    
    const newTotalAllocation = currentTotalAllocation + editProjectAssignment.allocationPercentage;

    // ✅ ENHANCED VALIDATION: Check if allocation exceeds 100%
    if (newTotalAllocation > 100) {
      alert(`❌ Total allocation cannot exceed 100%. Current total would be ${newTotalAllocation}%. Please reduce the allocation percentage.`);
      return;
    }

    // ✅ ADDITIONAL VALIDATION: Check if allocation is 0 or negative
    if (editProjectAssignment.allocationPercentage <= 0) {
      alert(`❌ Allocation percentage must be greater than 0%.`);
      return;
    }

    const updatedAssignment: EmployeeProject = {
      id: editingProjectId,
      projectId: editProjectAssignment.projectId,
      projectName: project.name,
      client: editProjectAssignment.client,
      allocationPercentage: editProjectAssignment.allocationPercentage,
      startDate: editProjectAssignment.startDate || new Date().toISOString().split('T')[0],
      endDate: editProjectAssignment.endDate || undefined,
      roleInProject: editProjectAssignment.roleInProject || undefined,
      poNumber: (editProjectAssignment.poNumber?.trim() || project.poNumber || ''),
      billing: editProjectAssignment.billing || 'Monthly',
      rate: editProjectAssignment.rate || 0
    };

    setEmployeeProjects(employeeProjects.map(ep => 
      ep.id === editingProjectId ? updatedAssignment : ep
    ));
    
    cancelEditProjectAssignment();
  };

  const handleEditClientChange = (client: string) => {
    setEditProjectAssignment({
      ...editProjectAssignment,
      client,
      projectId: '',
      projectName: ''
    });
  };

  const handleEditProjectChange = (projectId: string) => {
    const project = getProjectsForClient(editProjectAssignment.client).find(p => p.id === projectId);
    setEditProjectAssignment({
      ...editProjectAssignment,
      projectId,
      projectName: project?.name || ''
    });
  };

  const handleClientChange = (client: string) => {
    setNewProjectAssignment({
      ...newProjectAssignment,
      client,
      projectId: '',
      projectName: ''
    });
  };

  const handleProjectChange = (projectId: string) => {
    const project = getProjectsForClient(newProjectAssignment.client).find(p => p.id === projectId);
    setNewProjectAssignment({
      ...newProjectAssignment,
      projectId,
      projectName: project?.name || ''
    });
  };

  const canEditCTC = user?.role === 'Admin' || user?.role === 'HR';
  const canEditRemarks = user?.role === 'Admin' || user?.role === 'HR';

  // Helper function to calculate total allocation
  const getTotalAllocation = () => {
    return employeeProjects.reduce((sum, project) => sum + project.allocationPercentage, 0);
  };

  // Helper function to get remaining allocation
  const getRemainingAllocation = () => {
    return Math.max(0, 100 - getTotalAllocation()); // ✅ Ensure it doesn't go negative
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID <span className="text-red-500" title="Required">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500" title="Required">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email 
                {/* <span className="text-red-500" title="Required">*</span> */}
              </label>
              <input
                type="email"
                // required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department <span className="text-red-500" title="Required">*</span>
              </label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              >
                <option value="EMBEDDED">EMBEDDED</option>
                <option value="IT & FINANCE & ACCOUNTS">IT & FINANCE & ACCOUNTS</option>
                <option value="V&V">V&V</option>
                <option value="SALES & MARKETING">SALES & MARKETING</option>
                <option value="PROJECT MANAGEMENT">PROJECT MANAGEMENT</option>
                <option value="DATA SCIENCE ENGINEERING & TOOLS">DATA SCIENCE ENGINEERING & TOOLS</option>
                <option value="HR & ADMIN">HR & ADMIN</option>
                <option value="OPERATIONS">OPERATIONS</option>
                <option value="FINANCE & ACCOUNTS">FINANCE & ACCOUNTS</option>
                <option value="IT & ADMIN">IT & ADMIN</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designation <span className="text-red-500" title="Required">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Joining Date 
                {/* <span className="text-red-500" title="Required">*</span> */}
              </label>
              <input
                type="date"
                // required
                value={formatDateForInput(formData.joiningDate)}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position (Legacy)
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
            </div> */}

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
            </div> */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              >
                <option value="">Select Location</option>
                <option value="Chennai">Chennai</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Pune">Pune</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager
              </label>
              <input
                type="text"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
            </div>

            {canEditCTC && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CTC (Annual)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.ctc}
                    onChange={(e) => setFormData({ ...formData, ctc: parseInt(e.target.value) })}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  />
                  {/* Currency selection disabled */}
                  {/* <select
                    value={formData.ctcCurrency}
                    onChange={(e) => setFormData({ ...formData, ctcCurrency: e.target.value as 'INR' | 'USD' | 'EUR' })}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  >
                    <option value="INR">₹ INR</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                  </select> */}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 bg-gradient-to-r from-slate-400 to-blue-400 text-white rounded-lg hover:from-slate-500 hover:to-blue-500 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-2 text-slate-600 hover:text-slate-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {canEditRemarks && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode of Management
            </label>
            <div className="space-y-2">
              <select
                value={formData.modeOfManagement}
                onChange={(e) => setFormData({ ...formData, modeOfManagement: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              >
                {options.mode_of_management?.map((option) => (
                  <option key={option.id} value={option.optionValue}>
                    {option.optionValue}
                  </option>
                ))}
              </select>
              {user?.role === 'Admin' && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Add new option..."
                    value={newOptionInputs.mode_of_management || ''}
                    onChange={(e) => setNewOptionInputs({ ...newOptionInputs, mode_of_management: e.target.value })}
                    className="flex-1 px-3 py-1 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddNewOption('mode_of_management')}
                    className="px-3 py-1 text-sm bg-gradient-to-r from-emerald-300 to-teal-400 text-white rounded hover:from-emerald-400 hover:to-teal-500 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client (Legacy - for backward compatibility)
            </label>
            <select
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value, projects: '' })}
              className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent ${disableClientProject ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              disabled={disableClientProject}
            >
              <option value="">Select client</option>
              {clientNames.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div> */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Billability Status
            </label>
            <div className="space-y-2">
              <select
                value={formData.billabilityStatus}
                onChange={(e) => setFormData({ ...formData, billabilityStatus: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              >
                {options.billability_status?.map((option) => (
                  <option key={option.id} value={option.optionValue}>
                    {option.optionValue}
                  </option>
                ))}
              </select>
              {user?.role === 'Admin' && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Add new option..."
                    value={newOptionInputs.billability_status || ''}
                    onChange={(e) => setNewOptionInputs({ ...newOptionInputs, billability_status: e.target.value })}
                    className="flex-1 px-3 py-1 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddNewOption('billability_status')}
                    className="px-3 py-1 text-sm bg-gradient-to-r from-emerald-300 to-teal-400 text-white rounded hover:from-emerald-400 hover:to-teal-500 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Billing Last Active Date
            </label>
            <input
              type="date"
              value={formatDateForInput(formData.lastActiveDate)}
              onChange={(e) => setFormData({ ...formData, lastActiveDate: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
            />
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project (Legacy - for backward compatibility)
            </label>
            <select
              value={formData.projects}
              onChange={(e) => setFormData({ ...formData, projects: e.target.value })}
              className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent ${disableClientProject ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              disabled={disableClientProject || !formData.client}
            >
              <option value="">{formData.client ? 'Select project' : 'Select client first'}</option>
              {formData.client && getProjectsForClient(formData.client).map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div> */}

          {/* Multiple Project Assignments Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Project Assignments</h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Total Allocation: <span className="font-medium">{getTotalAllocation()}%</span>
                </div>
                <div className="text-sm text-gray-600">
                  Remaining: <span className="font-medium">{getRemainingAllocation()}%</span>
                </div>
                {getTotalAllocation() > 100 && (
                  <div className="text-sm text-red-600 font-medium">
                    ⚠️ Exceeds 100%
                  </div>
                )}
              </div>
            </div>
            
            {/* Add New Project Assignment */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">Add New Project Assignment</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newProjectAssignment.client}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                    disabled={disableClientProject}
                  >
                    <option value="">Select client</option>
                    {clientNames.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newProjectAssignment.projectId}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                    disabled={disableClientProject || !newProjectAssignment.client}
                  >
                    <option value="">{newProjectAssignment.client ? 'Select project' : 'Select client first'}</option>
                    {newProjectAssignment.client && getProjectsForClient(newProjectAssignment.client).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allocation Percentage <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0" 
                    max="100"
                    step="0.1"
                    value={newProjectAssignment.allocationPercentage}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      // ✅ Prevent setting allocation higher than remaining
                      const roundedValue = Math.round(value * 100) / 100;
                      const maxAllowed = Math.min(100, getRemainingAllocation());
                      setNewProjectAssignment({ 
                        ...newProjectAssignment, 
                        allocationPercentage: Math.min(roundedValue, maxAllowed)
                      });
                    }}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                    placeholder="e.g., 50"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Remaining allocation: {getRemainingAllocation().toFixed(2)}%
                    {newProjectAssignment.allocationPercentage > getRemainingAllocation() && (
                      <span className="text-red-500 ml-2">⚠️ Exceeds remaining</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PO Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProjectAssignment.poNumber}
                    onChange={(e) => setNewProjectAssignment({ ...newProjectAssignment, poNumber: e.target.value })}
                    placeholder="Enter PO Number for this assignment"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role in Project
                  </label>
                  <input
                    type="text"
                    value={newProjectAssignment.roleInProject}
                    onChange={(e) => setNewProjectAssignment({ ...newProjectAssignment, roleInProject: e.target.value })}
                    placeholder="e.g., Developer, Lead, Architect"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  />
                </div> */}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing
                  </label>
                  <select
                    value={newProjectAssignment.billing}
                    onChange={(e) => setNewProjectAssignment({ 
                      ...newProjectAssignment, 
                      billing: e.target.value 
                    })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Fixed">Fixed</option>
                    <option value="Daily">Daily</option>
                    <option value="Hourly">Hourly</option>
                  </select>
                </div>

                {/* ✅ ADD RATE FIELD */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={newProjectAssignment.rate}
                    onChange={(e) => setNewProjectAssignment({ 
                      ...newProjectAssignment, 
                      rate: parseFloat(e.target.value) || 0 
                    })}
                    placeholder="e.g., 1500"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(newProjectAssignment.startDate)}
                    onChange={(e) => setNewProjectAssignment({ ...newProjectAssignment, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(newProjectAssignment.endDate)}
                    onChange={(e) => setNewProjectAssignment({ ...newProjectAssignment, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={addProjectAssignment}
                  disabled={!newProjectAssignment.client || !newProjectAssignment.projectId || getRemainingAllocation() < newProjectAssignment.allocationPercentage}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-lg hover:from-emerald-500 hover:to-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Assign Project</span>
                </button>
              </div>
            </div>

            {/* Current Project Assignments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-medium text-gray-700">Current Project Assignments</h4>
                {getTotalAllocation() > 100 && (
                  <div className="text-sm text-red-600 font-medium bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                    ⚠️ Total allocation exceeds 100% ({getTotalAllocation()}%)
                  </div>
                )}
              </div>
              {employeeProjects.length === 0 ? (
                <p className="text-gray-500 italic">No project assignments yet. Add one above.</p>
              ) : (
                <div className="space-y-3">
                  {employeeProjects.map((assignment) => {
                    // ✅ GET BILLABILITY STATUS FOR EACH ASSIGNMENT
                    const billability = getAssignmentBillabilityStatus(assignment);
                    
                    return (
                      <div key={assignment.id} className="bg-white border border-slate-200 rounded-lg p-4">
                        {editingProjectId === assignment.id ? (
                          // Edit mode
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Client <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={editProjectAssignment.client}
                                  onChange={(e) => handleEditClientChange(e.target.value)}
                                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                >
                                  <option value="">Select client</option>
                                  {clientNames.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Project <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={editProjectAssignment.projectId}
                                  onChange={(e) => handleEditProjectChange(e.target.value)}
                                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                  disabled={!editProjectAssignment.client}
                                >
                                  <option value="">{editProjectAssignment.client ? 'Select project' : 'Select client first'}</option>
                                  {editProjectAssignment.client && getProjectsForClient(editProjectAssignment.client).map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Allocation Percentage
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={editProjectAssignment.allocationPercentage}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    // ✅ Calculate max allowed for this edit
                                    const otherProjectsTotal = employeeProjects
                                      .filter(ep => ep.id !== editingProjectId)
                                      .reduce((sum, p) => sum + p.allocationPercentage, 0);
                                    const maxAllowed = 100 - otherProjectsTotal;
                                    
                                    setEditProjectAssignment({ 
                                      ...editProjectAssignment, 
                                      allocationPercentage: Math.min(value, maxAllowed)
                                    });
                                  }}
                                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                />
                                <div className="mt-1 text-xs text-gray-500">
                                  Max allowed: {100 - employeeProjects.filter(ep => ep.id !== editingProjectId).reduce((sum, p) => sum + p.allocationPercentage, 0)}%
                                </div>
                              </div>
                          
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Billing
                                </label>
                                <select
                                  value={editProjectAssignment.billing}
                                  onChange={(e) => setEditProjectAssignment({ 
                                    ...editProjectAssignment, 
                                    billing: e.target.value 
                                  })}
                                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                >
                                  <option value="Monthly">Monthly</option>
                                  <option value="Fixed">Fixed</option>
                                  <option value="Daily">Daily</option>
                                  <option value="Hourly">Hourly</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Rate (₹)
                                </label>
                                <input
                                  type="number"
                                  value={editProjectAssignment.rate}
                                  onChange={(e) => setEditProjectAssignment({ 
                                    ...editProjectAssignment, 
                                    rate: parseFloat(e.target.value) || 0 
                                  })}
                                  placeholder="e.g., 1500"
                                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                />
                              </div>

                              {/* <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Role in Project
                                </label>
                                <input
                                  type="text"
                                  value={editProjectAssignment.roleInProject}
                                  onChange={(e) => setEditProjectAssignment({ ...editProjectAssignment, roleInProject: e.target.value })}
                                  placeholder="e.g., Developer, Lead, Architect"
                                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                />
                              </div> */}

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  PO Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={editProjectAssignment.poNumber}
                                  onChange={(e) => setEditProjectAssignment({ ...editProjectAssignment, poNumber: e.target.value })}
                                  placeholder="Enter PO Number for this assignment"
                                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Start Date
                                </label>
                                <input
                                  type="date"
                                  value={formatDateForInput(editProjectAssignment.startDate)}
                                  onChange={(e) => setEditProjectAssignment({ ...editProjectAssignment, startDate: e.target.value })}
                                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  End Date (Optional)
                                </label>
                                <input
                                  type="date"
                                  value={formatDateForInput(editProjectAssignment.endDate)}
                                  onChange={(e) => setEditProjectAssignment({ ...editProjectAssignment, endDate: e.target.value })}
                                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={cancelEditProjectAssignment}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={saveEditProjectAssignment}
                                disabled={!editProjectAssignment.client || !editProjectAssignment.projectId}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-lg hover:from-emerald-500 hover:to-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              {/* ✅ ADD BILLABILITY STATUS BADGE */}
                              <div className="flex items-center gap-2 mb-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  billability.status === 'Billable' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {billability.isActive ? (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Clock className="h-3 w-3 mr-1" />
                                  )}
                                  {billability.status}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {billability.isActive ? 'Active PO' : 'No active PO'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Client:</span>
                                  <p className="text-sm text-gray-900">{assignment.client}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Project:</span>
                                  <p className="text-sm text-gray-900">{assignment.projectName}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-500">PO Number:</span>
                                  <p className={`text-sm font-mono px-2 py-1 rounded ${
                                    billability.isActive 
                                      ? 'bg-green-50 text-green-800 border border-green-200' 
                                      : 'bg-gray-50 text-gray-600 border border-gray-200'
                                  }`}>
                                    {assignment.poNumber || 'Not assigned'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Allocation:</span>
                                  <p className="text-sm text-gray-900">{assignment.allocationPercentage}%</p>
                                </div>
                                {/* In the view mode section */}
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Billing:</span>
                                  <p className="text-sm text-gray-900">{assignment.billing || 'Not set'}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Rate:</span>
                                  <p className="text-sm text-gray-900">₹{assignment.rate || 'Not set'}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Role:</span>
                                  <p className="text-sm text-gray-900">{assignment.roleInProject || 'Not specified'}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Start Date:</span>
                                  <p className={`text-sm ${billability.isActive ? 'text-green-700 font-medium' : 'text-gray-900'}`}>
                                    {assignment.startDate}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-500">End Date:</span>
                                  <p className={`text-sm ${!assignment.endDate ? 'text-blue-600' : 'text-gray-900'}`}>
                                    {assignment.endDate || 'Ongoing'}
                                  </p>
                                </div>
                              </div>

                              {/* ✅ PO AMENDMENTS SECTION */}
                              {assignment.poAmendments && assignment.poAmendments.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <h6 className="text-sm font-medium text-gray-700">PO Amendments</h6>
                                    {/* <button
                                      type="button"
                                      onClick={() => handleAmendPO(assignment)}
                                      className="flex items-center gap-1 px-2 py-1.5 text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200 rounded-lg transition-colors text-sm"
                                      title="Amend PO"
                                    >
                                      <FileText className="h-4 w-4" />
                                      <span className="hidden sm:inline font-medium">Amend PO</span>
                                    </button> */}
                                  </div>
                                  
                                  <div className="space-y-2">
                                    {assignment.poAmendments.map((amendment) => (
                                      <div
                                        key={amendment.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border ${
                                          amendment.is_active 
                                            ? 'bg-green-50 border-green-200' 
                                            : 'bg-gray-50 border-gray-200'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-3">
                                          <div className="font-mono text-sm font-medium">{amendment.po_number}</div>
                                          {amendment.is_active && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                              Active
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          <div>Start: {new Date(amendment.start_date).toLocaleDateString('en-IN')}</div>
                                          {amendment.end_date && (
                                            <div>End: {new Date(amendment.end_date).toLocaleDateString('en-IN')}</div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <button
                                type="button"
                                onClick={() => startEditProjectAssignment(assignment)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit assignment"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAmendPO(assignment)}
                                className="flex items-center gap-1 px-2 py-1.5 text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200 rounded-lg transition-colors text-sm"
                                title="Amend PO"
                              >
                                <FileText className="h-4 w-4" />
                                <span className="hidden sm:inline font-medium">Amend PO</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => removeProjectAssignment(assignment.id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove assignment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Rate (Hourly/Daily) removed per request - keep only Billing Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Separation
            </label>
            <input
              type="date"
              value={formatDateForInput(formData.dateOfSeparation)}
              onChange={(e) => setFormData({ ...formData, dateOfSeparation: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Contact
            </label>
            <input
              type="tel"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
            />
          </div>


          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center justify-center space-x-2 px-6 py-2 bg-gradient-to-r from-slate-400 to-blue-400 text-white rounded-lg hover:from-slate-500 hover:to-blue-500 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Employee</span>
            </button>
          </div>
        </form>
      </div>
      {showAmendPODialog && (
        <AmendPODialog
          isOpen={showAmendPODialog}
          onClose={() => setShowAmendPODialog(false)}
          employee={employee} // Pass the current employee being edited
          projectAssignment={selectedAssignment}
          onPOAmended={() => {
            setShowAmendPODialog(false);
            // Refresh form data if needed
          }}
        />
      )}
    </div>
    
  );
};