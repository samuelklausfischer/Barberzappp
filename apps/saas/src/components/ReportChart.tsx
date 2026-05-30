/**
 * Report Chart Component
 *
 * Componentes de visualização de dados para reports.
 * Suporta múltiplos tipos de gráficos usando Recharts.
 */

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';

// Types
export type ChartType = 
  | 'line'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'area'
  | 'stacked-bar'
  | 'horizontal-bar';

export interface ChartData {
  name: string;
  value?: number;
  [key: string]: any;
}

export interface ChartConfig {
  type: ChartType;
  data: ChartData[];
  dataKey: string;
  nameKey?: string;
  colorKeys?: string[];
  title?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  height?: number;
  colors?: string[];
}

// Color palettes
const COLOR_PALETTES = {
  default: [
    '#F59E0B', // Yellow-500
    '#3B82F6', // Blue-500
    '#10B981', // Emerald-500
    '#8B5CF6', // Purple-500
    '#EF4444', // Red-500
    '#EC4899', // Pink-500
    '#06B6D4', // Cyan-500
    '#F97316', // Orange-500
  ],
  revenue: [
    '#10B981', // Green for positive revenue
    '#F59E0B', 
    '#3B82F6',
    '#8B5CF6'
  ],
  status: [
    '#10B981', // Completed (green)
    '#F59E0B', // Scheduled (yellow)
    '#EF4444', // Cancelled (red)
    '#6B7280', // No-show (gray)
  ]
};

