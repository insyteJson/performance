import { useState } from 'react';
import {
  UserPlus,
  Trash2,
  Edit3,
  Check,
  X,
  Users,
  Clock,
} from 'lucide-react';
import { useSprint } from '../context/SprintContext';
import { GaugeRing } from './CapacityGauges';

export default function TeamPage() {
  const {
    devs, devLoads, addDev, updateDevCapacity, removeDev,
    totalCapacity, totalOriginalCapacity, totalRemainingCapacity,
  } = useSprint();
  const [newDevName, setNewDevName] = useState('');
  const [editingDev, setEditingDev] = useState(null);
  const [editOriginal, setEditOriginal] = useState('');
  const [editRemaining, setEditRemaining] = useState('');

  const handleAddDev = () => {
    if (!newDevName.trim()) return;
    addDev({ name: newDevName.trim() });
    setNewDevName('');
  };

  const startEdit = (dev) => {
    setEditingDev(dev.name);
    setEditOriginal(String(dev.originalCapacity));
    setEditRemaining(String(dev.remainingCapacity));
  };

  const saveEdit = () => {
    if (editingDev) {
      updateDevCapacity(editingDev, {
        originalCapacity: parseFloat(editOriginal) || 40,
        remainingCapacity: parseFloat(editRemaining) || 40,
      });
      setEditingDev(null);
      setEditOriginal('');
      setEditRemaining('');
    }
  };

  const devLoadMap = new Map(devLoads.map((d) => [d.name, d]));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 rounded-lg">
              <Users size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Team Size
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {devs.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 rounded-lg">
              <Clock size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Original Capacity
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {totalOriginalCapacity}h
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-lg">
              <Clock size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Remaining Capacity
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {totalRemainingCapacity}h
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-lg">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Avg. Original
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {devs.length > 0
                  ? Math.round(totalOriginalCapacity / devs.length)
                  : 0}
                h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team members list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Users size={20} />
            Team Members
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Add developers, set original &amp; remaining capacity per sprint, and monitor individual load
          </p>
        </div>

        {/* Add new dev form */}
        <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-200">
          <div className="flex gap-3 max-w-xl">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={newDevName}
                onChange={(e) => setNewDevName(e.target.value)}
                placeholder="Enter team member name..."
                className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAddDev()}
              />
            </div>
            <button
              onClick={handleAddDev}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 shrink-0"
            >
              <UserPlus size={16} />
              Add Member
            </button>
          </div>
        </div>

        {/* Dev list */}
        <div className="p-6">
          {devs.length > 0 ? (
            <div className="space-y-3">
              {devs.map((dev) => {
                const load = devLoadMap.get(dev.name);
                const loadPercent = load?.loadPercent ?? 0;
                const isOver = loadPercent > 100;

                return (
                  <div
                    key={dev.name}
                    className={`flex items-center gap-4 p-4 border rounded-xl hover:shadow-md transition-all group ${
                      isOver
                        ? 'border-red-200 bg-red-50/30'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {/* Mini gauge */}
                    <div className="relative shrink-0">
                      <GaugeRing
                        percent={loadPercent}
                        size={52}
                        strokeWidth={5}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className={`text-xs font-bold ${
                            isOver ? 'text-red-600' : 'text-slate-700'
                          }`}
                        >
                          {loadPercent}%
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                          {dev.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-slate-800 block truncate">
                            {dev.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {load
                              ? `${Math.round(load.assigned * 10) / 10}h assigned`
                              : 'No tickets assigned'}
                            {load?.spent > 0 &&
                              ` · ${Math.round(load.spent * 10) / 10}h spent`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Capacity edit */}
                    <div className="flex items-center gap-2 shrink-0">
                      {editingDev === dev.name ? (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-medium text-slate-400 uppercase">Original</span>
                              <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-2 py-1 border border-slate-200">
                                <input
                                  type="number"
                                  value={editOriginal}
                                  onChange={(e) => setEditOriginal(e.target.value)}
                                  className="w-14 px-1 text-sm bg-transparent focus:outline-none"
                                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                  autoFocus
                                />
                                <span className="text-xs text-slate-400">h</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-medium text-slate-400 uppercase">Remaining</span>
                              <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-2 py-1 border border-emerald-200">
                                <input
                                  type="number"
                                  value={editRemaining}
                                  onChange={(e) => setEditRemaining(e.target.value)}
                                  className="w-14 px-1 text-sm bg-transparent focus:outline-none"
                                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                />
                                <span className="text-xs text-slate-400">h</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={saveEdit}
                            className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-colors"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setEditingDev(null)}
                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 mr-1">
                            <span className="text-sm font-medium text-slate-600 flex items-center gap-1" title="Original capacity (sprint start → end)">
                              <Clock size={14} className="text-indigo-400" />
                              {dev.originalCapacity}h
                            </span>
                            <span className="text-sm font-medium text-slate-600 flex items-center gap-1" title="Remaining capacity (today → sprint end)">
                              <Clock size={14} className="text-emerald-400" />
                              {dev.remainingCapacity}h
                            </span>
                          </div>
                          {isOver && (
                            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full mr-1">
                              OVERLOADED
                            </span>
                          )}
                          <button
                            onClick={() => startEdit(dev)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Edit capacity"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => removeDev(dev.name)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove team member"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-indigo-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-700 mb-1">
                No team members yet
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Import tickets to auto-detect assignees, or add members manually
                using the form above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
