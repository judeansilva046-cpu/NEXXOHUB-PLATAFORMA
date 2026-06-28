'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type TrendPoint = { label: string; value: number };
export type DonutItem = { label: string; value: number; color: string };

export function TrendChart({
  data,
  color = '#6d43f5',
  height = 220,
}: {
  data: TrendPoint[];
  color?: string;
  height?: number;
}) {
  const gradientId = `trend-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 18, right: 12, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e8edf5" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#52617a' }}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52617a' }} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
  centerValue,
  centerLabel,
  height = 220,
}: {
  data: DonutItem[];
  centerValue: string | number;
  centerLabel: string;
  height?: number;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid items-center gap-4 sm:grid-cols-[minmax(145px,0.9fr)_minmax(150px,1fr)]">
      <div className="relative w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.length ? data : [{ label: 'Sem dados', value: 1, color: '#e2e8f0' }]}
              dataKey="value"
              nameKey="label"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={1}
              stroke="none"
            >
              {(data.length ? data : [{ color: '#e2e8f0' }]).map((item, index) => (
                <Cell key={index} fill={item.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <strong className="text-2xl font-bold text-[#071737]">{centerValue}</strong>
          <span className="mt-1 text-[11px] text-slate-600">{centerLabel}</span>
        </div>
      </div>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-[11px]">
            <span className="flex min-w-0 items-center gap-2 text-[#142343]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 font-medium text-[#142343]">
              {item.value} {total > 0 ? `(${Math.round((item.value / total) * 100)}%)` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
