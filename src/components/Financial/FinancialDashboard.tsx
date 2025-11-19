import { DollarSign, TrendingUp, Users, PieChart, Briefcase, CreditCard, AlertCircle, Target } from 'lucide-react';
import { Employee } from '../../types';
import { useLayoutEffect, useRef } from "react";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { ClientCostAnalysis } from './ClientCostAnalysis';
import { ProjectCostAnalysis } from './ProjectCostAnalysis';
import { ClientProjectCostAnalysis } from './ClientProjectCostAnalysis';

// Initialize theme
am4core.useTheme(am4themes_animated);

interface FinancialDashboardProps {
  employees: Employee[];
}

export const FinancialDashboard = ({ employees }: FinancialDashboardProps) => {
  const converter = {
    convert: (amount: number, from: string, to: string) => amount,
    format: (amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`
  };

  if (!employees) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const calculateFinancialMetrics = () => {
    if (!employees || employees.length === 0) {
      return {
        totalSalaryBudget: 0,
        benchCost: 0,
        supportCost: 0,
        billableCost: 0,
        avgCTCByDepartment: {},
        utilizationRate: 0,
        costDistribution: { billable: 0, bench: 0, support: 0 },
        employeeCounts: { total: 0, billable: 0, bench: 0, support: 0 }
      };
    }

    const totalSalaryBudget = employees.reduce((sum, emp) => {
      const ctcAmount = emp.ctc || 0;
      const ctcCurrency = emp.ctcCurrency || 'INR';
      return sum + converter.convert(ctcAmount, ctcCurrency, 'INR');
    }, 0);

    const supportEmployees = employees.filter(emp => 
      emp.modeOfManagement && emp.modeOfManagement.toLowerCase().includes('support')
    );

    const billableEmployees = employees.filter(emp => 
      emp.billabilityStatus === 'Billable' && 
      !(emp.modeOfManagement && emp.modeOfManagement.toLowerCase().includes('support'))
    );

    const benchEmployees = employees.filter(emp => 
      emp.billabilityStatus === 'Bench' && 
      !(emp.modeOfManagement && emp.modeOfManagement.toLowerCase().includes('support'))
    );

    const supportCost = supportEmployees.reduce((sum, emp) => {
      const ctcAmount = emp.ctc || 0;
      const ctcCurrency = emp.ctcCurrency || 'INR';
      return sum + converter.convert(ctcAmount, ctcCurrency, 'INR');
    }, 0);

    const billableCost = billableEmployees.reduce((sum, emp) => {
      const ctcAmount = emp.ctc || 0;
      const ctcCurrency = emp.ctcCurrency || 'INR';
      return sum + converter.convert(ctcAmount, ctcCurrency, 'INR');
    }, 0);

    const benchCost = benchEmployees.reduce((sum, emp) => {
      const ctcAmount = emp.ctc || 0;
      const ctcCurrency = emp.ctcCurrency || 'INR';
      return sum + converter.convert(ctcAmount, ctcCurrency, 'INR');
    }, 0);

    const totalCTCByDepartment = {} as { [key: string]: number };
    const departments = [...new Set(employees.map(emp => emp.department))];
    departments.forEach(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept);
      if (deptEmployees.length > 0) {
        const totalDeptCTC = deptEmployees.reduce((sum, emp) => {
          const ctcAmount = emp.ctc || 0;
          const ctcCurrency = emp.ctcCurrency || 'INR';
          return sum + converter.convert(ctcAmount, ctcCurrency, 'INR');
        }, 0);
        totalCTCByDepartment[dept] = totalDeptCTC;
      }
    });

    const costDistribution = {
      billable: totalSalaryBudget > 0 ? (billableCost / totalSalaryBudget) * 100 : 0,
      bench: totalSalaryBudget > 0 ? (benchCost / totalSalaryBudget) * 100 : 0,
      support: totalSalaryBudget > 0 ? (supportCost / totalSalaryBudget) * 100 : 0
    };

    const productiveEmployees = billableEmployees.length;
    const totalNonSupportEmployees = employees.length - supportEmployees.length;
    const utilizationRate = totalNonSupportEmployees > 0 ? 
      (productiveEmployees / totalNonSupportEmployees) * 100 : 0;

    return {
      totalSalaryBudget,
      benchCost,
      supportCost,
      billableCost,
      totalCTCByDepartment,
      utilizationRate,
      costDistribution,
      employeeCounts: {
        total: employees.length,
        billable: billableEmployees.length,
        bench: benchEmployees.length,
        support: supportEmployees.length
      }
    };
  };

  const metrics = calculateFinancialMetrics();
  const formatINR = (amount: number) => `₹${(amount / 100000).toFixed(1)}L`;

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-lg transition-all duration-300">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <DollarSign className="h-6 w-6 text-blue-400" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">No Financial Data</h3>
        <p className="text-sm text-gray-600">Add employees to view analytics</p>
      </div>
    );
  }

  // Premium KPI Cards
  const kpiCards = [
    {
      title: 'Total Budget',
      value: formatINR(metrics.totalSalaryBudget),
      icon: CreditCard,
      description: 'Annual salary budget',
      bgColor: 'bg-gradient-to-br from-blue-500 to-cyan-500'
    },
    {
      title: 'Billable Cost',
      value: formatINR(metrics.billableCost),
      icon: TrendingUp,
      description: 'Revenue generating resources',
      bgColor: 'bg-gradient-to-br from-emerald-500 to-teal-500'
    },
    {
      title: 'Support Functions',
      value: formatINR(metrics.supportCost),
      icon: Users,
      description: 'Internal support functions',
      bgColor: 'bg-gradient-to-br from-purple-500 to-indigo-500'
    },
    {
      title: 'Bench Cost',
      value: formatINR(metrics.benchCost),
      icon: AlertCircle,
      description: 'Non-billable resources',
      bgColor: 'bg-gradient-to-br from-amber-500 to-orange-500'
    }
  ];

  // Compact Employee Stats Card
  const EmployeeStats = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-xl transition-all duration-300 w-full max-w-m mx-auto">
      {/* Header - Enhanced */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-lg">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Employee Statistics</h3>
            <p className="text-xs text-gray-500 font-medium">Resource allocation overview</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900 bg-gradient-to-br from-blue-50 to-cyan-50 px-3 py-1.5 rounded-lg border border-blue-100">
           <span text-md>Total: </span> {metrics.employeeCounts.total}
          </div>
        </div>
      </div>

      {/* Distribution Grid - Enhanced */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { 
            label: 'Billable', 
            count: metrics.employeeCounts.billable, 
            percentage: ((metrics.employeeCounts.billable / metrics.employeeCounts.total) * 100).toFixed(1),
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
            borderColor: 'border-emerald-200',
            textColor: 'text-emerald-700'
          },
          { 
            label: 'Support', 
            count: metrics.employeeCounts.support, 
            percentage: ((metrics.employeeCounts.support / metrics.employeeCounts.total) * 100).toFixed(1),
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
            borderColor: 'border-purple-200',
            textColor: 'text-purple-700'
          },
          { 
            label: 'Bench', 
            count: metrics.employeeCounts.bench, 
            percentage: ((metrics.employeeCounts.bench / metrics.employeeCounts.total) * 100).toFixed(1),
            color: 'from-amber-500 to-amber-600',
            bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100',
            borderColor: 'border-amber-200',
            textColor: 'text-amber-700'
          }
        ].map((stat, index) => (
          <div 
            key={index} 
            className={`text-center p-3 rounded-xl border-1 ${stat.borderColor} ${stat.bgColor} hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group`}
          >
            <div className={`text-lg font-bold ${stat.textColor} mb-1 group-hover:scale-110 transition-transform duration-300`}>
              {stat.count}
            </div>
            <div className="text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">{stat.label}</div>
            <div className="text-xs font-medium text-gray-600 bg-white/80 px-2 py-1 rounded-full border border-gray-200">
              {stat.percentage}%
            </div>
          </div>
        ))}
      </div>

      {/* Utilization Section - Enhanced */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3.5 border-2 border-green-100 hover:border-green-200 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-1.5 rounded-lg shadow-sm">
              <Target className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900 tracking-tight">Utilization Rate</span>
          </div>
          <span className="text-sm font-bold bg-gradient-to-br from-green-500 to-emerald-500 text-white px-2.5 py-1 rounded-full shadow-sm">
            {metrics.utilizationRate.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-white rounded-full h-2.5 border border-green-200 shadow-inner">
          <div
            className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full transition-all duration-1000 shadow-md"
            style={{ width: `${metrics.utilizationRate}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2 font-medium">
          <span>Productive Resources</span>
          <span>{metrics.employeeCounts.billable} / {metrics.employeeCounts.total - metrics.employeeCounts.support}</span>
        </div>
      </div>
    </div>
  );
  // Pie Chart Cost Distribution Card with amCharts 3D
  const CostDistribution = () => {
    const distributionData = [
      { 
        label: 'Billable', 
        value: metrics.billableCost, 
        percentage: metrics.costDistribution.billable, 
        color: '#10b981', // emerald
        icon: TrendingUp
      },
      { 
        label: 'Support', 
        value: metrics.supportCost, 
        percentage: metrics.costDistribution.support, 
        color: '#a855f7', // purple
        icon: Users
      },
      { 
        label: 'Bench', 
        value: metrics.benchCost, 
        percentage: metrics.costDistribution.bench, 
        color: '#f59e0b', // amber
        icon: AlertCircle
      }
    ];

    const chartRef = useRef<am4charts.PieChart3D | null>(null);

    useLayoutEffect(() => {
      // Create chart instance
      const chart = am4core.create("chartdiv", am4charts.PieChart3D);
      chartRef.current = chart;
      chart.logo.disabled = true;

      // Set initial opacity to 0 for fade-in effect
      chart.hiddenState.properties.opacity = 0;

      // Configure chart data
      chart.data = distributionData.map(item => ({
        category: item.label,
        value: item.percentage, // Use percentage for the pie slices
        amount: item.value, // Store original value for tooltips
        color: am4core.color(item.color)
      }));

      // Create series
      const series = chart.series.push(new am4charts.PieSeries3D());
      series.dataFields.value = "value";
      series.dataFields.category = "category";
      series.slices.template.propertyFields.fill = "color";
      
      // Disable labels and ticks
      series.labels.template.disabled = true;
      series.ticks.template.disabled = true;

      // Configure tooltips
      series.slices.template.tooltipText = "{category}: {value.percent.formatNumber('#.0')}%";
      
      // 3D effects
      chart.innerRadius = am4core.percent(40);
      chart.depth = 15;
      chart.angle = 10;

      // Cleanup function
      return () => {
        if (chartRef.current) {
          chartRef.current.dispose();
        }
      };
    }, [distributionData]);

    return (
      <div className="bg-white rounded-2xl border border-gray-200 px-5 py-3 hover:shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
              <PieChart className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Cost Distribution</h3>
              <p className="text-xs text-gray-500">Budget allocation breakdown</p>
            </div>
          </div>
        </div>

        {/* Pie Chart with Legend */}
        <div className="flex flex-col lg:flex-row items-center gap-7">
          {/* amCharts 3D Pie Chart */}
          <div id="chartdiv" className="w-full lg:w-[220px] h-[260px] flex-shrink-0" />

          {/* Custom Legend */}
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              {distributionData.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between group cursor-pointer p-3 rounded-xl border-gray-100 hover:border-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-300 hover:shadow-md"
                >
                  {/* Label on left */}
                  <div className="flex items-center gap-4 flex-1 min-w-0 mr-">
                    <div className="relative">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform duration-300 shadow-md border-2 border-white"
                        style={{ backgroundColor: item.color }}
                      />
                      <div 
                        className="absolute inset-0 w-4 h-4 rounded-full opacity-0 group-hover:opacity-40 group-hover:animate-ping transition-opacity duration-300"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-m font-semibold text-gray-900 truncate group-hover:text-gray-800 transition-colors block">
                        {item.label}
                      </span>
                      
                    </div>
                  </div>

                  {/* Amount on right */}
                  <div className="text-right flex-shrink-0 min-w-[80px]">
                    <div className="text-sm font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                      {formatINR(item.value)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Department Cost Analysis Component
  const DepartmentCostAnalysis = () => {
    const departmentCostData = Object.entries(metrics.totalCTCByDepartment)
      .map(([dept, totalCTC]) => ({
        department: dept,
        totalCTC,
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

    const maxCTC = Math.max(...departmentCostData.map(dept => dept.totalCTC));

    return (
      <div className="w-full">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-14">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-xl">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Department Cost Analysis
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Total CTC by department
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {departmentCostData.length}
              </div>
              <div className="text-sm text-gray-500">Departments</div>
            </div>
          </div>

          {/* Vertical Bar Chart */}
          <div className="flex items-end justify-between gap-1 h-74 py-4">
            {departmentCostData.map((dept, index) => {
              const barHeight = (dept.totalCTC / maxCTC) * 100;
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
                            {formatINR(dept.totalCTC)}
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
                      {departmentCostData.length}
                    </span>{' '}
                    departments
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gradient-to-r from-amber-500 to-orange-500" />
                  <span>
                    Highest:{' '}
                    <span className="font-semibold text-gray-900">
                      {departmentCostData[0]?.department}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span>
                  Range:{' '}
                  <span className="font-semibold text-gray-900">
                    {formatINR(departmentCostData[departmentCostData.length - 1]?.totalCTC || 0)} - {formatINR(departmentCostData[0]?.totalCTC || 0)}
                  </span>
                </span>
                <span>
                  Total:{' '}
                  <span className="font-semibold text-gray-900">
                    {formatINR(
                      departmentCostData.reduce((sum, dept) => sum + dept.totalCTC, 0)
                    )}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {departmentCostData.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Briefcase className="h-4 w-4 text-gray-400" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">No Department Data</h4>
              <p className="text-xs text-gray-600 max-w-sm mx-auto">
                Department cost analysis will appear here when employee data is available
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 p-1">
      {/* Premium KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((card, index) => (
          <div key={index} className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl ${card.bgColor}`}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900">{card.value}</h3>
              <p className="text-sm font-semibold text-gray-700">{card.title}</p>
              <p className="text-xs text-gray-500">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Employee Stats and Cost Distribution - Now same height */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-3/4">
          <EmployeeStats />
        </div>
        <div className="lg:w-2/4">
          <CostDistribution />
        </div>
      </div>

      {/* Department Cost Analysis */}
      <DepartmentCostAnalysis />

      {/* Client Cost Analysis */}
      {/* <ClientCostAnalysis employees={employees} /> */}

      {/* Project Cost Analysis */}
      {/* <ProjectCostAnalysis employees={employees} /> */}

      {/* Client-Project Relationship Analysis */}
      <ClientProjectCostAnalysis employees={employees} />
    </div>
  );
};