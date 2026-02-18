import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { useSprint } from '../context/SprintContext';
import ChartCard from './ChartCard';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white shadow-lg rounded-lg border border-slate-200 p-3 text-sm">
      <p className="font-semibold text-slate-800">{d.fullName}</p>
      {d.spent > 0 && (
        <p className="text-slate-600">
          Spent: <span className="font-medium text-emerald-600">{Math.round(d.spent * 10) / 10}h</span>
        </p>
      )}
      <p className="text-slate-600">
        Remaining: <span className="font-medium text-indigo-600">{Math.round(d.remainingEst * 10) / 10}h</span>
      </p>
      <p className="text-slate-600">
        Total: <span className="font-medium">{Math.round(d.assigned * 10) / 10}h</span>
        {' / '}
        <span className="font-medium">{d.capacity}h capacity</span>
      </p>
      <p
        className={`font-medium ${d.loadPercent > 100 ? 'text-red-600' : 'text-emerald-600'}`}
      >
        {d.loadPercent}% utilized
      </p>
    </div>
  );
}

export default function TeamLoadChart() {
  const { devLoads } = useSprint();

  if (devLoads.length === 0) {
    return (
      <ChartCard
        title="Team Load Balance"
        subtitle="Side-by-side comparison of utilization across developers"
        id="chart-team-load"
      >
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
          Load ticket data to view team load
        </div>
      </ChartCard>
    );
  }

  const data = devLoads.map((d) => ({
    name: d.name.split(' ')[0],
    fullName: d.name,
    assigned: d.assigned,
    spent: d.spent,
    remainingEst: d.remaining,
    capacity: d.originalCapacity,
    capacityLeft: Math.max(d.originalCapacity - d.assigned, 0),
    loadPercent: d.loadPercent,
  }));

  return (
    <ChartCard
      title="Team Load Balance"
      subtitle="Side-by-side comparison of utilization across developers"
      id="chart-team-load"
    >
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} barGap={4} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={{ stroke: '#cbd5e1' }}
            label={{
              value: 'Hours',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12, fill: '#64748b' },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Bar
            dataKey="spent"
            name="Time Spent"
            stackId="work"
            fill="#10b981"
            radius={[0, 0, 0, 0]}
            maxBarSize={50}
          />
          <Bar
            dataKey="remainingEst"
            name="Remaining Estimate"
            stackId="work"
            fill="#6366f1"
            maxBarSize={50}
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.loadPercent > 100 ? '#ef4444' : '#6366f1'}
              />
            ))}
          </Bar>
          <Bar
            dataKey="capacityLeft"
            name="Capacity Left"
            fill="#e2e8f0"
            radius={[4, 4, 0, 0]}
            maxBarSize={50}
          />
          {data.length > 0 && (
            <ReferenceLine
              y={data[0]?.capacity || 40}
              stroke="#f59e0b"
              strokeDasharray="6 4"
              label={{
                value: 'Default Capacity',
                position: 'right',
                style: { fontSize: 11, fill: '#f59e0b' },
              }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
