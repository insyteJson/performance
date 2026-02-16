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
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Users size={20} />
          Team Members
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your team and set available hours per sprint for each member
        </p>
      </div>

      {/* Summary bar */}
      {devs.length > 0 && (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-600">
            {devs.length} member{devs.length !== 1 ? 's' : ''}
          </span>
          <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
            <Clock size={14} className="text-slate-400" />
            {totalCapacity}h total capacity / sprint
          </span>
        </div>
      )}

      {/* Dev list */}
      <div className="p-6">
        {devs.length > 0 ? (
          <div className="space-y-2 mb-5">
            {/* Column header */}
            <div className="flex items-center justify-between px-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Name
              </span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Hours / Sprint
              </span>
            </div>

            {devs.map((dev) => (
              <div
                key={dev.name}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold shrink-0">
                    {dev.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-700 truncate">
                    {dev.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {editingDev === dev.name ? (
                    <>
                      <input
                        type="number"
                        value={editCapacity}
                        onChange={(e) => setEditCapacity(e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        autoFocus
                      />
                      <span className="text-xs text-slate-400">h/sprint</span>
                      <button
                        onClick={saveEdit}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingDev(null)}
                        className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-slate-500 font-medium">
                        {dev.capacity}h
                      </span>
                      <button
                        onClick={() => startEdit(dev)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Edit hours per sprint"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => removeDev(dev.name)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Remove team member"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No team members yet</p>
            <p className="text-xs mt-1">
              Import tickets to auto-detect assignees, or add members manually
            </p>
          </div>
        )}

        {/* Add new dev */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newDevName}
            onChange={(e) => setNewDevName(e.target.value)}
            placeholder="Add team member..."
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleAddDev()}
          />
          <button
            onClick={handleAddDev}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1 shrink-0"
          >
            <UserPlus size={16} />
            Add
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-3">
          Default capacity is 40 hours per sprint. Click the edit icon to adjust for each team member.
        </p>
      </div>
    </div>
  );
}
