import { useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ZAxis,
  Cell,
} from 'recharts';
import { useSprint } from '../context/SprintContext';
import { getPriorityValue } from '../utils/xmlParser';
import ChartCard from './ChartCard';
import TimeToggle from './TimeToggle';

const QUADRANT_COLORS = {
  quickWin: '#10b981',
  strategic: '#6366f1',
  filler: '#94a3b8',
  risk: '#ef4444',
};

function getQuadrant(hours, priorityValue) {
  if (hours <= 6 && priorityValue >= 3) return 'quickWin';
  if (hours > 6 && priorityValue >= 3) return 'strategic';
  if (hours <= 6 && priorityValue < 3) return 'filler';
  return 'risk';
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  const quadrantLabels = {
    quickWin: 'Quick Win',
    strategic: 'Strategic',
    filler: 'Low Filler',
    risk: 'High-Risk Sink',
  };

  return (
    <div className="bg-white shadow-lg rounded-lg border border-slate-200 p-3 text-sm max-w-64">
      <p className="font-semibold text-slate-800">{d.key}</p>
      <p className="text-slate-600 text-xs mb-1">{d.summary}</p>
      <div className="flex flex-col gap-0.5 mt-1">
        <span className="text-slate-500">
          {d.isRemaining ? 'Remaining' : 'Original Estimate'}: <span className="font-medium text-slate-700">{d.hours}h</span>
          {!d.isRemaining && d.spent > 0 && (
            <span className="text-emerald-600 ml-1">({d.spent}h spent so far)</span>
          )}
        </span>
        <span className="text-slate-500">
          Priority: <span className="font-medium text-slate-700">{d.priorityRaw}</span>
        </span>
      </div>
      <span
        className="inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
        style={{
          backgroundColor: QUADRANT_COLORS[d.quadrant] + '20',
          color: QUADRANT_COLORS[d.quadrant],
        }}
      >
        {quadrantLabels[d.quadrant]}
      </span>
    </div>
  );
}

export default function RiskValueChart() {
  const { userStories } = useSprint();
  const [mode, setMode] = useState('original');

  if (userStories.length === 0) {
    return (
      <ChartCard
        title="Risk vs. Value"
        subtitle="Effort (hours) vs. priority value — identify quick wins and risk sinks"
        id="chart-risk-value"
      >
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
          Load ticket data to view risk/value scatter
        </div>
      </ChartCard>
    );
  }

  const isRemaining = mode === 'remaining';

  const maxHours = Math.max(
    ...userStories.map((t) => {
      const orig = t.originalEstimateHours || t.estimateHours;
      return isRemaining ? Math.max(orig - (t.timeSpentHours || 0), 0) : orig;
    }),
    12
  );
  const midHours = 6;

  const data = userStories.map((t) => {
    const pv = getPriorityValue(t.priority);
    const orig = t.originalEstimateHours || t.estimateHours;
    const hours = isRemaining
      ? Math.max(orig - (t.timeSpentHours || 0), 0)
      : orig;
    return {
      key: t.key || t.id,
      summary: t.summary,
      hours: Math.round(hours * 10) / 10,
      spent: Math.round((t.timeSpentHours || 0) * 10) / 10,
      isRemaining,
      priorityValue: pv + (Math.random() * 0.3 - 0.15), // jitter to avoid overlap
      priorityRaw: t.priorityRaw || t.priority,
      quadrant: getQuadrant(hours, pv),
      z: 80,
    };
  });

  return (
    <ChartCard
      title="Risk vs. Value"
      subtitle={isRemaining
        ? "Remaining effort (hours) vs. priority value — identify quick wins and risk sinks"
        : "Original estimate (hours) vs. priority value — identify quick wins and risk sinks"
      }
      id="chart-risk-value"
      actions={<TimeToggle mode={mode} onChange={setMode} />}
    >
      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          {/* Quadrant backgrounds */}
          <ReferenceArea
            x1={0}
            x2={midHours}
            y1={2.5}
            y2={4.5}
            fill="#10b981"
            fillOpacity={0.06}
            label={{ value: 'Quick Wins', position: 'insideTopLeft', style: { fontSize: 11, fill: '#10b981', fontWeight: 600 } }}
          />
          <ReferenceArea
            x1={midHours}
            x2={maxHours + 2}
            y1={2.5}
            y2={4.5}
            fill="#6366f1"
            fillOpacity={0.06}
            label={{ value: 'Strategic', position: 'insideTopRight', style: { fontSize: 11, fill: '#6366f1', fontWeight: 600 } }}
          />
          <ReferenceArea
            x1={midHours}
            x2={maxHours + 2}
            y1={0.5}
            y2={2.5}
            fill="#ef4444"
            fillOpacity={0.06}
            label={{ value: 'Risk Sinks', position: 'insideBottomRight', style: { fontSize: 11, fill: '#ef4444', fontWeight: 600 } }}
          />
          <ReferenceArea
            x1={0}
            x2={midHours}
            y1={0.5}
            y2={2.5}
            fill="#94a3b8"
            fillOpacity={0.06}
            label={{ value: 'Low Filler', position: 'insideBottomLeft', style: { fontSize: 11, fill: '#94a3b8', fontWeight: 600 } }}
          />
          <ReferenceLine x={midHours} stroke="#cbd5e1" strokeDasharray="4 4" />
          <ReferenceLine y={2.5} stroke="#cbd5e1" strokeDasharray="4 4" />
          <XAxis
            dataKey="hours"
            type="number"
            name="Effort"
            domain={[0, maxHours + 2]}
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={{ stroke: '#cbd5e1' }}
            label={{
              value: isRemaining ? 'Remaining Hours' : 'Original Estimate (Hours)',
              position: 'insideBottom',
              offset: -10,
              style: { fontSize: 12, fill: '#64748b' },
            }}
          />
          <YAxis
            dataKey="priorityValue"
            type="number"
            name="Priority"
            domain={[0.5, 4.5]}
            ticks={[1, 2, 3, 4]}
            tickFormatter={(v) =>
              ({ 1: 'Lowest', 2: 'Low', 3: 'High', 4: 'Highest' })[v] || ''
            }
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={{ stroke: '#cbd5e1' }}
            label={{
              value: 'Priority (Value)',
              angle: -90,
              position: 'insideLeft',
              offset: 5,
              style: { fontSize: 12, fill: '#64748b' },
            }}
          />
          <ZAxis dataKey="z" range={[60, 120]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data}>
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={QUADRANT_COLORS[entry.quadrant]}
                fillOpacity={0.8}
                stroke={QUADRANT_COLORS[entry.quadrant]}
                strokeWidth={1}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {[
          { key: 'quickWin', label: 'Quick Win' },
          { key: 'strategic', label: 'Strategic' },
          { key: 'filler', label: 'Low Filler' },
          { key: 'risk', label: 'High-Risk Sink' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: QUADRANT_COLORS[key] }}
            />
            {label}
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
