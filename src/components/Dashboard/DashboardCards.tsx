// components/Dashboard/DashboardCards.tsx (your existing code)
import { Users, TrendingUp, Clock, Target } from 'lucide-react';
import { DashboardMetrics } from '../../types';
import { DepartmentDistributionChart } from './DepartmentCharts';
import { ClientDistributionChart } from './ClientCharts';
import { ProjectDistributionChart } from './ProjectCharts';
import { useEffect, useState } from 'react';
import { DashboardService } from '../../lib/dashboardService';

interface DashboardCardsProps {
  metrics: DashboardMetrics;
}

export const DashboardCards = ({ metrics }: DashboardCardsProps) => {
  const cards = [
    {
      title: 'Total Employees',
      value: metrics.totalEmployees.toString(),
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-100'
    },
    {
      title: 'Billability Rate',
      value: `${metrics.billabilityPercentage.toFixed(1)}%`,
      icon: Target,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-100'
    },
    {
      title: 'Bench Count',
      value: metrics.benchEmployees.toString(),
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50',
      borderColor: 'border-amber-100'
    },
    {
      title: 'Billable',
      value: metrics.billableEmployees.toString(),
      icon: TrendingUp,
      gradient: 'from-purple-500 to-indigo-600',
      bgGradient: 'from-purple-50 to-indigo-50',
      borderColor: 'border-purple-100'
    }
  ];

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((card, index) => (
          <div 
            key={index} 
            className={`bg-gradient-to-br ${card.bgGradient} rounded-xl border ${card.borderColor} p-4 hover:shadow-md transition-all duration-300 hover:scale-[1.02] group`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`bg-gradient-to-br ${card.gradient} p-2 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900">{card.value}</h3>
              <p className="text-xs text-gray-600 font-medium">{card.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Department Chart */}
      <div className="mb-6">
        <DepartmentDistributionChart metrics={metrics} />
      </div>

      {/* Client and Project Charts - One below the other */}
      <div className="grid grid-cols-1 gap-6">
        <ClientDistributionChart metrics={metrics} />
        <ProjectDistributionChart metrics={metrics} />
      </div>
    </div>
  );
};