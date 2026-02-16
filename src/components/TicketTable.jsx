import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useSprint } from '../context/SprintContext';
import { getPriorityLabel, getPriorityColor } from '../utils/xmlParser';

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-700',
  'in progress': 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
  done: 'bg-emerald-100 text-emerald-700',
};

function getStatusClass(status) {
  const key = (status || '').toLowerCase();
  for (const [k, v] of Object.entries(STATUS_COLORS)) {
    if (key.includes(k)) return v;
  }
  return 'bg-slate-100 text-slate-600';
}

function PriorityBadge({ priority }) {
  const color = getPriorityColor(priority);
  const label = getPriorityLabel(priority);
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: color + '18', color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function ProgressBar({ spent, remaining }) {
  const total = spent + remaining;
  if (total === 0) return <span className="text-slate-400 text-xs">--</span>;
  const pct = Math.round((spent / total) * 100);
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

const COLUMNS = [
  { key: 'key', label: 'Key', w: 'w-24' },
  { key: 'summary', label: 'Summary', w: 'min-w-[200px]' },
  { key: 'type', label: 'Type', w: 'w-24' },
  { key: 'priority', label: 'Priority', w: 'w-28' },
  { key: 'status', label: 'Status', w: 'w-28' },
  { key: 'assignee', label: 'Assignee', w: 'w-32' },
  { key: 'epic', label: 'Epic', w: 'w-32' },
  { key: 'estimateHours', label: 'Remaining', w: 'w-24', numeric: true },
  { key: 'timeSpentHours', label: 'Spent', w: 'w-20', numeric: true },
  { key: 'totalHours', label: 'Total', w: 'w-20', numeric: true },
  { key: 'progress', label: 'Progress', w: 'w-36' },
];

export default function TicketTable() {
  const { tickets } = useSprint();
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('key');
  const [sortDir, setSortDir] = useState('asc');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const assignees = useMemo(
    () => [...new Set(tickets.map((t) => t.assignee))].sort(),
    [tickets]
  );
  const priorities = useMemo(
    () => [...new Set(tickets.map((t) => t.priority))],
    [tickets]
  );
  const statuses = useMemo(
    () => [...new Set(tickets.map((t) => t.status))].sort(),
    [tickets]
  );

  const enriched = useMemo(
    () =>
      tickets.map((t) => ({
        ...t,
        totalHours: (t.timeSpentHours || 0) + t.estimateHours,
      })),
    [tickets]
  );

  const filtered = useMemo(() => {
    let result = enriched;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.key.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          t.epic.toLowerCase().includes(q) ||
          t.assignee.toLowerCase().includes(q)
      );
    }
    if (filterAssignee) result = result.filter((t) => t.assignee === filterAssignee);
    if (filterPriority) result = result.filter((t) => t.priority === filterPriority);
    if (filterStatus) result = result.filter((t) => t.status === filterStatus);
    return result;
  }, [enriched, search, filterAssignee, filterPriority, filterStatus]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let aVal = a[sortCol];
      let bVal = b[sortCol];

      if (sortCol === 'priority') {
        const order = { Highest: 0, High: 1, Low: 2, Lowest: 3 };
        aVal = order[aVal] ?? 4;
        bVal = order[bVal] ?? 4;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    return arr;
  }, [filtered, sortCol, sortDir]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ArrowUpDown size={12} className="text-slate-300" />;
    return sortDir === 'asc' ? (
      <ArrowUp size={12} className="text-indigo-500" />
    ) : (
      <ArrowDown size={12} className="text-indigo-500" />
    );
  };

  // Summary row totals
  const totalEstimate = sorted.reduce((s, t) => s + t.estimateHours, 0);
  const totalSpent = sorted.reduce((s, t) => s + (t.timeSpentHours || 0), 0);
  const totalHours = sorted.reduce((s, t) => s + t.totalHours, 0);

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-slate-200">
        <Search size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-400">No Tickets Loaded</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md text-center">
          Upload an XML file or paste ticket data in the sidebar to view ticket details.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-800">
            All Tickets
            <span className="text-sm font-normal text-slate-400 ml-2">
              {sorted.length} of {tickets.length}
            </span>
          </h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Assignees</option>
            {assignees.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            {priorities.map((p) => (
              <option key={p} value={p}>{getPriorityLabel(p)}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {(search || filterAssignee || filterPriority || filterStatus) && (
            <button
              onClick={() => {
                setSearch('');
                setFilterAssignee('');
                setFilterPriority('');
                setFilterStatus('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none ${col.w}`}
                  onClick={() => col.key !== 'progress' && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.key !== 'progress' && <SortIcon col={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-mono font-medium text-indigo-600">
                  {t.key}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate" title={t.summary}>
                  {t.summary}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{t.type}</td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${getStatusClass(t.status)}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{t.assignee}</td>
                <td className="px-4 py-3 text-sm text-slate-500 truncate max-w-[130px]" title={t.epic}>
                  {t.epic || <span className="text-slate-300">--</span>}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 font-medium tabular-nums">
                  {t.estimateHours > 0 ? `${Math.round(t.estimateHours * 10) / 10}h` : <span className="text-slate-300">--</span>}
                </td>
                <td className="px-4 py-3 text-sm tabular-nums">
                  {(t.timeSpentHours || 0) > 0 ? (
                    <span className="text-emerald-600 font-medium">{Math.round(t.timeSpentHours * 10) / 10}h</span>
                  ) : (
                    <span className="text-slate-300">--</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 font-medium tabular-nums">
                  {t.totalHours > 0 ? `${Math.round(t.totalHours * 10) / 10}h` : <span className="text-slate-300">--</span>}
                </td>
                <td className="px-4 py-3">
                  <ProgressBar spent={t.timeSpentHours || 0} remaining={t.estimateHours} />
                </td>
              </tr>
            ))}
          </tbody>
          {/* Summary footer */}
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200">
              <td colSpan={7} className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">
                Totals
              </td>
              <td className="px-4 py-3 text-sm font-bold text-slate-800 tabular-nums">
                {Math.round(totalEstimate * 10) / 10}h
              </td>
              <td className="px-4 py-3 text-sm font-bold text-emerald-600 tabular-nums">
                {Math.round(totalSpent * 10) / 10}h
              </td>
              <td className="px-4 py-3 text-sm font-bold text-slate-800 tabular-nums">
                {Math.round(totalHours * 10) / 10}h
              </td>
              <td className="px-4 py-3">
                <ProgressBar spent={totalSpent} remaining={totalEstimate} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
