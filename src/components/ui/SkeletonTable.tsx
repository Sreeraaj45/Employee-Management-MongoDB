import React from 'react';

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  responsive?: string;
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showAvatar?: boolean;
  showActions?: boolean;
  columnConfig?: ColumnConfig[];
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 10,
  columns = 8,
  showAvatar = true,
  showActions = true,
  columnConfig
}) => {
  // Default column configuration that matches EmployeeTable
  const defaultColumnConfig: ColumnConfig[] = [
    { key: 'checkbox', label: 'Select', visible: false },
    { key: 'sNo', label: 'S.No', visible: true },
    { key: 'employeeId', label: 'EMP ID', visible: true },
    { key: 'name', label: 'Employee Name', visible: true },
    { key: 'department', label: 'Department', visible: true },
    { key: 'designation', label: 'Designation', visible: true },
    { key: 'projects', label: 'Projects & Allocation', visible: true },
    { key: 'modeOfManagement', label: 'Mode of Management', visible: true },
    { key: 'billabilityStatus', label: 'Billability Status', visible: true },
    { key: 'lastActiveDate', label: 'Last Active Date', visible: true, responsive: 'hidden lg:table-cell' },
    { key: 'experienceBand', label: 'Experience Band', visible: true },
    { key: 'ageing', label: 'Ageing', visible: true },
    { key: 'ctc', label: 'CTC', visible: true, responsive: 'hidden lg:table-cell' },
    { key: 'benchDays', label: 'Bench Days', visible: true },
    { key: 'phoneNumber', label: 'Phone Number', visible: true, responsive: 'hidden xl:table-cell' },
    { key: 'emergencyContact', label: 'Emergency Number', visible: true, responsive: 'hidden xl:table-cell' },
    { key: 'remarks', label: 'Remarks', visible: true, responsive: 'hidden xl:table-cell' },
    { key: 'lastModifiedBy', label: 'Last Modified By', visible: true, responsive: 'hidden xl:table-cell' },
    { key: 'actions', label: 'Actions', visible: true }
  ];

  const config = columnConfig || defaultColumnConfig;

  const getColumnClassName = (column: ColumnConfig) => {
    if (!column.visible) return 'hidden';
    return column.responsive || '';
  };

  const renderSkeletonCell = (columnKey: string) => {
    switch (columnKey) {
      case 'checkbox':
        return (
          <div className="flex items-center">
            <div className="h-4 w-4 bg-gray-200 rounded border border-gray-300"></div>
          </div>
        );
      case 'sNo':
        return <div className="h-3 w-8 bg-gray-200 rounded"></div>;
      case 'employeeId':
        return <div className="h-3 w-16 bg-gray-200 rounded"></div>;
      case 'name':
        return (
          <div className="flex items-center">
            {showAvatar && (
              <div className="flex-shrink-0 h-9 w-9">
                <div className="h-9 w-9 rounded-full bg-gray-200"></div>
              </div>
            )}
            <div className="ml-3 min-w-0 flex-1">
              <div className="h-3 w-24 bg-gray-200 rounded mb-1"></div>
              <div className="h-2 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        );
      case 'department':
        return <div className="h-3 w-20 bg-gray-200 rounded"></div>;
      case 'designation':
        return <div className="h-3 w-24 bg-gray-200 rounded"></div>;
      case 'modeOfManagement':
        return <div className="h-3 w-20 bg-gray-200 rounded"></div>;
      case 'billabilityStatus':
        return <div className="h-5 w-16 bg-gray-200 rounded-full"></div>;
      case 'lastActiveDate':
        return <div className="h-3 w-16 bg-gray-200 rounded"></div>;
      case 'experienceBand':
        return <div className="h-3 w-12 bg-gray-200 rounded"></div>;
      case 'ageing':
        return <div className="h-5 w-8 bg-gray-200 rounded-full"></div>;
      case 'ctc':
        return <div className="h-3 w-10 bg-gray-200 rounded"></div>;
      case 'benchDays':
        return <div className="h-5 w-8 bg-gray-200 rounded-full"></div>;
      case 'phoneNumber':
        return <div className="h-3 w-20 bg-gray-200 rounded"></div>;
      case 'emergencyContact':
        return <div className="h-3 w-20 bg-gray-200 rounded"></div>;
      case 'remarks':
        return (
          <div className="max-w-xs">
            <div className="h-3 w-24 bg-gray-200 rounded"></div>
          </div>
        );
      case 'lastModifiedBy':
        return <div className="h-3 w-16 bg-gray-200 rounded"></div>;
      case 'projects':
        return (
          <div className="min-w-[280px]">
            <div className="rounded-lg border border-slate-200 p-3 bg-gray-50 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-5 w-16 bg-gray-200 rounded-md"></div>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="h-3 w-20 bg-gray-200 rounded"></div>
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        );
      case 'actions':
        return showActions ? (
          <div className="flex space-x-1">
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
          </div>
        ) : null;
      default:
        return <div className="h-3 w-16 bg-gray-200 rounded"></div>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-0">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {config.map((column) => (
              <th 
                key={column.key}
                className={`px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide ${getColumnClassName(column)} ${
                  column.key !== 'actions' && column.key !== 'checkbox' ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
                }`}
              >
                {column.key === 'checkbox' ? (
                  <div className="h-4 w-4 bg-gray-200 rounded border border-gray-300"></div>
                ) : (
                  <span className="whitespace-nowrap">{column.label}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="animate-pulse hover:bg-gray-50 transition-colors">
              {config.map((column) => (
                <td 
                  key={column.key}
                  className={`px-3 py-2.5 text-sm text-gray-900 ${getColumnClassName(column)} ${
                    column.key === 'name' || column.key === 'projects' ? '' : 'whitespace-nowrap'
                  } ${column.key === 'actions' ? 'font-medium' : ''}`}
                >
                  {renderSkeletonCell(column.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SkeletonTable;