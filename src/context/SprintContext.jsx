import { createContext, useContext, useReducer, useCallback } from 'react';
import { extractAssignees } from '../utils/xmlParser';

const SprintContext = createContext(null);

const initialState = {
  tickets: [],
  devs: [],
  isLoaded: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TICKETS': {
      const tickets = action.payload;
      const existingDevMap = new Map(state.devs.map((d) => [d.name, d]));
      const extractedDevs = extractAssignees(tickets);

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
        tickets,
        devs: [...mergedDevs, ...manualDevs],
        isLoaded: true,
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

    case 'UPDATE_TICKET':
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
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

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  // Derived data
  const totalCapacity = state.devs.reduce((sum, d) => sum + d.capacity, 0);
  const totalAssigned = state.tickets.reduce(
    (sum, t) => sum + t.estimateHours,
    0
  );
  const loadPercentage =
    totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0;

  const devLoadMap = new Map();
  state.devs.forEach((d) => devLoadMap.set(d.name, 0));
  state.tickets.forEach((t) => {
    if (devLoadMap.has(t.assignee)) {
      devLoadMap.set(t.assignee, devLoadMap.get(t.assignee) + t.estimateHours);
    }
  });

  const devLoads = state.devs.map((d) => ({
    ...d,
    assigned: devLoadMap.get(d.name) || 0,
    loadPercent:
      d.capacity > 0
        ? Math.round(((devLoadMap.get(d.name) || 0) / d.capacity) * 100)
        : 0,
  }));

  // Count overloaded devs
  const overloadedCount = devLoads.filter((d) => d.loadPercent > 100).length;

  // Tickets over capacity
  const ticketsByPriority = [...state.tickets].sort((a, b) => {
    const order = { Highest: 0, High: 1, Low: 2, Lowest: 3 };
    return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
  });

  let cumulative = 0;
  const atRiskTickets = [];
  ticketsByPriority.forEach((t) => {
    cumulative += t.estimateHours;
    if (cumulative > totalCapacity) {
      atRiskTickets.push(t);
    }
  });

  // Low priority ticket count for recommendation
  const lowPriorityCount = state.tickets.filter(
    (t) => t.priority === 'Low' || t.priority === 'Lowest'
  ).length;

  const value = {
    ...state,
    setTickets,
    addDev,
    updateDevCapacity,
    removeDev,
    updateTicket,
    reset,
    totalCapacity,
    totalAssigned,
    loadPercentage,
    devLoads,
    overloadedCount,
    atRiskTickets,
    lowPriorityCount,
    ticketsByPriority,
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
