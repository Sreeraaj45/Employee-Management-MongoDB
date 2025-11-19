import React, { useState, useEffect } from 'react';
import { X, FolderKanban, ChevronDown } from 'lucide-react';

interface AddProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (projectData: ProjectData) => Promise<void>;
  clients: string[];
}

export interface ProjectData {
  name: string;
  client: string;
  description?: string;
  poNumber?: string;
  department?: string;
  startDate: string;
  endDate?: string;
  status: string;
  currency: string;
  billingType: string;
  teamSize: number;
}

const PROJECT_STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Completed', label: 'Completed' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const CURRENCY_OPTIONS = [
  { value: 'INR', label: '₹ Indian Rupee (INR)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'EUR', label: '€ Euro (EUR)' }
];

const BILLING_TYPE_OPTIONS = [
  { value: 'Fixed', label: 'Fixed Price' },
  { value: 'Hourly', label: 'Hourly Rate' },
  { value: 'Monthly', label: 'Monthly Retainer' }
];

export const AddProjectDialog: React.FC<AddProjectDialogProps> = ({
  isOpen,
  onClose,
  onAddProject,
  clients
}) => {
  const [formData, setFormData] = useState<ProjectData>({
    name: '',
    client: '',
    description: '',
    poNumber: '',
    department: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    status: 'Active',
    currency: 'USD',
    billingType: 'Fixed',
    teamSize: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'teamSize' ? (value ? Number(value) : 0) : value
    }));
  };

  const handleClientSelect = (client: string) => {
    setFormData(prev => ({ ...prev, client }));
    setShowClientDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!formData.client.trim()) {
      setError('Please select a client');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAddProject(formData);
      setFormData({
        name: '',
        client: '',
        description: '',
        poNumber: '',
        department: '',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        status: 'Active',
        currency: 'USD',
        billingType: 'Fixed',
        teamSize: 0
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        client: '',
        description: '',
        poNumber: '',
        department: '',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        status: 'Active',
        currency: 'USD',
        billingType: 'Fixed',
        teamSize: 0
      });
      setError(null);
      setShowClientDropdown(false);
      onClose();
    }
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        client: '',
        description: '',
        department: '',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        status: 'Active',
        currency: 'USD',
        billingType: 'Fixed',
        teamSize: 0
      });
      setError(null);
      setShowClientDropdown(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <FolderKanban className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add New Project</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowClientDropdown(!showClientDropdown)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between"
              >
                <span className={formData.client ? 'text-gray-900' : 'text-gray-500'}>
                  {formData.client || 'Select a client'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              
              {showClientDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {clients.length === 0 ? (
                    <div className="px-3 py-2 text-gray-500 text-sm">No clients available. Please add a client first.</div>
                  ) : (
                    clients.map((client) => (
                      <button
                        key={client}
                        type="button"
                        onClick={() => handleClientSelect(client)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                      >
                        {client}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project description"
            />
          </div>

          <div>
            <label htmlFor="poNumber" className="block text-sm font-medium text-gray-700 mb-1">
              PO Number
            </label>
            <input
              type="text"
              id="poNumber"
              name="poNumber"
              value={formData.poNumber || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter PO number"
            />
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PROJECT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="teamSize" className="block text-sm font-medium text-gray-700 mb-1">
                Team Size
              </label>
              <input
                type="number"
                id="teamSize"
                name="teamSize"
                value={formData.teamSize}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="billingType" className="block text-sm font-medium text-gray-700 mb-1">
                Billing
              </label>
              <select
                id="billingType"
                name="billingType"
                value={formData.billingType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {BILLING_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
              disabled={isSubmitting || !formData.name.trim() || !formData.client.trim()}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default AddProjectDialog;
