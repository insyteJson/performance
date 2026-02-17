import { Users, Clock, ArrowRight } from 'lucide-react';
import { useSprint } from '../context/SprintContext';
import { GaugeRing } from './CapacityGauges';

export default function TeamManagement({ onNavigateToTeam }) {
  const { devs, devLoads, totalCapacity } = useSprint();

  const devLoadMap = new Map(devLoads.map((d) => [d.name, d]));

  return (
    <div className="bg-white rounded-b-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Users size={20} />
          Team Members
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Overview of your team and sprint capacity
        </p>
      </div>

      {/* Summary bar */}
      {devs.length > 0 && (
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Users size={16} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Team Size</p>
                <p className="text-lg font-bold text-slate-800">
                  {devs.length} {devs.length === 1 ? 'Member' : 'Members'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Clock size={16} className="text-purple-600" />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sprint Capacity</p>
                <p className="text-lg font-bold text-slate-800">{totalCapacity}h</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dev list (read-only) */}
      <div className="p-6">
        {devs.length > 0 ? (
          <div className="space-y-2">
            {devs.map((dev) => {
              const load = devLoadMap.get(dev.name);
              const loadPercent = load?.loadPercent ?? 0;
              const isOver = loadPercent > 100;

              return (
                <div
                  key={dev.name}
                  className={`flex items-center gap-3 p-3 border rounded-xl ${
                    isOver
                      ? 'border-red-200 bg-red-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Mini gauge */}
                  <div className="relative shrink-0">
                    <GaugeRing percent={loadPercent} size={40} strokeWidth={4} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className={`text-[10px] font-bold ${
                          isOver ? 'text-red-600' : 'text-slate-700'
                        }`}
                      >
                        {loadPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                    {dev.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-800 block truncate">
                      {dev.name}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={11} />
                      {dev.capacity}h per sprint
                    </span>
                  </div>
                  {isOver && (
                    <span className="text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full shrink-0">
                      OVER
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-indigo-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">No team members yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Import tickets to auto-detect assignees, or manage your team on the Team page.
            </p>
          </div>
        )}

        {/* Link to full Team page */}
        <button
          onClick={onNavigateToTeam}
          className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-semibold hover:from-indigo-100 hover:to-purple-100 transition-all"
        >
          Manage Team Members
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
