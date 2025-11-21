import React from 'react';
import { DollarSign, TrendingUp, Activity, Edit } from 'lucide-react';
import { Employee } from '../../types';

interface FinancialInformationProps {
  employee: Employee;
  onEdit: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const getAgeingColor = (ageing: number) => {
  if (ageing <= 30) return 'text-green-600';
  if (ageing <= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getBenchDaysColor = (benchDays: number) => {
  if (benchDays <= 30) return 'text-green-600';
  if (benchDays <= 60) return 'text-yellow-600';
  return 'text-red-600';
};

// Financial Summary - Admin Only
export const FinancialInformation: React.FC<FinancialInformationProps> = ({ employee, onEdit }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Financial Summary
        </h3>
        <button
          onClick={onEdit}
          className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
        >
          <Edit className="h-4 w-4" />
          <span>Edit</span>
        </button>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">CTC</span>
          <span className="font-semibold">{formatCurrency(employee.ctc)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Rate</span>
          <span className="font-semibold">{formatCurrency(employee.rate)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Billability %</span>
          <span className="font-semibold">{employee.billabilityPercentage}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Last Active</span>
          <span className="font-semibold">{formatDate(employee.lastActiveDate || '')}</span>
        </div>
      </div>
    </div>
  );
};

// Performance Metrics - Visible to All
export const PerformanceMetrics: React.FC<{ employee: Employee }> = ({ employee }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2" />
        Performance Metrics
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Ageing</span>
          <span className={`font-semibold ${getAgeingColor(employee.ageing)}`}>{employee.ageing} days</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Bench Days</span>
          <span className={`font-semibold ${getBenchDaysColor(employee.benchDays)}`}>{employee.benchDays} days</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Experience Band</span>
          <span className="font-semibold">{employee.experienceBand}</span>
        </div>
      </div>
    </div>
  );
};

// System Information - Visible to All
export const SystemInformation: React.FC<{ employee: Employee }> = ({ employee }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Activity className="h-5 w-5 mr-2" />
        System Information
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Last Modified By</span>
          <span className="font-semibold">{employee.lastModifiedBy || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Last Updated</span>
          <span className="font-semibold">{formatDate(employee.lastUpdated)}</span>
        </div>
      </div>
    </div>
  );
};