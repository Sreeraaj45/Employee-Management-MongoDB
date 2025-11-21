import React from 'react';
import { 
  Users, 
  BarChart3, 
  Upload, 
  Settings, 
  FileText,
  DollarSign,
  Calendar,
  LogOut,
  X
} from 'lucide-react';
import { User } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, onClose }) => {
  const { user, logout, isLoading } = useAuth();

  const getNavItems = (userRole: string) => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['Admin', 'Lead', 'HR'] },
      { id: 'employees', label: 'Employees', icon: Users, roles: ['Admin', 'Lead', 'HR'] },
      { id: 'projects', label: 'Projects', icon: Calendar, roles: ['Admin', 'Lead', 'HR'] },
      { id: 'financial', label: 'Financial', icon: DollarSign, roles: ['Admin', 'Lead'] },
      { id: 'reports', label: 'Reports', icon: FileText, roles: ['Admin', 'Lead', 'HR'] },
      { id: 'skill-responses', label: 'Skill Mapping', icon: FileText, roles: ['Admin', 'Lead', 'HR'] },
      { id: 'upload', label: 'Bulk Upload', icon: Upload, roles: ['Admin'] },
      { id: 'user-management', label: 'User Management', icon: Users, roles: ['Admin'] },
      { id: 'settings', label: 'Settings', icon: Settings, roles: ['Admin', 'Lead', 'HR'] },
    ];

    return items.filter(item => item.roles.includes(userRole));
  };

  return (
    <div className="bg-white h-full w-56 lg:w-45 shadow-lg flex flex-col border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-blue-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">EmpManage</h1>
              {/* <p className="text-xs text-gray-500 truncate">Employee Dashboard</p> */}
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Navigation - REDUCED spacing between rows */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2"> {/* Changed from space-y-3 to space-y-2 */}
          {getNavItems(user!.role).map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200 text-sm font-medium ${
                  currentPage === item.id
                    ? 'bg-gradient-to-r from-slate-50 to-blue-100 text-slate-700 border-r-4 border-slate-500 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                }`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${
                  currentPage === item.id ? 'text-slate-600' : 'text-gray-400'
                }`} />
                <span className="truncate">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3 mb-3 ml-2">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-sm truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          disabled={isLoading}
          className="w-full flex items-center space-x-2 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{isLoading ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
};