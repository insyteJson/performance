import {
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  Target,
  Zap,
} from 'lucide-react';
import { useSprint } from '../context/SprintContext';

function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards() {
  const {
    tickets,
    devs,
    totalCapacity,
    totalAssigned,
    loadPercentage,
    overloadedCount,
    atRiskTickets,
  } = useSprint();

  const highestCount = tickets.filter((t) => t.priority === 'Highest').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        icon={Target}
        label="Total Tickets"
        value={tickets.length}
        sub={`${highestCount} critical`}
        color="indigo"
      />
      <StatCard
        icon={Users}
        label="Team Size"
        value={devs.length}
        sub={`${totalCapacity}h capacity`}
        color="blue"
      />
      <StatCard
        icon={Clock}
        label="Sprint Load"
        value={`${loadPercentage}%`}
        sub={`${Math.round(totalAssigned)}h assigned`}
        color={loadPercentage > 100 ? 'red' : loadPercentage > 80 ? 'amber' : 'emerald'}
      />
      <StatCard
        icon={Zap}
        label="Assigned Hours"
        value={`${Math.round(totalAssigned)}h`}
        sub={`of ${totalCapacity}h`}
        color="violet"
      />
      <StatCard
        icon={AlertTriangle}
        label="Overloaded"
        value={overloadedCount}
        sub={overloadedCount > 0 ? 'devs over 100%' : 'all clear'}
        color={overloadedCount > 0 ? 'red' : 'emerald'}
      />
      <StatCard
        icon={TrendingUp}
        label="At Risk"
        value={atRiskTickets.length}
        sub="tickets past cutoff"
        color={atRiskTickets.length > 0 ? 'amber' : 'emerald'}
      />
    </div>
  );
}
