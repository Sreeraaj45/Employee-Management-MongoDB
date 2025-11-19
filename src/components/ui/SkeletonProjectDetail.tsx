import React from 'react';

interface SkeletonProjectDetailProps {
  showTeamMembers?: boolean;
  employeeCount?: number;
}

export const SkeletonProjectDetail: React.FC<SkeletonProjectDetailProps> = ({
  showTeamMembers = true,
  employeeCount = 5
}) => {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 pb-4">
        {/* Back Button */}
        <div className="animate-pulse">
          <div className="h-10 w-16 bg-gray-200 rounded-lg"></div>
        </div>

        {/* Client and Project Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="animate-pulse">
            <div className="h-5 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-5 w-40 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Add Employee Button */}
        <div className="animate-pulse">
          <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>

      {/* Project Overview Card Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 px-6 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="animate-pulse">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-6 w-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        
        {/* Card Content */}
        <div className="p-6">
          {/* Project Information Section */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Column */}
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <div className="animate-pulse">
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    </div>
                    <div className="animate-pulse">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <div className="animate-pulse">
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    </div>
                    <div className="animate-pulse">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Analytics Section */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="text-center">
                    <div className="animate-pulse">
                      <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded mx-auto"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Table Skeleton */}
      {showTeamMembers && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b">
            <div className="animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
          
          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Emp ID', 'Employee Name', 'Billing Type', 'Billing Rate', 'Actions'].map((header, index) => (
                    <th key={index} className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: employeeCount }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <div className="flex space-x-1">
                        <div className="h-6 w-6 bg-gray-200 rounded"></div>
                        <div className="h-6 w-6 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkeletonProjectDetail;