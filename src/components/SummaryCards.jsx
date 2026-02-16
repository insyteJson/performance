import {
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  Target,
  Timer,
} from 'lucide-react';
import { useSprint } from '../context/SprintContext';

function StatCard({ icon: Icon, label, value, sub, color = 'indigo', progress }) {
  const colors = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', bar: 'bg-indigo-500' },
    red: { bg: 'bg-red-50', text: 'text-red-600', bar: 'bg-red-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', bar: 'bg-amber-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', bar: 'bg-violet-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-500' },
  };

  const c = colors[color];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${c.bg} ${c.text} shrink-0 ml-3`}>
          <Icon size={20} />
        </div>
      </div>
      {progress != null && (
        <div className="mt-3">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${c.bar} transition-all duration-500`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
      {sub && (
        <p className="text-xs text-slate-500 mt-2">{sub}</p>
      )}
    </div>
  );
}

export default function SummaryCards() {
  const {
    userStories,
    devs,
    totalCapacity,
    totalAssigned,
    totalTimeSpent,
    totalWork,
    loadPercentage,
    sprintProgress,
    overloadedCount,
    atRiskTickets,
  } = useSprint();

  const highestCount = userStories.filter((t) => t.priority === 'Highest').length;

  return (
    <div className="grid grid-cols-3 gap-4 lg:gap-5">
      {/* Row 1 */}
      <StatCard
        icon={Target}
        label="User Stories"
        value={userStories.length}
        sub={`${highestCount} critical priority`}
        color="indigo"
      />
      <StatCard
        icon={Users}
        label="Team Size"
        value={devs.length}
        sub={`${totalCapacity}h total capacity`}
        color="blue"
      />
      <StatCard
        icon={Clock}
        label="Sprint Load"
        value={`${loadPercentage}%`}
        sub={`${Math.round(totalWork)}h total work of ${totalCapacity}h capacity`}
        color={loadPercentage > 100 ? 'red' : loadPercentage > 80 ? 'amber' : 'emerald'}
        progress={loadPercentage}
      />

      {/* Row 2 */}
      <StatCard
        icon={Timer}
        label="Time Tracking"
        value={`${Math.round(totalTimeSpent)}h`}
        sub={`logged of ${Math.round(totalWork)}h total \u00B7 ${Math.round(totalAssigned)}h remaining`}
        color="violet"
        progress={sprintProgress}
      />
      <StatCard
        icon={AlertTriangle}
        label="Overloaded Devs"
        value={overloadedCount}
        sub={overloadedCount > 0 ? `${overloadedCount} dev${overloadedCount > 1 ? 's' : ''} over 100% capacity` : 'All devs within capacity'}
        color={overloadedCount > 0 ? 'red' : 'emerald'}
      />
      <StatCard
        icon={TrendingUp}
        label="At Risk"
        value={atRiskTickets.length}
        sub={atRiskTickets.length > 0 ? `${atRiskTickets.length} ticket${atRiskTickets.length > 1 ? 's' : ''} past capacity cutoff` : 'All tickets within capacity'}
        color={atRiskTickets.length > 0 ? 'amber' : 'emerald'}
      />
    </div>
  );
}
