import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Employee } from '../../types';
import { EmployeeService } from '../../lib/employeeService';
import { useDropdownOptions } from '../../hooks/useDropdownOptions';

interface ProfessionalInformationEditFormProps {
  employee: Employee;
  onSave: (updatedEmployee: Employee) => void;
  onCancel: () => void;
}

export const ProfessionalInformationEditForm: React.FC<ProfessionalInformationEditFormProps> = ({ 
  employee, 
  onSave, 
  onCancel 
}) => {
  const { options } = useDropdownOptions();
  const [formData, setFormData] = useState({
    department: employee.department,
    designation: employee.designation,
    manager: employee.manager || '',
    modeOfManagement: employee.modeOfManagement,
    client: employee.client || '',
    billing: employee.billing || '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatedEmployee = {
        ...employee,
        ...formData,
      };

      await EmployeeService.updateEmployee(employee.id, updatedEmployee);
      onSave(updatedEmployee);
    } catch (error) {
      console.error('Error updating professional information:', error);
      alert('Failed to update professional information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Edit Professional Information</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">
                Designation *
              </label>
              <input
                type="text"
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-1">
                Manager
              </label>
              <input
                type="text"
                id="manager"
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="modeOfManagement" className="block text-sm font-medium text-gray-700 mb-1">
                Mode of Management *
              </label>
              <select
                id="modeOfManagement"
                name="modeOfManagement"
                value={formData.modeOfManagement}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {options.mode_of_management?.map((option) => (
                  <option key={option.id} value={option.optionValue}>
                    {option.optionValue}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <input
                type="text"
                id="client"
                name="client"
                value={formData.client}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="billing" className="block text-sm font-medium text-gray-700 mb-1">
                Billing
              </label>
              <input
                type="text"
                id="billing"
                name="billing"
                value={formData.billing}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
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