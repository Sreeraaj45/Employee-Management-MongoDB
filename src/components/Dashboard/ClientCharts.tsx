import { Building2, TrendingUp } from 'lucide-react';
import { DashboardMetrics } from '../../types';
import { useEffect, useRef, useState } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

interface ClientDistributionChartProps {
  metrics: DashboardMetrics;
}

export const ClientDistributionChart = ({ metrics }: ClientDistributionChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [loading] = useState(false);

  // Use the metrics prop directly - no need to fetch again
  const clientData = Object.entries(metrics.clientDistribution || {})
    .map(([client, count]) => ({
      country: client,
      value: count,
      percentage: (count / metrics.totalEmployees) * 100,
    }))
    .sort((a, b) => b.value - a.value);

  // Debug logging
  console.log('ClientChart - metrics:', metrics);
  console.log('ClientChart - clientDistribution:', metrics.clientDistribution);
  console.log('ClientChart - clientData:', clientData);

  useEffect(() => {
    if (!chartRef.current || clientData.length === 0 || loading) return;

    // Create root element
    let root = am5.Root.new(chartRef.current);

    // Set themes
    root.setThemes([
      am5themes_Animated.new(root)
    ]);

    // Create chart
    let chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: true,
      panY: true,
      wheelX: "panX",
      wheelY: "zoomX",
      pinchZoomX: true,
      paddingLeft: 0,
      paddingRight: 1
    }));
    
    root._logo?.dispose()
    // Add cursor
    let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);

    // Create axes
    let xRenderer = am5xy.AxisRendererX.new(root, { 
      minGridDistance: 30, 
      minorGridEnabled: true
    });

    xRenderer.labels.template.setAll({
      rotation: 40,
      centerY: am5.p10,
      centerX: am5.p0,
      paddingRight: 15,
      fontSize: 12,
      fontWeight: "500"
    });

    xRenderer.grid.template.setAll({
      location: 1
    });

    let xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      maxDeviation: 0.3,
      categoryField: "country",
      renderer: xRenderer,
      tooltip: am5.Tooltip.new(root, {})
    }));

    let yRenderer = am5xy.AxisRendererY.new(root, {
      strokeOpacity: 0.1
    });

    let yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      maxDeviation: 0.3,
      renderer: yRenderer,
    }));

    // Create series
    let series = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: "Clients",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      sequencedInterpolation: true,
      categoryXField: "country",
      tooltip: am5.Tooltip.new(root, {
        labelText: "{valueY} employees"
      })
    }));

    series.columns.template.setAll({ 
      cornerRadiusTL: 5, 
      cornerRadiusTR: 5, 
      strokeOpacity: 0,
      width: am5.percent(70)
    });

    series.columns.template.adapters.add("fill", function (fill, target) {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    series.columns.template.adapters.add("stroke", function (stroke, target) {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    // Set data
    xAxis.data.setAll(clientData);
    series.data.setAll(clientData);

    // Make stuff animate on load
    series.appear(1000);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [clientData, loading]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gray-300 p-2 rounded-xl w-9 h-9"></div>
                <div>
                  <div className="h-6 bg-gray-300 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-8 bg-gray-300 rounded w-16 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (clientData.length === 0) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-xl">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Client Distribution</h3>
                <p className="text-sm text-gray-500 mt-1">Employee count across clients</p>
              </div>
            </div>
          </div>
          <div className="text-center py-12 text-gray-500">
            No client data available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-xl">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Client Distribution
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Employee count across clients
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {clientData.length.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Clients</div>
          </div>
        </div>

        {/* amCharts Container */}
        <div 
          ref={chartRef} 
          className="w-full h-96 mt-4"
          style={{ minHeight: '400px' }}
        />

        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>
                  <span className="font-semibold text-gray-900">
                    {clientData.length}
                  </span>{' '}
                  clients
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-green-500 to-emerald-500" />
                <span>
                  Largest:{' '}
                  <span className="font-semibold text-gray-900">
                    {clientData[0]?.country}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span>
                Range:{' '}
                <span className="font-semibold text-gray-900">
                  {clientData[
                    clientData.length - 1
                  ]?.value.toLocaleString()}{' '}
                  - {clientData[0]?.value.toLocaleString()}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};