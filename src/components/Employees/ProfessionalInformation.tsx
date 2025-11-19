import React from 'react';
import { Building, Briefcase, Users, Target, DollarSign, Edit } from 'lucide-react';
import { Employee } from '../../types';

interface ProfessionalInformationProps {
  employee: Employee;
  onEdit: () => void;
}

export const ProfessionalInformation: React.FC<ProfessionalInformationProps> = ({ employee, onEdit }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Building className="h-5 w-5 mr-2" />
          Professional Information
        </h3>
        <button
          onClick={onEdit}
          className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
        >
          <Edit className="h-4 w-4" />
          <span>Edit</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-3">
          <Building className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">Department</div>
            <div className="font-medium">{employee.department}</div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Briefcase className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">Designation</div>
            <div className="font-medium">{employee.designation}</div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Users className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">Manager</div>
            <div className="font-medium">{employee.manager || 'N/A'}</div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Target className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">Mode of Management</div>
            <div className="font-medium">{employee.modeOfManagement}</div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Building className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">Client</div>
            <div className="font-medium">{employee.client || 'N/A'}</div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">Billing</div>
            <div className="font-medium">{employee.billing || 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};