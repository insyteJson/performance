import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useSprint } from '../context/SprintContext';
import ChartCard from './ChartCard';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white shadow-lg rounded-lg border border-slate-200 p-3 text-sm">
      <p className="font-semibold text-slate-800">{d.name}</p>
      <p className="text-slate-600">
        Tickets: <span className="font-medium">{d.count}</span>
      </p>
      <p className="text-slate-600">
        Total: <span className="font-medium">{d.hours}h</span>
        {d.spent > 0 && (
          <span className="text-emerald-600 ml-1">({d.spent}h spent)</span>
        )}
      </p>
      <p className="text-slate-600">
        Share: <span className="font-medium">{d.pct}%</span>
      </p>
    </div>
  );
}

const RADIAN = Math.PI / 180;

function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, pct, name }) {
  if (pct < 5) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {pct}%
    </text>
  );
}

export default function EpicDonutChart() {
  const { userStories } = useSprint();

  if (userStories.length === 0) {
    return (
      <ChartCard
        title="Epic Distribution"
        subtitle="Customer Requests vs. Internal work"
        id="chart-epic"
      >
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
          Load ticket data to view epic distribution
        </div>
      </ChartCard>
    );
  }

  // Customer vs Internal breakdown (using aggregated user stories)
  const customerTickets = userStories.filter((t) => t.isCustomerRequest);
  const internalTickets = userStories.filter((t) => !t.isCustomerRequest);

  const getTicketTotal = (t) => (t.timeSpentHours || 0) + t.estimateHours;
  const getTicketSpent = (t) => t.timeSpentHours || 0;

  const customerHours = customerTickets.reduce((s, t) => s + getTicketTotal(t), 0);
  const customerSpent = customerTickets.reduce((s, t) => s + getTicketSpent(t), 0);
  const internalHours = internalTickets.reduce((s, t) => s + getTicketTotal(t), 0);
  const internalSpent = internalTickets.reduce((s, t) => s + getTicketSpent(t), 0);
  const totalHours = customerHours + internalHours;

  const donutData = [
    {
      name: 'Customer Requests',
      count: customerTickets.length,
      hours: Math.round(customerHours * 10) / 10,
      spent: Math.round(customerSpent * 10) / 10,
      value: customerHours,
      pct: totalHours > 0 ? Math.round((customerHours / totalHours) * 100) : 0,
    },
    {
      name: 'Internal / Other',
      count: internalTickets.length,
      hours: Math.round(internalHours * 10) / 10,
      spent: Math.round(internalSpent * 10) / 10,
      value: internalHours,
      pct: totalHours > 0 ? Math.round((internalHours / totalHours) * 100) : 0,
    },
  ];

  // Also breakdown by epic for the outer ring (using aggregated user stories)
  const epicMap = new Map();
  userStories.forEach((t) => {
    const key = t.epic || 'No Epic';
    if (!epicMap.has(key)) epicMap.set(key, { count: 0, hours: 0, spent: 0 });
    const e = epicMap.get(key);
    e.count++;
    e.hours += getTicketTotal(t);
    e.spent += getTicketSpent(t);
  });

  const epicData = Array.from(epicMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      hours: Math.round(data.hours * 10) / 10,
      spent: Math.round(data.spent * 10) / 10,
      value: data.hours,
      pct: totalHours > 0 ? Math.round((data.hours / totalHours) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <ChartCard
      title="Epic Distribution"
      subtitle="Customer Requests vs. Internal work"
      id="chart-epic"
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            {/* Inner ring - Customer vs Internal */}
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              label={renderLabel}
              labelLine={false}
            >
              <Cell fill="#6366f1" />
              <Cell fill="#94a3b8" />
            </Pie>
            {/* Outer ring - By Epic */}
            <Pie
              data={epicData}
              cx="50%"
              cy="50%"
              innerRadius={92}
              outerRadius={115}
              paddingAngle={2}
              dataKey="value"
            >
              {epicData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-col gap-2 min-w-44">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Type Breakdown
          </div>
          {donutData.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: i === 0 ? '#6366f1' : '#94a3b8' }}
              />
              <span className="text-slate-700">{d.name}</span>
              <span className="text-slate-400 ml-auto">{d.pct}%</span>
            </div>
          ))}
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-3 mb-1">
            By Epic
          </div>
          {epicData.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-slate-700 truncate">{d.name}</span>
              <span className="text-slate-400 ml-auto">{d.hours}h</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
