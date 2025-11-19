import React from 'react';
import { FileText, Edit } from 'lucide-react';
import { Employee } from '../../types';

interface RemarksProps {
  employee: Employee;
  onEdit: () => void;
}

export const Remarks: React.FC<RemarksProps> = ({ employee, onEdit }) => {
  if (!employee.remarks) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Remarks
        </h3>
        <button
          onClick={onEdit}
          className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
        >
          <Edit className="h-4 w-4" />
          <span>Edit</span>
        </button>
      </div>
      <p className="text-gray-700">{employee.remarks}</p>
    </div>
  );
};