import { useSprint } from '../context/SprintContext';
import ChartCard from './ChartCard';

function GaugeRing({ percent, size = 120, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 150) / 150) * circumference;
  const isOver = percent > 100;

  const color = isOver ? '#ef4444' : percent > 80 ? '#f59e0b' : '#10b981';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

export default function CapacityGauges() {
  const { devLoads } = useSprint();

  if (devLoads.length === 0) {
    return (
      <ChartCard
        title="Individual Capacity Gauges"
        subtitle="Assigned hours vs. total capacity per developer"
        id="chart-capacity"
      >
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
          Load ticket data to view capacity gauges
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Individual Capacity Gauges"
      subtitle="Assigned hours vs. total capacity per developer"
      id="chart-capacity"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {devLoads.map((dev) => {
          const isOver = dev.loadPercent > 100;
          return (
            <div
              key={dev.name}
              className={`flex flex-col items-center p-4 rounded-xl border ${
                isOver
                  ? 'border-red-200 bg-red-50/50'
                  : 'border-slate-100 bg-slate-50/50'
              }`}
            >
              <div className="relative">
                <GaugeRing percent={dev.loadPercent} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={`text-2xl font-bold ${
                      isOver ? 'text-red-600' : 'text-slate-800'
                    }`}
                  >
                    {dev.loadPercent}%
                  </span>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-700 mt-3">
                {dev.name}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                {Math.round(dev.assigned * 10) / 10}h / {dev.capacity}h
              </span>
              {dev.spent > 0 && (
                <span className="text-xs text-emerald-600 mt-0.5">
                  {Math.round(dev.spent * 10) / 10}h spent &middot; {Math.round(dev.remaining * 10) / 10}h left
                </span>
              )}
              {isOver && (
                <span className="mt-2 text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  OVERLOADED
                </span>
              )}
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
