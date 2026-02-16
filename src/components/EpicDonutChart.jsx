import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useSprint } from '../context/SprintContext';
import ChartCard from './ChartCard';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  // Check if this is a story (has summary) or epic (has count)
  const isStory = d.summary !== undefined;

  return (
    <div className="bg-white shadow-lg rounded-lg border border-slate-200 p-3 text-sm">
      <p className="font-semibold text-slate-800">{d.name}</p>
      {isStory && <p className="text-xs text-slate-500 mb-1">{d.summary}</p>}
      {!isStory && (
        <p className="text-slate-600 text-xs mb-1">
          {d.count} user {d.count === 1 ? 'story' : 'stories'}
        </p>
      )}
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

  const getTicketTotal = (t) => (t.timeSpentHours || 0) + t.estimateHours;
  const getTicketSpent = (t) => t.timeSpentHours || 0;

  // Group stories by epic for inner ring
  const epicMap = new Map();
  userStories.forEach((t) => {
    let key = t.epic || 'No Epic';

    // If epic looks like a ticket key (IT-###), treat it as "No Epic"
    if (/^[A-Z]+-\d+$/.test(key)) {
      key = 'No Epic';
    }

    if (!epicMap.has(key)) {
      epicMap.set(key, { count: 0, hours: 0, spent: 0, stories: [] });
    }
    const e = epicMap.get(key);
    e.count++;
    e.hours += getTicketTotal(t);
    e.spent += getTicketSpent(t);
    e.stories.push(t);
  });

  const totalHours = userStories.reduce((s, t) => s + getTicketTotal(t), 0);

  // Inner ring: Epics (grouped)
  const epicData = Array.from(epicMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      hours: Math.round(data.hours * 10) / 10,
      spent: Math.round(data.spent * 10) / 10,
      value: data.hours,
      pct: totalHours > 0 ? Math.round((data.hours / totalHours) * 100) : 0,
      stories: data.stories,
    }))
    .sort((a, b) => b.value - a.value);

  // Outer ring: Individual user stories (sorted by epic order)
  const storyData = [];
  epicData.forEach((epic) => {
    epic.stories
      .sort((a, b) => getTicketTotal(b) - getTicketTotal(a))
      .forEach((story) => {
        const storyHours = getTicketTotal(story);
        storyData.push({
          name: story.key,
          summary: story.summary,
          hours: Math.round(storyHours * 10) / 10,
          spent: Math.round(getTicketSpent(story) * 10) / 10,
          value: storyHours,
          pct: totalHours > 0 ? Math.round((storyHours / totalHours) * 100) : 0,
          epic: epic.name,
        });
      });
  });

  return (
    <ChartCard
      title="Epic Distribution"
      subtitle="Epics and their user stories breakdown"
      id="chart-epic"
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            {/* Inner ring - Epics */}
            <Pie
              data={epicData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              label={renderLabel}
              labelLine={false}
            >
              {epicData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            {/* Outer ring - User Stories */}
            <Pie
              data={storyData}
              cx="50%"
              cy="50%"
              innerRadius={92}
              outerRadius={115}
              paddingAngle={1}
              dataKey="value"
            >
              {storyData.map((story, idx) => {
                // Find epic index to match color
                const epicIdx = epicData.findIndex(e => e.name === story.epic);
                const epicColor = COLORS[epicIdx % COLORS.length];
                // Make story colors slightly darker variants of their epic
                const darker = epicColor.replace('f1', 'e1').replace('0b', '09').replace('81', '71');
                return <Cell key={idx} fill={darker} opacity={0.7} />;
              })}
            </Pie>
            <Tooltip
              content={<CustomTooltip />}
              offset={25}
              wrapperStyle={{ zIndex: 1000 }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-col gap-3 min-w-44 max-h-[280px] overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sticky top-0 bg-white">
            Epics
          </div>
          {epicData.map((d, i) => (
            <div key={d.name} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-slate-700 text-sm font-medium truncate">{d.name}</span>
              </div>
              <div className="text-xs text-slate-500 ml-5">
                {d.count} {d.count === 1 ? 'story' : 'stories'} · {d.hours}h
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