// Custom Tooltip
interface CustomTooltipProps extends TooltipProps<any, any> {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name: string) => [string, string];
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  formatter
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
      {label && (
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const [value, name] = formatter
            ? formatter(entry.value, entry.name)
            : [entry.value, entry.name];
          
          return (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{name}:</span>
              <span className="font-medium text-gray-900">
                {typeof value === 'number' && value > 1000
                  ? new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(value)
                  : value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Revenue over Time Chart (Line)
export const RevenueLineChart: React.FC<ChartConfig> = ({
  data,
  dataKey,
  title,
  height = 300,
  colors = COLOR_PALETTES.default
}) => {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => 
              new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              }).format(value)
            }
          />
          <Tooltip 
            content={<CustomTooltip />}
            formatter={(value: any, name: string) => [
              value,
              'Receita'
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={colors[0]}
            strokeWidth={2}
            dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Appointments Bar Chart
export const AppointmentsBarChart: React.FC<ChartConfig> = ({
  data,
  dataKey,
  title,
  height = 300,
  colors = COLOR_PALETTES.default
}) => {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey={dataKey} 
            fill={colors[0]}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Service Popularity Pie Chart
export const ServicePieChart: React.FC<ChartConfig & {
  innerRadius?: number;
}> = ({
  data,
  dataKey,
  nameKey = 'name',
  title,
  height = 300,
  innerRadius = 0,
  colors = COLOR_PALETTES.default
}) => {
  const chartData = data.filter(d => d[dataKey] > 0);
  
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={80}
            paddingAngle={2}
            label={({ name, percent }) => 
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
            labelStyle={{ fontSize: '12px', fill: '#6B7280' }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            content={<CustomTooltip />}
            formatter={(value: any, name: string) => [
              value,
              name
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Donut Chart
export const DonutChart: React.FC<ChartConfig> = ({
  data,
  dataKey,
  nameKey = 'name',
  title,
  height = 300,
  colors = COLOR_PALETTES.default
}) => {
  return (
    <ServicePieChart
      data={data}
      dataKey={dataKey}
      nameKey={nameKey}
      title={title}
      height={height}
      innerRadius={60}
      colors={colors}
    />
  );
};

// Employee Performance Horizontal Bar Chart
export const EmployeePerformanceChart: React.FC<ChartConfig & {
  metric?: 'revenue' | 'appointments';
}> = ({
  data,
  dataKey = 'completed_revenue',
  nameKey = 'employee_name',
  metric = 'revenue',
  title,
  height = 400,
  colors = COLOR_PALETTES.default
}) => {
  const sortedData = [...data]
    .sort((a, b) => b[dataKey] - a[dataKey])
    .slice(0, 10); // Top 10

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            type="number"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => 
              metric === 'revenue'
                ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0
                  }).format(value)
                : value
            }
          />
          <YAxis 
            type="category"
            dataKey={nameKey}
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey={dataKey} 
            fill={colors[0]}
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Stacked Bar Chart (e.g., for services by revenue)
export const StackedBarChart: React.FC<ChartConfig> = ({
  data,
  dataKey,
  colorKeys = ['completed_revenue', 'cancelled_revenue', 'no_show_revenue'],
  title,
  height = 300,
  colors = COLOR_PALETTES.default
}) => {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => 
              new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              }).format(value)
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {colorKeys.map((key, index) => (
            <Bar 
              key={key}
              dataKey={key} 
              stackId="a"
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Area Chart (for trends)
export const AreaChartComponent: React.FC<ChartConfig> = ({
  data,
  dataKey,
  title,
  height = 300,
  colors = COLOR_PALETTES.default
}) => {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <defs>
            <linearGradient id={`gradient${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[0]} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={colors[0]} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={colors[0]}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#gradient${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Heatmap for peak hours (Grid visualization)
export const HourlyHeatmap: React.FC<{
  data: any[];
  title?: string;
}> = ({
  data,
  title
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum dado disponível
      </div>
    );
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Find max value for color scaling
  const maxValue = Math.max(...data.map(d => d.appointment_count || 0));
  
  const getColor = (value: number): string => {
    const intensity = value / maxValue;
    if (intensity === 0) return '#F3F4F6'; // gray-100
    if (intensity < 0.25) return '#FEF3C7'; // yellow-100
    if (intensity < 0.5) return '#FDE68A'; // yellow-300
    if (intensity < 0.75) return '#F59E0B'; // yellow-500
    return '#D97706'; // yellow-600
  };

  const getCell = (day: number, hour: number) => {
    const cell = data.find(d => d.day_of_week === day && d.hour === hour);
    return cell || { appointment_count: 0 };
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex">
            {/* Day labels */}
            <div className="w-12 flex-shrink-0"></div>
            {hours.map(hour => (
              <div 
                key={hour} 
                className="w-8 flex-shrink-0 text-xs text-center text-gray-500 py-1"
              >
                {hour}
              </div>
            ))}
          </div>
          {days.map((day, dayIndex) => (
            <div key={day} className="flex items-center">
              <div className="w-12 flex-shrink-0 text-xs text-gray-600 font-medium">
                {day}
              </div>
              {hours.map(hour => {
                const cell = getCell(dayIndex, hour);
                return (
                  <div
                    key={`${day}-${hour}`}
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-xs font-medium rounded-sm"
                    style={{ 
                      backgroundColor: getColor(cell.appointment_count || 0),
                      color: cell.appointment_count > maxValue * 0.5 ? 'white' : '#374151'
                    }}
                    title={`${day} ${hour}:00 - ${cell.appointment_count} agendamentos`}
                  >
                    {cell.appointment_count || ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center mt-4 space-x-2 text-sm">
        <span className="text-gray-600">Menos ocupado</span>
        {[0, 0.25, 0.5, 0.75, 1].map(intensity => (
          <div
            key={intensity}
            className="w-8 h-4 rounded"
            style={{ backgroundColor: getColor(maxValue * intensity) }}
          />
        ))}
        <span className="text-gray-600">Mais ocupado</span>
      </div>
    </div>
  );
};

// Client Retention Funnel
export const RetentionFunnel: React.FC<{
  data: {
    stage: string;
    count: number;
    percentage: number;
  }[];
  title?: string;
}> = ({
  data,
  title
}) => {
  const maxCount = Math.max(...data.map(d => d.count));
  const colors = COLOR_PALETTES.status;

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div className="space-y-3">
        {data.map((stage, index) => (
          <div key={stage.stage}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{stage.stage}</span>
              <span className="text-gray-600">
                {stage.count} ({stage.percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full flex items-center justify-center text-xs font-medium text-white"
                style={{
                  width: `${(stage.count / maxCount) * 100}%`,
                  backgroundColor: colors[index % colors.length],
                  minWidth: stage.count > 0 ? '60px' : '0'
                }}
              >
                {stage.count > 0 && stage.count}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Default export - Chart component that selects based on type
export const ReportChart: React.FC<ChartConfig & {
  innerRadius?: number;
  metric?: 'revenue' | 'appointments';
}> = ({
  type,
  innerRadius,
  metric,
  ...props
}) => {
  const chartComponents = {
    line: RevenueLineChart,
    bar: AppointmentsBarChart,
    pie: ServicePieChart,
    donut: DonutChart,
    area: AreaChartComponent,
    'stacked-bar': StackedBarChart,
    'horizontal-bar': (p: any) => <EmployeePerformanceChart {...p} metric={metric} />
  };

  const ChartComponent = chartComponents[type] || RevenueLineChart;
  
  if (type === 'pie' || type === 'donut') {
    return <ChartComponent {...props} innerRadius={innerRadius || 0} />;
  }
  
  if (type === 'horizontal-bar') {
    return <ChartComponent {...props} metric={metric} />;
  }
  
  return <ChartComponent {...props} />;
};

export default ReportChart;
