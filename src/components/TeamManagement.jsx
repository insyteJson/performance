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

export default function TeamManagement() {
  const { devs, addDev, updateDevCapacity, removeDev } = useSprint();
  const [newDevName, setNewDevName] = useState('');
  const [editingDev, setEditingDev] = useState(null);
  const [editCapacity, setEditCapacity] = useState('');

  const handleAddDev = () => {
    if (!newDevName.trim()) return;
    addDev({ name: newDevName.trim() });
    setNewDevName('');
  };

  const startEdit = (dev) => {
    setEditingDev(dev.name);
    setEditCapacity(String(dev.capacity));
  };

  const saveEdit = () => {
    if (editingDev) {
      updateDevCapacity(editingDev, parseFloat(editCapacity) || 40);
      setEditingDev(null);
      setEditCapacity('');
    }
  };

  const totalCapacity = devs.reduce((sum, d) => sum + d.capacity, 0);

  return (
    <div className="bg-white rounded-b-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2.5">
          <Users size={20} />
          Team Members
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Manage your team and set available hours per sprint for each member
        </p>
      </div>

      {/* Summary bar */}
      {devs.length > 0 && (
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white rounded-lg shadow-sm">
                <Users size={18} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Team Size</p>
                <p className="text-xl font-bold text-slate-800">
                  {devs.length} {devs.length === 1 ? 'Member' : 'Members'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white rounded-lg shadow-sm">
                <Clock size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Sprint Capacity</p>
                <p className="text-xl font-bold text-slate-800">{totalCapacity}h</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dev list */}
      <div className="p-6">
        {devs.length > 0 ? (
          <div className="space-y-3 mb-6">
            {devs.map((dev) => (
              <div
                key={dev.name}
                className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-md">
                    {dev.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-slate-800 block truncate mb-0.5">
                      {dev.name}
                    </span>
                    {!editingDev || editingDev !== dev.name ? (
                      <span className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Clock size={12} />
                        {dev.capacity}h per sprint
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  {editingDev === dev.name ? (
                    <>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                        <input
                          type="number"
                          value={editCapacity}
                          onChange={(e) => setEditCapacity(e.target.value)}
                          className="w-16 px-1 text-sm bg-transparent focus:outline-none"
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                        />
                        <span className="text-xs text-slate-400 font-medium">h</span>
                      </div>
                      <button
                        onClick={saveEdit}
                        className="p-2.5 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditingDev(null)}
                        className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(dev)}
                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit hours per sprint"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => removeDev(dev.name)}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove team member"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-indigo-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">No team members yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Import tickets to auto-detect assignees, or add members manually below
            </p>
          </div>
        )}

        {/* Add new dev */}
        <div className="border-t border-slate-200 pt-6">
          <div className="flex gap-3 min-w-0">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={newDevName}
                onChange={(e) => setNewDevName(e.target.value)}
                placeholder="Enter team member name..."
                className="w-full px-5 py-3.5 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAddDev()}
              />
            </div>
            <button
              onClick={handleAddDev}
              className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2.5 shrink-0"
            >
              <UserPlus size={18} />
              <span>Add Member</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-3.5 flex items-start gap-2">
            <span className="text-indigo-500 font-semibold">💡</span>
            <span>Default capacity is 40h/sprint. Hover over team members to edit or remove them.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
