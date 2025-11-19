import React, { useState } from 'react';
import { Download, Mail, Calendar, FileText, Users, TrendingUp } from 'lucide-react';
import { Employee } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface ReportsPageProps {
  employees: Employee[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ employees }) => {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState('employee-summary');
  const [dateRange, setDateRange] = useState('current-month');

  const reports = [
    {
      id: 'employee-summary',
      title: 'Employee Summary Report',
      description: 'Complete overview of all employees with key metrics',
      icon: Users,
      roles: ['Admin', 'Lead', 'HR']
    },
    {
      id: 'bench-analysis',
      title: 'Bench Analysis Report',
      description: 'Detailed analysis of bench resources and ageing',
      icon: TrendingUp,
      roles: ['Admin', 'Lead', 'HR']
    },
    {
      id: 'financial-report',
      title: 'Financial Report',
      description: 'Cost analysis and revenue potential',
      icon: FileText,
      roles: ['Admin', 'Lead']
    },
    {
      id: 'utilization-report',
      title: 'Utilization Report',
      description: 'Resource utilization and billability analysis',
      icon: Calendar,
      roles: ['Admin', 'Lead', 'HR']
    }
  ];

  const availableReports = reports.filter(report => 
    report.roles.includes(user!.role)
  );

  const generateReport = (format: 'pdf' | 'excel') => {
    // Mock report generation
    const reportData = employees.map(emp => ({
      'Employee ID': emp.employeeId,
      'Name': emp.name,
      'Department': emp.department,
      'Position': emp.position,
      'Status': emp.billabilityStatus,
      'Bench Days': emp.benchDays,
      'CTC': emp.ctc,
      'Manager': emp.manager
    }));

    if (format === 'excel') {
      const headers = Object.keys(reportData[0]);
      const excelData = reportData.map(row => Object.values(row).join(','));
      const excelContent = [headers.join(','), ...excelData].join('\n');
      
      const blob = new Blob([excelContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}-${dateRange}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Mock PDF generation
      console.log('PDF report would be generated in a real application');
    }
  };

  const scheduleEmailReport = () => {
    console.log('Email report scheduled successfully! You will receive it according to your role permissions.');
  };

  const getReportPreview = () => {
    const totalEmployees = employees.length;
    const billableCount = employees.filter(emp => emp.billabilityStatus === 'Billable').length;
    const benchCount = employees.filter(emp => emp.billabilityStatus === 'Bench').length;
    const avgBenchDays = benchCount > 0 ? 
      employees.filter(emp => emp.billabilityStatus === 'Bench')
        .reduce((sum, emp) => sum + emp.benchDays, 0) / benchCount : 0;
    
    // Calculate Support Function employees
    const supportFunctionCount = employees.filter(emp => 
      emp.modeOfManagement && emp.modeOfManagement.toLowerCase().includes('support')
    ).length;

    // Calculate percentages for all three categories
    const billablePercentage = totalEmployees > 0 ? 
      ((billableCount / totalEmployees) * 100).toFixed(1) : '0.0';
    const benchPercentage = totalEmployees > 0 ? 
      ((benchCount / totalEmployees) * 100).toFixed(1) : '0.0';
    const supportFunctionPercentage = totalEmployees > 0 ? 
      ((supportFunctionCount / totalEmployees) * 100).toFixed(1) : '0.0';

    return {
      totalEmployees,
      billableCount,
      benchCount,
      supportFunctionCount,
      billablePercentage,
      benchPercentage,
      supportFunctionPercentage,
      billabilityRate: ((billableCount / totalEmployees) * 100).toFixed(1),
      avgBenchDays: Math.round(avgBenchDays)
    };
  };

  const preview = getReportPreview();

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Report Center</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Report Type
              </label>
              <div className="space-y-2">
                {availableReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedReport === report.id
                        ? 'border-slate-400 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <report.icon className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-gray-900">{report.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              >
                <option value="current-month">Current Month</option>
                <option value="last-month">Last Month</option>
                <option value="current-quarter">Current Quarter</option>
                <option value="last-quarter">Last Quarter</option>
                <option value="current-year">Current Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{preview.totalEmployees}</div>
                  <div className="text-sm text-gray-600">Total Employees</div>
                </div>
                
                {/* Billable with count and percentage */}
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{preview.billableCount}</div>
                  <div className="text-sm text-gray-600">Billable</div>
                  <div className="text-xs text-green-700 mt-1 font-medium">
                    {preview.billablePercentage}% of total
                  </div>
                </div>
                
                {/* Bench with count and percentage */}
                <div className="bg-white p-4 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">{preview.benchCount}</div>
                  <div className="text-sm text-gray-600">On Bench</div>
                  <div className="text-xs text-yellow-700 mt-1 font-medium">
                    {preview.benchPercentage}% of total
                  </div>
                </div>
                
                {/* Support Function with count and percentage */}
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{preview.supportFunctionCount}</div>
                  <div className="text-sm text-gray-600">Support Function</div>
                  <div className="text-xs text-purple-700 mt-1 font-medium">
                    {preview.supportFunctionPercentage}% of total
                  </div>
                </div>
              </div>

              {/* Additional metrics row */}
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{preview.billabilityRate}%</div>
                  <div className="text-sm text-gray-600">Billability Rate</div>
                </div>
                
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => generateReport('excel')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-lg hover:from-emerald-500 hover:to-teal-500"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Excel</span>
                </button>
                
                <button
                  onClick={() => generateReport('pdf')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded-lg hover:from-rose-500 hover:to-pink-500"
                >
                  <Download className="h-4 w-4" />
                  <span>Export PDF</span>
                </button>
                
                <button
                  onClick={scheduleEmailReport}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-slate-400 to-blue-400 text-white rounded-lg hover:from-slate-500 hover:to-blue-500"
                >
                  <Mail className="h-4 w-4" />
                  <span>Schedule Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Report Schedule</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium text-gray-900">Weekly Reports</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">For Team Leads</p>
            <p className="text-xs text-gray-500">Every Monday at 9:00 AM</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-gray-900">Monthly Reports</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">For HR Team</p>
            <p className="text-xs text-gray-500">First day of every month</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="font-medium text-gray-900">Quarterly Reports</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">For Admin</p>
            <p className="text-xs text-gray-500">First day of every quarter</p>
          </div>
        </div>
      </div>
    </div>
  );
};