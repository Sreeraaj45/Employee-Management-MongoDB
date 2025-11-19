import React from 'react';
import { Star, Edit } from 'lucide-react';
import { Employee } from '../../types';

interface SkillsProps {
  employee: Employee;
  onEdit: () => void;
}

export const Skills: React.FC<SkillsProps> = ({ employee, onEdit }) => {
  if (!employee.skills || employee.skills.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Star className="h-5 w-5 mr-2" />
          Skills
        </h3>
        <button
          onClick={onEdit}
          className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
        >
          <Edit className="h-4 w-4" />
          <span>Edit</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {employee.skills.map((skill, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
};