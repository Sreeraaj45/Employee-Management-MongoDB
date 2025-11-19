import { Building2, TrendingUp } from 'lucide-react';
import { Employee } from '../../types';

interface ClientProjectCostAnalysisProps {
  employees: Employee[];
}

export const ClientProjectCostAnalysis = ({ employees }: ClientProjectCostAnalysisProps) => {
  const formatINR = (amount: number) => `₹${(amount / 100000).toFixed(1)}L`;

  // Compute client + project costs (ensure numeric coercion)
  const clientProjectData = employees.reduce((acc, emp) => {
    const client = emp.client || 'Unassigned';
    const ctc = Number(emp.ctc) || 0; // <-- coerce to number, default 0

    if (!acc[client]) {
      acc[client] = { totalCTC: 0, projects: {} as { [key: string]: number } };
    }
    acc[client].totalCTC += ctc;

    if (Array.isArray(emp.employeeProjects) && emp.employeeProjects.length > 0) {
      const shareCount = emp.employeeProjects.length || 1;
      emp.employeeProjects.forEach((proj: any) => {
        const projectName = proj.projectName || 'Unassigned';
        acc[client].projects[projectName] = (acc[client].projects[projectName] || 0) + (ctc / shareCount);
      });
    } else {
      acc[client].projects['Unassigned'] = (acc[client].projects['Unassigned'] || 0) + ctc;
    }

    return acc;
  }, {} as { [key: string]: { totalCTC: number; projects: { [key: string]: number } } });

  const clientData = Object.entries(clientProjectData)
    .map(([client, data]) => ({ client, totalCTC: data.totalCTC, projects: data.projects }))
    .sort((a, b) => b.totalCTC - a.totalCTC);

  const colorPalette = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-indigo-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-green-500 to-lime-500',
    'from-violet-500 to-purple-500',
    'from-red-500 to-orange-500'
  ];

  // Build a numeric list of costs (guarding against bad values)
  const allCosts: number[] = [];
  clientData.forEach(client => {
    const t = Number(client.totalCTC) || 0;
    allCosts.push(t);
    Object.values(client.projects).forEach(v => {
      const n = Number(v) || 0;
      allCosts.push(n);
    });
  });

  // Compute max safely; fallback to 1 to avoid division-by-zero
  let maxCTC = allCosts.length > 0 ? Math.max(...allCosts) : 0;
  if (!isFinite(maxCTC) || maxCTC <= 0) maxCTC = 1;

  // Rendering constants
  const MAX_BAR_HEIGHT = 240; // px maximum cap
  const MIN_VISIBLE_HEIGHT = 18; // px for small non-zero values
  const ZERO_BAR_HEIGHT = 4; // px visual mark for exact zero

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2 rounded-xl">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Client & Project Cost Analysis</h3>
              <p className="text-sm text-gray-500 mt-1">Clustered view showing client totals and project breakdown</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{clientData.length}</div>
            <div className="text-sm text-gray-500">Clients</div>
          </div>
        </div>

        {/* Clustered Bars */}
        <div className="overflow-x-auto overflow-y-hidden">
          <div className="flex items-end justify-start gap-4 py-2 min-w-max">
            {clientData.map(client => {
              const projectEntries = Object.entries(client.projects);
              const barsInCluster = 1 + projectEntries.length; // total + projects

              return (
                <div
                  key={client.client}
                  className="flex flex-col items-center flex-shrink-0"
                  style={{ minWidth: `${barsInCluster * 60}px` }}
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-end justify-center gap-1 h-[280px] mb-1 relative overflow-visible">
                      {/* Total (client total) */}
                      {(() => {
                        const totalVal = Number(client.totalCTC) || 0;
                        const scaled = (totalVal / maxCTC) * MAX_BAR_HEIGHT;
                        // if totalVal === 0, render a tiny bar; if >0 but tiny, ensure MIN_VISIBLE_HEIGHT
                        const heightPx = totalVal === 0 ? ZERO_BAR_HEIGHT : Math.max(MIN_VISIBLE_HEIGHT, Math.min(scaled, MAX_BAR_HEIGHT));

                        return (
                          <div className="flex flex-col items-center group cursor-pointer transition-all duration-300">
                            <div className="relative w-12 flex flex-col items-center justify-end" style={{ height: `${MAX_BAR_HEIGHT}px` }}>
                              <div className="absolute inset-0 bg-gray-100 rounded-t" />
                              <div
                                className="w-full rounded-t bg-gradient-to-t from-orange-500 to-yellow-400 transition-all duration-1000 ease-out relative min-h-2"
                                style={{ height: `${heightPx}px` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[11px] font-bold z-10">
                                  <div className="bg-white/95 px-2 py-1 rounded border border-gray-100 shadow-lg whitespace-nowrap">
                                    {formatINR(totalVal)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Projects */}
                      {projectEntries.map(([projectName, projectCost], projIndex) => {
                        const colorClass = colorPalette[projIndex % colorPalette.length];
                        const val = Number(projectCost) || 0;
                        const scaled = (val / maxCTC) * MAX_BAR_HEIGHT;

                        // If the value is exactly zero, show a tiny visual bar (ZERO_BAR_HEIGHT)
                        // If > 0 but very small, use the MIN_VISIBLE_HEIGHT so it's visible but not large.
                        const heightPx = val === 0 ? ZERO_BAR_HEIGHT : Math.max(MIN_VISIBLE_HEIGHT, Math.min(scaled, MAX_BAR_HEIGHT));

                        return (
                          <div key={projectName} className="flex flex-col items-center group cursor-pointer transition-all duration-300">
                            <div className="relative w-12 flex flex-col items-center justify-end" style={{ height: `${MAX_BAR_HEIGHT}px` }}>
                              <div className="absolute inset-0 bg-gray-100 rounded-t" />
                              <div
                                className={`w-full rounded-t bg-gradient-to-t ${colorClass} transition-all duration-1000 ease-out relative min-h-2`}
                                style={{ height: `${heightPx}px` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[11px] font-bold z-10">
                                  <div className="bg-white/95 px-2 py-1 rounded border border-gray-100 shadow-lg whitespace-nowrap">
                                    {formatINR(val)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bar Labels - below bars */}
                    <div className="flex items-start justify-center gap-2 mt-1 min-h-[42px]">
                      <div className="w-12 flex flex-col items-center px-0.5">
                        <span className="text-[10px] font-bold text-orange-600 text-center leading-tight break-words max-w-[56px]" title="Total">Total</span>
                      </div>
                      {projectEntries.map(([projectName], projIndex) => (
                        <div key={`label-${projIndex}`} className="w-12 flex flex-col items-center px-0.5">
                          <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight break-words max-w-[56px] line-clamp-2" title={projectName}>
                            {projectName.length > 18 ? `${projectName.slice(0, 16)}…` : projectName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Client Label */}
                  <div className="text-center w-full min-h-[2.5rem] flex items-start justify-center px-0.5 mt-1">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                      <span className="text-[10px] font-semibold text-gray-900 leading-tight break-words max-w-[120px] text-center">
                        {client.client}
                      </span>

                      {/* 🟩 Fix: exclude “Unassigned” from project count */}
                      {(() => {
                        const realProjectCount = Object.keys(client.projects).filter(
                          name => name.toLowerCase() !== 'unassigned'
                        ).length;
                        return (
                          <span className="text-[9px] text-gray-500">
                            ({realProjectCount} {realProjectCount === 1 ? 'project' : 'projects'})
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span><span className="font-semibold text-gray-900">{clientData.length}</span> clients</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-cyan-500" />
                <span>Highest: <span className="font-semibold text-gray-900">{clientData[0]?.client}</span></span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span>Range: <span className="font-semibold text-gray-900">{formatINR(clientData[clientData.length - 1]?.totalCTC || 0)} - {formatINR(clientData[0]?.totalCTC || 0)}</span></span>
              <span>Total: <span className="font-semibold text-gray-900">{formatINR(clientData.reduce((sum, c) => sum + c.totalCTC, 0))}</span></span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {clientData.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Building2 className="h-4 w-4 text-gray-400" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">No Client Data</h4>
            <p className="text-xs text-gray-600 max-w-sm mx-auto">Client and project cost analysis will appear here when employee data is available</p>
          </div>
        )}
      </div>
    </div>
  );
};
