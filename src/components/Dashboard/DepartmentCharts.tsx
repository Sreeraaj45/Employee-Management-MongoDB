import { Users, BarChart3, TrendingUp } from 'lucide-react';
import { DashboardMetrics } from '../../types';

interface DepartmentDistributionChartProps {
  metrics: DashboardMetrics;
}

export const DepartmentDistributionChart = ({ metrics }: DepartmentDistributionChartProps) => {
  const departmentData = Object.entries(metrics.departmentDistribution)
    .map(([dept, count]) => ({
      department: dept,
      count,
      percentage: (count / metrics.totalEmployees) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  const colorPalette = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-indigo-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-green-500 to-lime-500',
    'from-violet-500 to-purple-500',
    'from-red-500 to-orange-500',
  ];

  const maxCount = Math.max(...departmentData.map((dept) => dept.count));

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-14">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Department Distribution
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Employee count across all departments
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.totalEmployees.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Employees</div>
          </div>
        </div>

        {/* Vertical Bar Chart */}
        <div className="flex items-end justify-between gap-1 h-74 py-4">
          {departmentData.map((dept, index) => {
            const barHeight = (dept.count / maxCount) * 100;
            const colorClass = colorPalette[index % colorPalette.length];
            const isSmallBar = barHeight < 15;

            return (
              <div
                key={dept.department}
                className="flex flex-col items-center flex-1 group cursor-pointer transition-all duration-300"
              >
                {/* Bar Container */}
                <div className="relative w-full flex flex-col items-center justify-end h-52 mb-2">
                  {/* Background Track */}
                  <div className="absolute inset-0 bg-gray-100 rounded-t" />

                  {/* Gradient Bar */}
                  <div
                    className={`w-10/12 rounded-t bg-gradient-to-t ${colorClass} transition-all duration-1000 ease-out group-hover:brightness-110 relative min-h-2`}
                    style={{ height: `${barHeight}%` }}
                  >
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent rounded-t-lg transition-opacity duration-300 group-hover:opacity-100 opacity-0" />

                    {/* Label + Caret */}
                    <div
                      className={`absolute -top-12 left-1/2 transform -translate-x-1/2 text-[11px] font-bold text-center z-10`}
                    >
                      <div
                        className={`bg-white/95 backdrop-blur-sm px-2 py-1 rounded border border-gray-100 shadow-lg whitespace-nowrap transition-all duration-300 ${
                          isSmallBar
                            ? 'opacity-100'
                            : 'opacity-100 group-hover:shadow-xl group-hover:scale-105'
                        }`}
                      >
                        <span className="font-bold text-[13px] text-gray-800">
                          {dept.count.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-blue-600 font-semibold ml-1">
                          ({dept.percentage.toFixed(1)}%)
                        </span>
                      </div>

                      {/* Caret */}
                      <div
                        className={`w-0 h-0 mx-auto mt-[4px] border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-gray-300 shadow-lg`}
                      />
                    </div>
                  </div>
                </div>

                {/* Department Label */}
                <div className="text-center w-full min-h-[3rem] flex items-start justify-center px-0.5 mt-1">
                  <div className="flex flex-col items-center gap-0.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${colorClass} group-hover:scale-125 transition-transform`}
                    />
                    <span className="text-[10px] font-semibold text-gray-900 leading-tight break-words hyphens-auto max-w-[70px] line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {dept.department}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>
                  <span className="font-semibold text-gray-900">
                    {departmentData.length}
                  </span>{' '}
                  departments
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-cyan-500" />
                <span>
                  Largest:{' '}
                  <span className="font-semibold text-gray-900">
                    {departmentData[0]?.department}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span>
                Range:{' '}
                <span className="font-semibold text-gray-900">
                  {departmentData[
                    departmentData.length - 1
                  ]?.count.toLocaleString()}{' '}
                  - {departmentData[0]?.count.toLocaleString()}
                </span>
              </span>
              <span>
                Average:{' '}
                <span className="font-semibold text-gray-900">
                  {Math.round(
                    metrics.totalEmployees / departmentData.length
                  ).toLocaleString()}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};