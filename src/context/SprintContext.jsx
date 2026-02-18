import { createContext, useContext, useReducer, useCallback } from 'react';
import { extractAssignees, buildHierarchy } from '../utils/xmlParser';

const SprintContext = createContext(null);

const initialState = {
  tickets: [], // All tickets (for table display)
  userStories: [], // Aggregated user stories (for charts)
  hierarchy: [], // Structured hierarchy tree
  devs: [],
  isLoaded: false,
  // Previous sprint data — stored for upcoming features, not used in charts/displays
  previousSprintTickets: [],
  previousSprintUserStories: [],
  previousSprintHierarchy: [],
  isPreviousSprintLoaded: false,
  originalSprintCapacity: null, // manually entered: total team hours for the full sprint
  remainingSprintCapacity: null, // manually entered: team hours left from today to sprint end
  executiveSummary: {
    sprintGoal: '',
    sprintStartDate: '',
    sprintEndDate: '',
    confidenceLevel: '', // 'green' | 'yellow' | 'red'
    keyRisks: '',
    deliveryForecast: '', // 'on-track' | 'at-risk' | 'needs-attention'
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TICKETS': {
      const rawTickets = action.payload;

      // Build hierarchy and get aggregated user stories
      const { allTickets, userStories, hierarchy } = buildHierarchy(rawTickets);

      // Extract assignees from all tickets (including subtasks for accurate dev tracking)
      const existingDevMap = new Map(state.devs.map((d) => [d.name, d]));
      const extractedDevs = extractAssignees(allTickets);

      // Merge: keep existing capacity overrides, add new devs
      const mergedDevs = extractedDevs.map((d) => ({
        ...d,
        capacity: existingDevMap.has(d.name)
          ? existingDevMap.get(d.name).capacity
          : 40,
      }));

      // Keep manually-added devs that aren't in tickets
      const manualDevs = state.devs.filter(
        (d) => d.manual && !extractedDevs.find((ed) => ed.name === d.name)
      );

      return {
        ...state,
        tickets: allTickets,
        userStories,
        hierarchy,
        devs: [...mergedDevs, ...manualDevs],
        isLoaded: true,
      };
    }

    case 'SET_PREVIOUS_SPRINT_TICKETS': {
      const rawTickets = action.payload;
      const { allTickets, userStories, hierarchy } = buildHierarchy(rawTickets);

      return {
        ...state,
        previousSprintTickets: allTickets,
        previousSprintUserStories: userStories,
        previousSprintHierarchy: hierarchy,
        isPreviousSprintLoaded: true,
      };
    }

    case 'ADD_DEV':
      if (state.devs.find((d) => d.name === action.payload.name)) {
        return state;
      }
      return {
        ...state,
        devs: [
          ...state.devs,
          { ...action.payload, capacity: action.payload.capacity || 40, manual: true },
        ],
      };

    case 'UPDATE_DEV_CAPACITY':
      return {
        ...state,
        devs: state.devs.map((d) =>
          d.name === action.payload.name
            ? { ...d, capacity: action.payload.capacity }
            : d
        ),
      };

    case 'REMOVE_DEV':
      return {
        ...state,
        devs: state.devs.filter((d) => d.name !== action.payload),
      };

    case 'UPDATE_TICKET': {
      // Update ticket in allTickets
      const updatedTickets = state.tickets.map((t) =>
        t.id === action.payload.id ? { ...t, ...action.payload } : t
      );

      // Rebuild hierarchy with updated data
      const { allTickets, userStories, hierarchy } = buildHierarchy(updatedTickets);

      return {
        ...state,
        tickets: allTickets,
        userStories,
        hierarchy,
      };
    }

    case 'UPDATE_TICKET_ASSIGNEE': {
      const { ticketId, newAssignee } = action.payload;

      // Update assignee on the raw ticket
      const updatedTickets = state.tickets.map((t) =>
        t.id === ticketId ? { ...t, assignee: newAssignee } : t
      );

      // Rebuild hierarchy with updated data
      const { allTickets: updAllTickets, userStories: updUserStories, hierarchy: updHierarchy } =
        buildHierarchy(updatedTickets);

      // Re-extract assignees to include any new assignee
      const existingDevMap = new Map(state.devs.map((d) => [d.name, d]));
      const extractedDevs = extractAssignees(updAllTickets);
      const mergedDevs = extractedDevs.map((d) => ({
        ...d,
        capacity: existingDevMap.has(d.name)
          ? existingDevMap.get(d.name).capacity
          : 40,
      }));
      const manualDevs = state.devs.filter(
        (d) => d.manual && !extractedDevs.find((ed) => ed.name === d.name)
      );

      return {
        ...state,
        tickets: updAllTickets,
        userStories: updUserStories,
        hierarchy: updHierarchy,
        devs: [...mergedDevs, ...manualDevs],
      };
    }

    case 'UPDATE_EXECUTIVE_SUMMARY':
      return {
        ...state,
        executiveSummary: { ...state.executiveSummary, ...action.payload },
      };

    case 'SET_SPRINT_CAPACITY':
      return {
        ...state,
        originalSprintCapacity: action.payload.originalSprintCapacity,
        remainingSprintCapacity: action.payload.remainingSprintCapacity,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export function SprintProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setTickets = useCallback(
    (tickets) => dispatch({ type: 'SET_TICKETS', payload: tickets }),
    []
  );

  const addDev = useCallback(
    (dev) => dispatch({ type: 'ADD_DEV', payload: dev }),
    []
  );

  const updateDevCapacity = useCallback(
    (name, capacity) =>
      dispatch({ type: 'UPDATE_DEV_CAPACITY', payload: { name, capacity } }),
    []
  );

  const removeDev = useCallback(
    (name) => dispatch({ type: 'REMOVE_DEV', payload: name }),
    []
  );

  const updateTicket = useCallback(
    (ticket) => dispatch({ type: 'UPDATE_TICKET', payload: ticket }),
    []
  );

  const updateTicketAssignee = useCallback(
    (ticketId, newAssignee) =>
      dispatch({ type: 'UPDATE_TICKET_ASSIGNEE', payload: { ticketId, newAssignee } }),
    []
  );

  const setPreviousSprintTickets = useCallback(
    (tickets) => dispatch({ type: 'SET_PREVIOUS_SPRINT_TICKETS', payload: tickets }),
    []
  );
  const updateExecutiveSummary = useCallback(
    (fields) => dispatch({ type: 'UPDATE_EXECUTIVE_SUMMARY', payload: fields }),
    []
  );

  const setSprintCapacity = useCallback(
    (original, remaining) =>
      dispatch({
        type: 'SET_SPRINT_CAPACITY',
        payload: { originalSprintCapacity: original, remainingSprintCapacity: remaining },
      }),
    []
  );

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  // Derived data - use userStories (aggregated) for all calculations
  const totalCapacity = state.devs.reduce((sum, d) => sum + d.capacity, 0);
  const totalAssigned = state.userStories.reduce(
    (sum, t) => sum + t.estimateHours,
    0
  );
  const totalTimeSpent = state.userStories.reduce(
    (sum, t) => sum + (t.timeSpentHours || 0),
    0
  );
  // totalAssigned = remaining estimate, totalWork = spent + remaining
  const totalWork = totalTimeSpent + totalAssigned;
  const loadPercentage =
    totalCapacity > 0 ? Math.round((totalWork / totalCapacity) * 100) : 0;
  const sprintProgress =
    totalWork > 0 ? Math.round((totalTimeSpent / totalWork) * 100) : 0;

  const devLoadMap = new Map(); // remaining estimate per dev
  const devSpentMap = new Map(); // time spent per dev
  const devOriginalEstimateMap = new Map(); // original estimate per dev
  state.devs.forEach((d) => {
    devLoadMap.set(d.name, 0);
    devSpentMap.set(d.name, 0);
    devOriginalEstimateMap.set(d.name, 0);
  });
  // Use subtask-level data for capacity attribution when subtasks exist.
  // This ensures that if multiple devs share work on a user story via subtasks,
  // each dev's capacity reflects their actual subtask assignments.
  state.userStories.forEach((story) => {
    if (story.hasSubtasks && story.subtasks && story.subtasks.length > 0) {
      story.subtasks.forEach((subtask) => {
        if (devLoadMap.has(subtask.assignee)) {
          devLoadMap.set(subtask.assignee, devLoadMap.get(subtask.assignee) + (subtask.estimateHours || 0));
          devSpentMap.set(subtask.assignee, devSpentMap.get(subtask.assignee) + (subtask.timeSpentHours || 0));
          devOriginalEstimateMap.set(subtask.assignee, devOriginalEstimateMap.get(subtask.assignee) + (subtask.originalEstimateHours || subtask.estimateHours || 0));
        }
      });
    } else {
      if (devLoadMap.has(story.assignee)) {
        devLoadMap.set(story.assignee, devLoadMap.get(story.assignee) + story.estimateHours);
        devSpentMap.set(story.assignee, devSpentMap.get(story.assignee) + (story.timeSpentHours || 0));
        devOriginalEstimateMap.set(story.assignee, devOriginalEstimateMap.get(story.assignee) + (story.originalEstimateHours || story.estimateHours || 0));
      }
    }
  });

  const devLoads = state.devs.map((d) => {
    const remaining = devLoadMap.get(d.name) || 0;
    const spent = devSpentMap.get(d.name) || 0;
    const originalEstimate = devOriginalEstimateMap.get(d.name) || 0;
    const total = spent + remaining;
    return {
      ...d,
      assigned: total,
      spent,
      remaining,
      originalEstimate,
      loadPercent:
        d.capacity > 0 ? Math.round((total / d.capacity) * 100) : 0,
    };
  });

  // Count overloaded devs
  const overloadedCount = devLoads.filter((d) => d.loadPercent > 100).length;

  // Ticket type hierarchy: higher-tier types are prioritized first
  const typeHierarchy = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('bug') || t.includes('blocker')) return 0;
    if (t.includes('story')) return 1;
    if (t.includes('task')) return 2;
    if (t.includes('sub-task') || t.includes('subtask')) return 3;
    if (t.includes('spike') || t.includes('research')) return 4;
    return 2; // default to task level
  };

  // Sort by priority first, then by type hierarchy within the same priority
  // Use userStories for priority calculations
  const ticketsByPriority = [...state.userStories].sort((a, b) => {
    const priorityOrder = { Highest: 0, High: 1, Low: 2, Lowest: 3 };
    const pDiff = (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
    if (pDiff !== 0) return pDiff;
    return typeHierarchy(a.type) - typeHierarchy(b.type);
  });

  let cumulative = 0;
  const atRiskTickets = [];
  ticketsByPriority.forEach((t) => {
    const ticketWork = (t.timeSpentHours || 0) + t.estimateHours;
    cumulative += ticketWork;
    if (cumulative > totalCapacity) {
      atRiskTickets.push(t);
    }
  });

  // Low priority ticket count for recommendation
  const lowPriorityCount = state.userStories.filter(
    (t) => t.priority === 'Low' || t.priority === 'Lowest'
  ).length;

  const value = {
    ...state,
    setTickets,
    setPreviousSprintTickets,
    addDev,
    updateDevCapacity,
    removeDev,
    updateTicket,
    updateTicketAssignee,
    updateExecutiveSummary,
    setSprintCapacity,
    reset,
    totalCapacity,
    originalSprintCapacity: state.originalSprintCapacity,
    remainingSprintCapacity: state.remainingSprintCapacity,
    totalAssigned,
    totalTimeSpent,
    totalWork,
    loadPercentage,
    sprintProgress,
    devLoads,
    overloadedCount,
    atRiskTickets,
    lowPriorityCount,
    ticketsByPriority,
    // Expose both tickets (for table) and userStories (for charts)
    allTickets: state.tickets,
    userStories: state.userStories,
    hierarchy: state.hierarchy,
    executiveSummary: state.executiveSummary,
  };

  return (
    <SprintContext.Provider value={value}>{children}</SprintContext.Provider>
  );
}

export function useSprint() {
  const ctx = useContext(SprintContext);
  if (!ctx) throw new Error('useSprint must be used within SprintProvider');
  return ctx;
}
