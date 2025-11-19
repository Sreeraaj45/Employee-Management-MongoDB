import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Employee } from '../../types';
import { EmployeeService } from '../../lib/employeeService';
import { useDropdownOptions } from '../../hooks/useDropdownOptions';

interface FinancialInformationEditFormProps {
  employee: Employee;
  onSave: (updatedEmployee: Employee) => void;
  onCancel: () => void;
}

export const FinancialInformationEditForm: React.FC<FinancialInformationEditFormProps> = ({ 
  employee, 
  onSave, 
  onCancel 
}) => {
  const { options } = useDropdownOptions();
  const [formData, setFormData] = useState({
    ctc: employee.ctc,
    rate: employee.rate,
    billabilityPercentage: employee.billabilityPercentage,
    lastActiveDate: employee.lastActiveDate || '',
    ageing: employee.ageing,
    benchDays: employee.benchDays,
    experienceBand: employee.experienceBand,
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
      console.error('Error updating financial information:', error);
      alert('Failed to update financial information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Percentage') || name.includes('ageing') || name.includes('benchDays') 
        ? Number(value) 
        : value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Edit Financial Information</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="ctc" className="block text-sm font-medium text-gray-700 mb-1">
                CTC (₹) *
              </label>
              <input
                type="number"
                id="ctc"
                name="ctc"
                value={formData.ctc}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">
                Rate (₹) *
              </label>
              <input
                type="number"
                id="rate"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="billabilityPercentage" className="block text-sm font-medium text-gray-700 mb-1">
                Billability Percentage *
              </label>
              <input
                type="number"
                id="billabilityPercentage"
                name="billabilityPercentage"
                value={formData.billabilityPercentage}
                onChange={handleChange}
                required
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="lastActiveDate" className="block text-sm font-medium text-gray-700 mb-1">
                Last Active Date
              </label>
              <input
                type="date"
                id="lastActiveDate"
                name="lastActiveDate"
                value={formData.lastActiveDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="ageing" className="block text-sm font-medium text-gray-700 mb-1">
                Ageing (days) *
              </label>
              <input
                type="number"
                id="ageing"
                name="ageing"
                value={formData.ageing}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="benchDays" className="block text-sm font-medium text-gray-700 mb-1">
                Bench Days *
              </label>
              <input
                type="number"
                id="benchDays"
                name="benchDays"
                value={formData.benchDays}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="experienceBand" className="block text-sm font-medium text-gray-700 mb-1">
                Experience Band *
              </label>
              <select
                id="experienceBand"
                name="experienceBand"
                value={formData.experienceBand}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Experience Band</option>
                {options.experience_band?.map((option) => (
                  <option key={option.id} value={option.optionValue}>
                    {option.optionValue}
                  </option>
                ))}
              </select>
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