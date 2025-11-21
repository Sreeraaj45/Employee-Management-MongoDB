import React from 'react';
import { User, Mail, Phone, MapPin, Calendar, Clock, Edit } from 'lucide-react';
import { Employee } from '../../types';

interface PersonalInformationProps {
  employee: Employee;
  onEdit: () => void;
}

export const PersonalInformation: React.FC<PersonalInformationProps> = ({ employee, onEdit }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };

  const calculateExperience = () => {
    if (!employee.joiningDate) return '-';
    try {
      const joiningDate = new Date(employee.joiningDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - joiningDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      
      if (years > 0) {
        return `${years} year${years > 1 ? 's' : ''} ${months > 0 ? `${months} month${months > 1 ? 's' : ''}` : ''}`;
      } else {
        return `${months} month${months > 1 ? 's' : ''}`;
      }
    } catch (error) {
      return '-';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Personal Information
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
          <Mail className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="font-medium">{employee.email}</div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Phone className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">Phone</div>
            <div className="font-medium">{employee.phoneNumber || 'N/A'}</div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Phone className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">Emergency Contact</div>
            <div className="font-medium">{employee.emergencyContact || 'N/A'}</div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <MapPin className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">Location</div>
            <div className="font-medium">{employee.location || 'N/A'}</div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Calendar className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">Joining Date</div>
            <div className="font-medium">{formatDate(employee.joiningDate)}</div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Clock className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">Experience</div>
            <div className="font-medium">{calculateExperience()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};