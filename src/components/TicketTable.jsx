import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
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
  const isOverBudget = spent > remaining || pct > 100;

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`text-xs w-8 text-right ${isOverBudget ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
        {pct}%
      </span>
    </div>
  );
}

export default function TicketTable() {
  const { hierarchy, allTickets } = useSprint();
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedEpics, setExpandedEpics] = useState(new Set());
  const [expandedStories, setExpandedStories] = useState(new Set());

  const assignees = useMemo(
    () => [...new Set(allTickets.map((t) => t.assignee))].sort(),
    [allTickets]
  );
  const priorities = useMemo(
    () => [...new Set(allTickets.map((t) => t.priority))],
    [allTickets]
  );
  const statuses = useMemo(
    () => [...new Set(allTickets.map((t) => t.status))].sort(),
    [allTickets]
  );

  // Filter hierarchy based on search and filters
  const filteredHierarchy = useMemo(() => {
    if (!search && !filterAssignee && !filterPriority && !filterStatus) {
      return hierarchy;
    }

    const q = search.toLowerCase();

    return hierarchy.map(epic => {
      const filteredStories = epic.stories.filter(story => {
        // Check filters
        if (filterAssignee && story.assignee !== filterAssignee) return false;
        if (filterPriority && story.priority !== filterPriority) return false;
        if (filterStatus && story.status !== filterStatus) return false;

        // Check search
        if (search) {
          const matches =
            story.key.toLowerCase().includes(q) ||
            story.summary.toLowerCase().includes(q) ||
            story.epic.toLowerCase().includes(q) ||
            story.assignee.toLowerCase().includes(q) ||
            (story.subtasks || []).some(st =>
              st.key.toLowerCase().includes(q) ||
              st.summary.toLowerCase().includes(q)
            );
          if (!matches) return false;
        }

        return true;
      });

      return {
        ...epic,
        stories: filteredStories,
      };
    }).filter(epic => epic.stories.length > 0);
  }, [hierarchy, search, filterAssignee, filterPriority, filterStatus]);

  const toggleEpic = (epicName) => {
    setExpandedEpics(prev => {
      const next = new Set(prev);
      if (next.has(epicName)) {
        next.delete(epicName);
      } else {
        next.add(epicName);
      }
      return next;
    });
  };

  const toggleStory = (storyKey) => {
    setExpandedStories(prev => {
      const next = new Set(prev);
      if (next.has(storyKey)) {
        next.delete(storyKey);
      } else {
        next.add(storyKey);
      }
      return next;
    });
  };

  // Calculate totals from filtered hierarchy
  const totals = useMemo(() => {
    let totalEstimate = 0;
    let totalSpent = 0;
    let ticketCount = 0;

    filteredHierarchy.forEach(epic => {
      epic.stories.forEach(story => {
        totalEstimate += story.estimateHours || 0;
        totalSpent += story.timeSpentHours || 0;
        ticketCount++;
      });
    });

    return {
      totalEstimate,
      totalSpent,
      totalHours: totalEstimate + totalSpent,
      ticketCount,
    };
  }, [filteredHierarchy]);

  if (hierarchy.length === 0) {
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
              {totals.ticketCount} user stories
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

      {/* Hierarchy Accordion Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-8"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Key</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[200px]">Summary</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Assignee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Original Est.</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Spent</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Remaining</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredHierarchy.map((epic) => {
              const isEpicExpanded = expandedEpics.has(epic.name);
              const epicEstimate = epic.stories.reduce((s, st) => s + (st.estimateHours || 0), 0);
              const epicSpent = epic.stories.reduce((s, st) => s + (st.timeSpentHours || 0), 0);
              const epicRemaining = epicEstimate - epicSpent;

              return (
                <EpicSection key={epic.name}>
                  {/* Epic Row */}
                  <tr
                    className="bg-indigo-50/60 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-indigo-100"
                    onClick={() => toggleEpic(epic.name)}
                  >
                    <td className="px-4 py-3">
                      {isEpicExpanded
                        ? <ChevronDown size={16} className="text-indigo-500" />
                        : <ChevronRight size={16} className="text-indigo-400" />
                      }
                    </td>
                    <td colSpan={2} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">EPIC</span>
                        <span className="text-sm font-semibold text-slate-800">{epic.name}</span>
                        <span className="text-xs text-slate-400">{epic.stories.length} stories</span>
                      </div>
                    </td>
                    <td colSpan={4}></td>
                    <td className="px-4 py-3 text-sm text-slate-700 font-semibold tabular-nums">
                      {epicEstimate > 0 ? `${Math.round(epicEstimate * 10) / 10}h` : <span className="text-slate-300">--</span>}
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums">
                      {epicSpent > 0 ? (
                        <span className="text-emerald-600 font-semibold">{Math.round(epicSpent * 10) / 10}h</span>
                      ) : (
                        <span className="text-slate-300">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold tabular-nums">
                      <span className={epicRemaining < 0 ? 'text-red-600' : 'text-slate-700'}>
                        {Math.round(epicRemaining * 10) / 10}h
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ProgressBar spent={epicSpent} remaining={epicEstimate} />
                    </td>
                  </tr>

                  {/* Stories under this epic */}
                  {isEpicExpanded && epic.stories.map((story) => {
                    const isStoryExpanded = expandedStories.has(story.key);
                    const subtasks = story.subtasks || [];
                    const storyRemaining = (story.estimateHours || 0) - (story.timeSpentHours || 0);

                    return (
                      <StorySection key={story.key}>
                        {/* Story Row */}
                        <tr
                          className={`hover:bg-slate-50/80 transition-colors ${subtasks.length > 0 ? 'cursor-pointer' : ''}`}
                          onClick={() => subtasks.length > 0 && toggleStory(story.key)}
                        >
                          <td className="px-4 py-3 pl-8">
                            {subtasks.length > 0 && (
                              isStoryExpanded
                                ? <ChevronDown size={14} className="text-slate-400" />
                                : <ChevronRight size={14} className="text-slate-300" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono font-medium text-indigo-600">
                            {story.key}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate" title={story.summary}>
                            <div className="flex items-center gap-2">
                              {story.summary}
                              {subtasks.length > 0 && (
                                <span className="text-xs text-slate-400 shrink-0">{subtasks.length} subtasks</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{story.type}</td>
                          <td className="px-4 py-3">
                            <PriorityBadge priority={story.priority} />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${getStatusClass(story.status)}`}>
                              {story.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{story.assignee}</td>
                          <td className="px-4 py-3 text-sm text-slate-700 font-medium tabular-nums">
                            {(story.estimateHours || 0) > 0 ? `${Math.round(story.estimateHours * 10) / 10}h` : <span className="text-slate-300">--</span>}
                          </td>
                          <td className="px-4 py-3 text-sm tabular-nums">
                            {(story.timeSpentHours || 0) > 0 ? (
                              <span className="text-emerald-600 font-medium">{Math.round(story.timeSpentHours * 10) / 10}h</span>
                            ) : (
                              <span className="text-slate-300">--</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium tabular-nums">
                            <span className={storyRemaining < 0 ? 'text-red-600' : 'text-slate-700'}>
                              {Math.round(storyRemaining * 10) / 10}h
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <ProgressBar spent={story.timeSpentHours || 0} remaining={story.estimateHours || 0} />
                          </td>
                        </tr>

                        {/* Subtask Rows */}
                        {isStoryExpanded && subtasks.map((st) => {
                          const stRemaining = (st.estimateHours || 0) - (st.timeSpentHours || 0);
                          return (
                            <tr key={st.key} className="bg-slate-50/40 hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-2 pl-14"></td>
                              <td className="px-4 py-2 text-xs font-mono text-slate-400">
                                {st.key}
                              </td>
                              <td className="px-4 py-2 text-xs text-slate-500 max-w-xs truncate" title={st.summary}>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-3 h-px bg-slate-300 shrink-0"></span>
                                  {st.summary}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-xs text-slate-400">{st.type}</td>
                              <td className="px-4 py-2">
                                <PriorityBadge priority={st.priority} />
                              </td>
                              <td className="px-4 py-2">
                                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${getStatusClass(st.status)}`}>
                                  {st.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-xs text-slate-500">{st.assignee}</td>
                              <td className="px-4 py-2 text-xs text-slate-500 tabular-nums">
                                {(st.estimateHours || 0) > 0 ? `${Math.round(st.estimateHours * 10) / 10}h` : <span className="text-slate-300">--</span>}
                              </td>
                              <td className="px-4 py-2 text-xs tabular-nums">
                                {(st.timeSpentHours || 0) > 0 ? (
                                  <span className="text-emerald-500">{Math.round(st.timeSpentHours * 10) / 10}h</span>
                                ) : (
                                  <span className="text-slate-300">--</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-xs tabular-nums">
                                <span className={stRemaining < 0 ? 'text-red-600' : 'text-slate-500'}>
                                  {Math.round(stRemaining * 10) / 10}h
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <ProgressBar spent={st.timeSpentHours || 0} remaining={st.estimateHours || 0} />
                              </td>
                            </tr>
                          );
                        })}
                      </StorySection>
                    );
                  })}
                </EpicSection>
              );
            })}
          </tbody>
          {/* Summary footer */}
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200">
              <td colSpan={7} className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">
                Totals (User Stories)
              </td>
              <td className="px-4 py-3 text-sm font-bold text-slate-800 tabular-nums">
                {Math.round(totals.totalEstimate * 10) / 10}h
              </td>
              <td className="px-4 py-3 text-sm font-bold text-emerald-600 tabular-nums">
                {Math.round(totals.totalSpent * 10) / 10}h
              </td>
              <td className="px-4 py-3 text-sm font-bold tabular-nums">
                <span className={(totals.totalEstimate - totals.totalSpent) < 0 ? 'text-red-600' : 'text-slate-800'}>
                  {Math.round((totals.totalEstimate - totals.totalSpent) * 10) / 10}h
                </span>
              </td>
              <td className="px-4 py-3">
                <ProgressBar spent={totals.totalSpent} remaining={totals.totalEstimate} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// Fragment wrappers for grouping rows
function EpicSection({ children }) {
  return <>{children}</>;
}

function StorySection({ children }) {
  return <>{children}</>;
}
