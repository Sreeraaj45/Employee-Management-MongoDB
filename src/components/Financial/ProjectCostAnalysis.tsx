import { FolderKanban, TrendingUp } from 'lucide-react';
import { Employee } from '../../types';
import { useEffect, useRef, useState } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

interface ProjectCostAnalysisProps {
  employees: Employee[];
}

export const ProjectCostAnalysis = ({ employees }: ProjectCostAnalysisProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [loading] = useState(false);
  const formatINR = (amount: number) => `₹${(amount / 100000).toFixed(1)}L`;

  // Calculate project-wise cost with client info
  const projectClientData = employees.reduce((acc, emp) => {
    const ctc = emp.ctc || 0;
    const client = emp.client || 'Unassigned';
    
    if (emp.employeeProjects && emp.employeeProjects.length > 0) {
      emp.employeeProjects.forEach(proj => {
        const projectName = proj.projectName || 'Unassigned';
        
        if (!acc[projectName]) {
          acc[projectName] = {
            totalCTC: 0,
            client: client,
            employeeCount: 0
          };
        }
        // Divide CTC by number of projects if employee is on multiple projects
        acc[projectName].totalCTC += ctc / emp.employeeProjects.length;
        acc[projectName].employeeCount += 1 / emp.employeeProjects.length;
      });
    } else {
      // Employee not assigned to any project
      if (!acc['Unassigned']) {
        acc['Unassigned'] = {
          totalCTC: 0,
          client: client,
          employeeCount: 0
        };
      }
      acc['Unassigned'].totalCTC += ctc;
      acc['Unassigned'].employeeCount += 1;
    }
    
    return acc;
  }, {} as { [key: string]: { totalCTC: number; client: string; employeeCount: number } });

  const projectData = Object.entries(projectClientData)
    .map(([project, data]) => ({
      project,
      totalCTC: data.totalCTC,
      client: data.client,
      employeeCount: Math.round(data.employeeCount)
    }))
    .sort((a, b) => b.totalCTC - a.totalCTC);

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

  const maxCTC = Math.max(...projectData.map(project => project.totalCTC));

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-14">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-xl">
              <FolderKanban className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Project Cost Analysis
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Total CTC by project
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {projectData.length}
            </div>
            <div className="text-sm text-gray-500">Projects</div>
          </div>
        </div>

        {/* Vertical Bar Chart */}
        <div className="flex items-end justify-between gap-1 h-74 py-4">
          {projectData.map((project, index) => {
            const barHeight = (project.totalCTC / maxCTC) * 100;
            const colorClass = colorPalette[index % colorPalette.length];
            const isSmallBar = barHeight < 15;

            return (
              <div
                key={project.project}
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
                          {formatINR(project.totalCTC)}
                        </span>
                      </div>

                      {/* Caret */}
                      <div
                        className={`w-0 h-0 mx-auto mt-[4px] border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-gray-300 shadow-lg`}
                      />
                    </div>
                  </div>
                </div>

                {/* Project Label */}
                <div className="text-center w-full min-h-[3rem] flex items-start justify-center px-0.5 mt-1">
                  <div className="flex flex-col items-center gap-0.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${colorClass} group-hover:scale-125 transition-transform`}
                    />
                    <span className="text-[10px] font-semibold text-gray-900 leading-tight break-words hyphens-auto max-w-[70px] line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {project.project}
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
                    {projectData.length}
                  </span>{' '}
                  projects
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-purple-500 to-pink-500" />
                <span>
                  Highest:{' '}
                  <span className="font-semibold text-gray-900">
                    {projectData[0]?.project}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span>
                Range:{' '}
                <span className="font-semibold text-gray-900">
                  {formatINR(projectData[projectData.length - 1]?.totalCTC || 0)} - {formatINR(projectData[0]?.totalCTC || 0)}
                </span>
              </span>
              <span>
                Total:{' '}
                <span className="font-semibold text-gray-900">
                  {formatINR(
                    projectData.reduce((sum, project) => sum + project.totalCTC, 0)
                  )}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {projectData.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FolderKanban className="h-4 w-4 text-gray-400" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">No Project Data</h4>
            <p className="text-xs text-gray-600 max-w-sm mx-auto">
              Project cost analysis will appear here when employee data is available
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
