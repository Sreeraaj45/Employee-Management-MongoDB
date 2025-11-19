import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Edit2, Trash2, Plus } from 'lucide-react';
import { Employee, EmployeeProject } from '../../types';
import { EmployeeService } from '../../lib/employeeService';
import { showSuccess, showError, showDeleteConfirm } from '../../lib/sweetAlert';
import { AmendPODialog } from '../Projects/AmendPODialog';
import { ProjectService, POAmendment } from '../../lib/projectService';

interface EditTeamMemberDialogProps {
  employee: Employee;
  projectId: string;
  projectName: string;
  onSave: (employee: Omit<Employee, 'id' | 'lastUpdated'>) => void;
  onClose: () => void;
}

// ✅ ADD INTERFACE FOR EDITING AMENDMENTS
// ✅ UPDATED: Interface without onDelete
interface EditAmendmentDialogProps {
  isOpen: boolean;
  amendment: POAmendment | null;
  onClose: () => void;
  onSave: (amendmentId: string, data: { po_number: string; start_date: string; end_date?: string }) => void;
}

// ✅ UPDATED: Edit amendment dialog without delete functionality
const EditAmendmentDialog: React.FC<EditAmendmentDialogProps> = ({
  isOpen,
  amendment,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    po_number: '',
    start_date: '',
    end_date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (amendment && isOpen) {
      setFormData({
        po_number: amendment.po_number,
        start_date: amendment.start_date,
        end_date: amendment.end_date || ''
      });
    }
  }, [amendment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendment) return;

    if (!formData.po_number.trim()) {
      showError('Validation Error', 'PO Number is required');
      return;
    }

    if (!formData.start_date) {
      showError('Validation Error', 'Start Date is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(amendment.id, {
        po_number: formData.po_number.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date || undefined
      });
      onClose();
    } catch (error) {
      console.error('Error updating amendment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !amendment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit PO Amendment</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="po_number" className="block text-sm font-medium text-gray-700 mb-1">
              PO Number *
            </label>
            <input
              type="text"
              id="po_number"
              value={formData.po_number}
              onChange={(e) => setFormData(prev => ({ ...prev, po_number: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter PO number"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                id="start_date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                id="end_date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !formData.po_number.trim() || !formData.start_date}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EditTeamMemberDialog: React.FC<EditTeamMemberDialogProps> = ({ 
  employee, 
  projectId, 
  projectName, 
  onSave, 
  onClose 
}) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    department: '',
    location: '',
    billabilityStatus: 'Billable',
    projectStartDate: '',
    projectEndDate: '',
    allocationPercentage: 0,
    roleInProject: '',
    poNumber: '',
    billing: 'Monthly',
    rate: 0,    
  });

  const [loading, setLoading] = useState(false);
  
  // ✅ ENHANCED STATE FOR PO AMENDMENTS
  const [showAmendPODialog, setShowAmendPODialog] = useState(false);
  const [showEditAmendmentDialog, setShowEditAmendmentDialog] = useState(false);
  const [editingAmendment, setEditingAmendment] = useState<POAmendment | null>(null);
  const [existingAmendments, setExistingAmendments] = useState<POAmendment[]>([]);
  const [loadingAmendments, setLoadingAmendments] = useState(false);
  const [currentProjectAssignment, setCurrentProjectAssignment] = useState<EmployeeProject | null>(null);
  const [projectLoadError, setProjectLoadError] = useState<string>('');

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        console.log('🔄 Loading employee data for:', employee.name, 'Project ID:', projectId);
        
        const full = await EmployeeService.getEmployeeById(employee.id);
        const e = full || employee;
        
        const projectAssignment = e.employeeProjects?.find(ep => ep.projectId === projectId);
        console.log('📋 Found project assignment:', projectAssignment);
        
        setCurrentProjectAssignment(projectAssignment || null);
        
        setFormData({
          employeeId: e.employeeId || '',
          name: e.name || '',
          email: e.email || '',
          department: e.department || '',
          location: e.location || '',
          billabilityStatus: e.billabilityStatus || 'Billable',
          projectStartDate: projectAssignment?.startDate || '',
          projectEndDate: projectAssignment?.endDate || '',
          allocationPercentage: projectAssignment?.allocationPercentage || 100,
          roleInProject: projectAssignment?.roleInProject || '',
          poNumber: projectAssignment?.poNumber || '',
          billing: projectAssignment?.billing || 'Monthly',
          rate: projectAssignment?.rate || 0,
        });

        // ✅ FIXED: Load amendments using the correct project ID
        if (projectAssignment?.projectId) {
          console.log('🔄 Loading amendments for project:', projectAssignment.projectId);
          await loadExistingAmendments(projectAssignment.projectId);
        } else {
          console.warn('⚠️ No project assignment found for employee');
          setProjectLoadError('No project assignment found');
        }
      } catch (err) {
        console.error('❌ Failed to load employee data', err);
        const e = employee;
        const projectAssignment = e.employeeProjects?.find(ep => ep.projectId === projectId);
        setCurrentProjectAssignment(projectAssignment || null);
        
        setFormData({
          employeeId: e.employeeId || '',
          name: e.name || '',
          email: e.email || '',
          department: e.department || '',
          location: e.location || '',
          billabilityStatus: e.billabilityStatus || 'Billable',
          projectStartDate: projectAssignment?.startDate || '',
          projectEndDate: projectAssignment?.endDate || '',
          allocationPercentage: projectAssignment?.allocationPercentage || 100,
          roleInProject: projectAssignment?.roleInProject || '',
          poNumber: projectAssignment?.poNumber || '',
          billing: projectAssignment?.billing || 'Monthly',
          rate: projectAssignment?.rate || 0,
        });
        
        setProjectLoadError('Failed to load employee details');
      }
    };
    loadEmployee();
  }, [employee, projectId]);

  // ✅ IMPROVED: Enhanced loadExistingAmendments with better error handling
  const loadExistingAmendments = async (targetProjectId: string) => {
    if (!targetProjectId || targetProjectId.trim() === '') {
      console.error('❌ Invalid project ID provided:', targetProjectId);
      setProjectLoadError('Invalid project ID');
      setExistingAmendments([]);
      return;
    }

    try {
      setLoadingAmendments(true);
      setProjectLoadError('');
      console.log('🔄 Loading PO amendments for project:', targetProjectId);
      
      const amendments = await ProjectService.getPOAmendmentsForProject(targetProjectId);
      console.log('✅ Loaded amendments:', amendments);
      setExistingAmendments(amendments);
    } catch (error) {
      console.error('❌ Error loading PO amendments:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProjectLoadError(`Failed to load PO amendments: ${errorMessage}`);
      setExistingAmendments([]);
      
      // Don't show error toast here to avoid multiple popups
      console.error('PO amendments load error:', error);
    } finally {
      setLoadingAmendments(false);
    }
  };

  const handlePOAmended = () => {
    if (currentProjectAssignment?.projectId) {
      loadExistingAmendments(currentProjectAssignment.projectId);
    }
    setShowAmendPODialog(false);
  };

  // ✅ ADD FUNCTION TO EDIT AMENDMENT
  const handleEditAmendment = (amendment: POAmendment) => {
    setEditingAmendment(amendment);
    setShowEditAmendmentDialog(true);
  };

  // ✅ CORRECTED: Update amendment function with proper error handling
  const handleUpdateAmendment = async (amendmentId: string, data: { po_number: string; start_date: string; end_date?: string }) => {
    try {
      await ProjectService.updatePOAmendment(amendmentId, data);
      showSuccess('Amendment Updated', 'PO amendment has been successfully updated.');
      if (currentProjectAssignment?.projectId) {
        loadExistingAmendments(currentProjectAssignment.projectId);
      }
    } catch (error) {
      console.error('Error updating amendment:', error);
      showError('Update Failed', error instanceof Error ? error.message : 'Failed to update PO amendment');
      throw error; // Re-throw to handle in the dialog
    }
  };

  // ✅ CORRECTED: Delete amendment function with proper async handling
  const handleDeleteAmendment = async (amendment: POAmendment) => {
    const result = await showDeleteConfirm(
      'Delete PO Amendment',
      `Are you sure you want to delete the PO amendment "${amendment.po_number}"?`,
      amendment.po_number
    );

    if (!result.isConfirmed) {
      return;
    }

    try {
      await ProjectService.deletePOAmendment(amendment.id);
      showSuccess('Amendment Deleted', 'PO amendment has been successfully deleted.');
      if (currentProjectAssignment?.projectId) {
        loadExistingAmendments(currentProjectAssignment.projectId);
      }
    } catch (error) {
      showError('Delete Failed', error instanceof Error ? error.message : 'Failed to delete PO amendment');
    }
  };

  // ✅ CORRECTED: Activate/Deactivate function with proper project ID handling
  const handleToggleAmendmentStatus = async (amendment: POAmendment, isActive: boolean) => {
    try {
      if (isActive) {
        // Deactivate all amendments first, then activate the selected one
        if (currentProjectAssignment?.projectId) {
          await ProjectService.deactivateOldPOAmendments(currentProjectAssignment.projectId);
        }
        await ProjectService.activatePOAmendment(amendment.id);
        showSuccess('PO Activated', `PO ${amendment.po_number} is now active`);
      } else {
        await ProjectService.deactivatePOAmendment(amendment.id);
        showSuccess('PO Deactivated', `PO ${amendment.po_number} has been deactivated`);
      }
      
      if (currentProjectAssignment?.projectId) {
        loadExistingAmendments(currentProjectAssignment.projectId);
      }
    } catch (error) {
      showError('Status Update Failed', error instanceof Error ? error.message : 'Failed to update amendment status');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullEmployee = await EmployeeService.getEmployeeById(employee.id);
      const currentEmployee = fullEmployee || employee;

      const updatedEmployeeProjects = currentEmployee.employeeProjects?.map(ep => 
        ep.projectId === projectId 
          ? { 
              ...ep, 
              startDate: formData.projectStartDate, 
              endDate: formData.projectEndDate,
              allocationPercentage: formData.allocationPercentage,
              roleInProject: formData.roleInProject,
              poNumber: formData.poNumber,
              billing: formData.billing,
              rate: formData.rate
            }
          : ep
      ) || [];

      // Validate total allocation doesn't exceed 100%
      const totalAllocation = updatedEmployeeProjects.reduce((sum, project) => sum + project.allocationPercentage, 0);
      if (totalAllocation > 100) {
        showError('Allocation Error', `Total allocation cannot exceed 100%. Current total: ${totalAllocation}%`);
        setLoading(false);
        return;
      }

      const updatedEmployeeData: Omit<Employee, 'id' | 'lastUpdated'> = {
        ...currentEmployee,
        employeeId: formData.employeeId,
        name: formData.name,
        email: formData.email,
        department: formData.department,
        location: formData.location,
        billabilityStatus: formData.billabilityStatus,
        employeeProjects: updatedEmployeeProjects,
      };

      await onSave(updatedEmployeeData);
      showSuccess('Employee Updated', 'Team member has been successfully updated.');
      onClose();
    } catch (error) {
      showError('Update Failed', error instanceof Error ? error.message : 'Failed to update team member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Edit Team Member - {projectName}
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
                Billability Status
              </label>
              <select
                value={formData.billabilityStatus}
                onChange={(e) => setFormData({ ...formData, billabilityStatus: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              >
                <option value="Billable">Billable</option>
                <option value="Buffer">Buffer</option>
                <option value="Non-Billable">Non-Billable</option>
              </select>
            </div>
          </div>

          {/* Project Assignment Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Project Assignment - {projectName}</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAmendPODialog(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  disabled={!currentProjectAssignment}
                >
                  <Plus className="h-4 w-4" />
                  New Amendment
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.projectStartDate}
                  onChange={(e) => setFormData({ ...formData, projectStartDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.projectEndDate}
                  onChange={(e) => setFormData({ ...formData, projectEndDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allocation Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.allocationPercentage}
                  onChange={(e) => setFormData({ ...formData, allocationPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                />
                <div className="mt-1 text-xs text-gray-500">
                  Total allocation: {formData.allocationPercentage}%
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing
                </label>
                <select
                  value={formData.billing}
                  onChange={(e) => setFormData({ ...formData, billing: e.target.value })}
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
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
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
                  value={formData.roleInProject}
                  onChange={(e) => setFormData({ ...formData, roleInProject: e.target.value })}
                  placeholder="e.g., Developer, Lead, Architect"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                />
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PO Number
                </label>
                <input
                  type="text"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                  placeholder="Enter PO Number for this assignment"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* ✅ ENHANCED PO AMENDMENTS DISPLAY SECTION */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-medium text-gray-900">PO</h4>
                <span className="text-sm text-gray-500">
                  {existingAmendments.length} amendment(s)
                </span>
              </div>
              
              {loadingAmendments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading amendments...</p>
                </div>
              ) : existingAmendments.length > 0 ? (
                <div className="space-y-3">
                  {existingAmendments.map((amendment) => (
                    <div
                      key={amendment.id}
                      className={`p-4 border rounded-lg ${
                        amendment.is_active 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-sm font-medium">{amendment.po_number}</span>
                          {amendment.is_active && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* ✅ ACTIVATE/DEACTIVATE BUTTON */}
                          <button
                            type="button" // ADD THIS
                            onClick={() => handleToggleAmendmentStatus(amendment, !amendment.is_active)}
                            className={`px-2 py-1 text-xs rounded ${
                              amendment.is_active
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                          >
                            {amendment.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          
                          {/* ✅ EDIT BUTTON */}
                          <button
                            type="button" // ADD THIS
                            onClick={() => handleEditAmendment(amendment)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Edit amendment"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          
                          {/* ✅ DELETE BUTTON */}
                          <button
                            type="button" // ADD THIS
                            onClick={() => handleDeleteAmendment(amendment)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Delete amendment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                        <span>Start: {new Date(amendment.start_date).toLocaleDateString('en-IN')}</span>
                        {amendment.end_date && (
                          <span>End: {new Date(amendment.end_date).toLocaleDateString('en-IN')}</span>
                        )}
                        <span className="text-xs text-gray-400">
                          Created: {new Date(amendment.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No PO amendments found</p>
                  <p className="text-sm text-gray-400 mt-1">Create your first amendment to get started</p>
                </div>
              )}
            </div>
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
              disabled={loading}
              className="flex items-center justify-center space-x-2 px-6 py-2 bg-gradient-to-r from-slate-400 to-blue-400 text-white rounded-lg hover:from-slate-500 hover:to-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>

        {/* Amend PO Dialog */}
        {showAmendPODialog && currentProjectAssignment && (
          <AmendPODialog
            isOpen={showAmendPODialog}
            onClose={() => setShowAmendPODialog(false)}
            employee={employee}
            projectAssignment={currentProjectAssignment}
            onPOAmended={handlePOAmended}
          />
        )}

        {/* ✅ EDIT AMENDMENT DIALOG */}
        {showEditAmendmentDialog && (
          <EditAmendmentDialog
            isOpen={showEditAmendmentDialog}
            amendment={editingAmendment}
            onClose={() => {
              setShowEditAmendmentDialog(false);
              setEditingAmendment(null);
            }}
            onSave={handleUpdateAmendment}
          />
        )}
      </div>
    </div>
  );
};

export default EditTeamMemberDialog;