import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, Hash, AlertCircle } from 'lucide-react';
import { showSuccess, showError } from '../../lib/sweetAlert';
import { ProjectService, POAmendment } from '../../lib/projectService';
import { Employee, EmployeeProject } from '../../types';

interface AmendPODialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee; // Make optional for EmployeeForm
  projectAssignment?: EmployeeProject; // Change from projectId/projectName to projectAssignment
  onPOAmended: () => void;
}

export const AmendPODialog: React.FC<AmendPODialogProps> = ({
  isOpen,
  onClose,
  employee,
  projectAssignment,
  onPOAmended
}) => {
  const projectId = projectAssignment?.projectId || '';
  const projectName = projectAssignment?.projectName || 'Unknown Project';
  const [formData, setFormData] = useState({
    po_number: '',
    start_date: '',
    end_date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingAmendments, setExistingAmendments] = useState<POAmendment[]>([]);
  const [loadingAmendments, setLoadingAmendments] = useState(false);
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadExistingAmendments();
    }
  }, [isOpen, projectId]);

  const loadExistingAmendments = async () => {
    try {
      setLoadingAmendments(true);
      const amendments = await ProjectService.getPOAmendmentsForProject(projectId);
      setExistingAmendments(amendments);
    } catch (error) {
      console.error('Error loading PO amendments:', error);
    } finally {
      setLoadingAmendments(false);
    }
  };

  const validateDates = (startDate: string, endDate: string): boolean => {
    if (!endDate) return true; // No end date is valid
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      setDateError('End date must be after start date');
      return false;
    }
    
    setDateError('');
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate dates when both are present
    if ((name === 'start_date' || name === 'end_date') && formData.start_date && formData.end_date) {
      validateDates(
        name === 'start_date' ? value : formData.start_date,
        name === 'end_date' ? value : formData.end_date
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.po_number.trim()) {
      showError('Validation Error', 'PO Number is required');
      return;
    }

    if (!formData.start_date) {
      showError('Validation Error', 'Start Date is required');
      return;
    }

    if (formData.end_date && !validateDates(formData.start_date, formData.end_date)) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Create new PO amendment - the service will handle activation logic
      await ProjectService.createPOAmendment(projectId, {
        po_number: formData.po_number.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date || null
      });

      showSuccess('PO Amendment Created', 'New PO amendment has been created successfully. It will become active based on the start date.');
      
      // Reset form and close dialog
      setFormData({
        po_number: '',
        start_date: '',
        end_date: ''
      });
      setDateError('');
      
      onPOAmended();
      onClose();
    } catch (error) {
      console.error('Error creating PO amendment:', error);
      showError('Amendment Failed', error instanceof Error ? error.message : 'Failed to create PO amendment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNextAvailableStartDate = (): string => {
    if (existingAmendments.length === 0) {
      return new Date().toISOString().split('T')[0];
    }

    // Find the latest end date among existing amendments
    const latestEndDate = existingAmendments.reduce((latest, amendment) => {
      if (amendment.end_date) {
        const endDate = new Date(amendment.end_date);
        return endDate > latest ? endDate : latest;
      }
      return latest;
    }, new Date(0)); // Start with epoch

    // If we found an end date, suggest the next day
    if (latestEndDate.getTime() > 0) {
      const nextDay = new Date(latestEndDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return nextDay.toISOString().split('T')[0];
    }

    return new Date().toISOString().split('T')[0];
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        po_number: '',
        start_date: '',
        end_date: ''
      });
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Amend PO</h2>
              <p className="text-sm text-gray-600">Project: {projectName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Existing PO Amendments */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Existing PO</h3>
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
                    className={`p-3 border rounded-lg ${
                      amendment.is_active 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-sm">{amendment.po_number}</span>
                        {amendment.is_active && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(amendment.start_date)}</span>
                        </div>
                        {amendment.end_date && (
                          <>
                            <span>→</span>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(amendment.end_date)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-gray-300 rounded-lg">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No PO amendments found</p>
              </div>
            )}
          </div>

          {/* New PO Amendment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Add New PO Amendment</h3>
            
            <div>
              <label htmlFor="po_number" className="block text-sm font-medium text-gray-700 mb-1">
                New PO Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="po_number"
                  name="po_number"
                  value={formData.po_number}
                  onChange={handleInputChange}
                  required
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter new PO number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    min={getNextAvailableStartDate()}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Suggested: {getNextAvailableStartDate()}
                </p>
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                {dateError && (
                  <div className="flex items-center mt-1 text-red-600 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {dateError}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">How PO Amendments Work</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    • PO becomes active when current date is between start and end dates<br/>
                    • If no end date, PO remains active indefinitely after start date<br/>
                    • Only one PO can be active at a time<br/>
                    • System automatically manages activation based on dates
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.po_number.trim() || !formData.start_date}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    <span>Create PO Amendment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AmendPODialog;