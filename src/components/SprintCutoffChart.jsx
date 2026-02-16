import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useSprint } from '../context/SprintContext';
import { getPriorityLabel, getPriorityColor } from '../utils/xmlParser';
import ChartCard from './ChartCard';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white shadow-lg rounded-lg border border-slate-200 p-3 text-sm">
      <p className="font-semibold text-slate-800">{d.key}</p>
      <p className="text-xs text-slate-500 mb-1">{d.summary}</p>
      <p className="text-slate-600">
        Total: <span className="font-medium">{d.totalHours}h</span>
        {d.spent > 0 && (
          <span className="text-slate-400"> ({d.spent}h spent + {d.remaining}h remaining)</span>
        )}
      </p>
      <p className="text-slate-600">
        Cumulative: <span className="font-medium">{d.cumulative}h</span>
      </p>
      <p className="text-slate-600">
        Priority:{' '}
        <span
          className="font-medium"
          style={{ color: getPriorityColor(d.priority) }}
        >
          {getPriorityLabel(d.priority)}
        </span>
      </p>
      {d.atRisk && (
        <p className="text-red-600 font-medium mt-1">At Risk</p>
      )}
    </div>
  );
}

export default function SprintCutoffChart() {
  const { ticketsByPriority, totalCapacity } = useSprint();

  if (ticketsByPriority.length === 0) {
    return (
      <ChartCard
        title='Sprint "Cut-off" Line'
        subtitle="Cumulative hours by priority — everything above the capacity line is at risk"
        id="chart-cutoff"
      >
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
          Load ticket data to view sprint cut-off
        </div>
      </ChartCard>
    );
  }

  let cumulative = 0;
  const data = ticketsByPriority.map((t, idx) => {
    const spent = t.timeSpentHours || 0;
    const remaining = t.estimateHours;
    const totalHours = spent + remaining;
    cumulative += totalHours;
    return {
      idx: idx + 1,
      key: t.key || t.id,
      summary: t.summary,
      totalHours: Math.round(totalHours * 10) / 10,
      spent: Math.round(spent * 10) / 10,
      remaining: Math.round(remaining * 10) / 10,
      cumulative: Math.round(cumulative * 10) / 10,
      priority: t.priority,
      atRisk: cumulative > totalCapacity,
    };
  });

  // Find the index where we cross the capacity line
  const crossoverIndex = data.findIndex((d) => d.atRisk);

  // Split into safe and at-risk segments for dual-color area
  const safeData = data.map((d) => ({
    ...d,
    safe: d.atRisk ? null : d.cumulative,
    risk: d.atRisk ? d.cumulative : null,
  }));

  // For a smooth transition, duplicate the crossover point
  if (crossoverIndex > 0) {
    safeData[crossoverIndex] = {
      ...safeData[crossoverIndex],
      safe: safeData[crossoverIndex].cumulative,
    };
  }

  return (
    <ChartCard
      title='Sprint "Cut-off" Line'
      subtitle="Cumulative hours by priority — everything above the capacity line is at risk"
      id="chart-cutoff"
    >
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={safeData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <defs>
            <linearGradient id="safeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="key"
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={{ stroke: '#cbd5e1' }}
            angle={-45}
            textAnchor="end"
            height={60}
            label={{
              value: 'Tickets (sorted by priority)',
              position: 'insideBottom',
              offset: -5,
              style: { fontSize: 12, fill: '#64748b' },
            }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={{ stroke: '#cbd5e1' }}
            label={{
              value: 'Cumulative Hours',
              angle: -90,
              position: 'insideLeft',
              offset: 5,
              style: { fontSize: 12, fill: '#64748b' },
            }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Safe area */}
          <Area
            type="stepAfter"
            dataKey="safe"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#safeGrad)"
            connectNulls={false}
          />

          {/* At-risk area */}
          <Area
            type="stepAfter"
            dataKey="risk"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#riskGrad)"
            connectNulls={false}
          />

          {/* Capacity line */}
          <ReferenceLine
            y={totalCapacity}
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="8 4"
            label={{
              value: `Team Capacity: ${totalCapacity}h`,
              position: 'insideTopRight',
              style: { fontSize: 12, fill: '#f59e0b', fontWeight: 600 },
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-2 justify-center text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-indigo-500" />
          Committed (within capacity)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          At Risk (over capacity)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-amber-500" style={{ borderTop: '2px dashed #f59e0b' }} />
          Team Capacity Line
        </div>
      </div>
    </ChartCard>
  );
}
