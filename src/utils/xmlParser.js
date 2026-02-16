/**
 * Parse XML ticket data (Jira-like RSS export) into structured ticket objects.
 */
export function parseXML(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML: ' + parseError.textContent.slice(0, 200));
  }

  const items = doc.querySelectorAll('item');
  const tickets = [];

  items.forEach((item) => {
    const getText = (tag) => {
      const el = item.querySelector(tag);
      return el ? el.textContent.trim() : '';
    };

    const getAttr = (tag, attr) => {
      const el = item.querySelector(tag);
      return el ? el.getAttribute(attr) || '' : '';
    };

    const key = getText('key');
    const summary = getText('summary');
    const type = getText('type');
    const priority = getText('priority');
    const status = getText('status');
    const assignee = getText('assignee');
    const reporter = getText('reporter');
    const created = getText('created');
    const updated = getText('updated');
    const description = getText('description');

    // Extract time fields from Jira XML — only timeestimate and timespent.
    // Values are in the "seconds" attribute (e.g. <timeestimate seconds="1200">20 min</timeestimate>).
    const getSeconds = (tag) => {
      const el = item.querySelector(tag);
      if (!el) return 0;
      const fromAttr = parseInt(el.getAttribute('seconds')) || 0;
      if (fromAttr > 0) return fromAttr;
      return parseInt(el.textContent) || 0;
    };

    const rawEstimate = getSeconds('timeestimate');
    let estimateHours = rawEstimate > 0 ? rawEstimate / 3600 : 0;

    const rawSpent = getSeconds('timespent');
    const timeSpentHours = rawSpent > 0 ? rawSpent / 3600 : 0;

    // If no estimate from time fields, check for explicit story points custom field
    if (estimateHours === 0) {
      const customFields = item.querySelectorAll('customfield');
      customFields.forEach((cf) => {
        const cfName = cf.querySelector('customfieldname');
        if (cfName) {
          const name = cfName.textContent.toLowerCase();
          if (name.includes('story points')) {
            const vals = cf.querySelectorAll('customfieldvalue');
            vals.forEach((v) => {
              const num = parseFloat(v.textContent);
              if (!isNaN(num) && num > 0) {
                estimateHours = num;
              }
            });
          }
        }
      });
    }

    // Leave as 0 if no estimate found — do not invent a default

    // Extract parent key (for hierarchy detection)
    const parentKey = getText('parent');

    // Extract epic from custom fields
    let epic = '';
    const customFields = item.querySelectorAll('customfield');
    customFields.forEach((cf) => {
      const cfName = cf.querySelector('customfieldname');
      if (cfName) {
        const name = cfName.textContent.toLowerCase();
        if (name.includes('epic')) {
          const vals = cf.querySelectorAll('customfieldvalue');
          vals.forEach((v) => {
            if (v.textContent.trim()) epic = v.textContent.trim();
          });
        }
      }
    });

    // Extract subtask keys (for hierarchy detection from parent side)
    const subtaskKeys = [];
    const subtaskEls = item.querySelectorAll('subtask');
    subtaskEls.forEach((st) => {
      const stKey = st.textContent.trim();
      if (stKey) subtaskKeys.push(stKey);
    });

    // Extract labels
    const labels = [];
    const labelEls = item.querySelectorAll('label');
    labelEls.forEach((l) => labels.push(l.textContent.trim()));

    tickets.push({
      id: key || `TICKET-${tickets.length + 1}`,
      key,
      summary,
      type,
      priority: normalizePriority(priority),
      priorityRaw: priority,
      status,
      assignee: assignee || 'Unassigned',
      reporter,
      created,
      updated,
      description,
      estimateHours,
      timeSpentHours,
      epic: epic || parentKey || '',
      parentKey,
      subtaskKeys,
      labels,
      isCustomerRequest: detectCustomerRequest(labels, summary, type, epic),
    });
  });

  // Keep all tickets for hierarchy display
  return tickets;
}

/**
 * Parse plain-text ticket input. Expected formats:
 * - Tab/comma separated: KEY, Summary, Priority, Assignee, Hours, Epic
 * - Or simpler: one ticket per line with key details
 */
export function parseText(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const tickets = [];

  for (const line of lines) {
    // Try tab-separated first, then comma
    let parts = line.split('\t');
    if (parts.length < 3) parts = line.split(',').map((p) => p.trim());

    if (parts.length >= 4) {
      const [key, summary, priority, assignee, hours, epic] = parts;
      tickets.push({
        id: key || `TICKET-${tickets.length + 1}`,
        key: key || '',
        summary: summary || '',
        type: 'Task',
        priority: normalizePriority(priority || 'Medium'),
        priorityRaw: priority || 'Medium',
        status: 'Open',
        assignee: assignee || 'Unassigned',
        reporter: '',
        created: '',
        updated: '',
        description: '',
        estimateHours: parseFloat(hours) || 0,
        timeSpentHours: 0,
        epic: epic || '',
        parentKey: '',
        subtaskKeys: [],
        labels: [],
        isCustomerRequest: false,
      });
    } else if (parts.length >= 2) {
      // Minimal: key, summary
      tickets.push({
        id: parts[0] || `TICKET-${tickets.length + 1}`,
        key: parts[0] || '',
        summary: parts[1] || '',
        type: 'Task',
        priority: normalizePriority(parts[2] || 'Medium'),
        priorityRaw: parts[2] || 'Medium',
        status: 'Open',
        assignee: 'Unassigned',
        reporter: '',
        created: '',
        updated: '',
        description: '',
        estimateHours: 0,
        timeSpentHours: 0,
        epic: '',
        parentKey: '',
        subtaskKeys: [],
        labels: [],
        isCustomerRequest: false,
      });
    }
  }

  return tickets;
}

function normalizePriority(raw) {
  const p = (raw || '').toLowerCase();
  if (p.includes('highest') || p.includes('critical') || p.includes('blocker'))
    return 'Highest';
  if (p.includes('high') || p.includes('major')) return 'High';
  if (p.includes('medium') || p.includes('normal')) return 'High'; // treat medium as committed
  if (p.includes('low') || p.includes('minor')) return 'Low';
  if (p.includes('lowest') || p.includes('trivial')) return 'Lowest';
  return 'High'; // default
}

function detectCustomerRequest(labels, summary, type, epic) {
  const text = [...labels, summary, type, epic].join(' ').toLowerCase();
  return (
    text.includes('customer') ||
    text.includes('client') ||
    text.includes('request') ||
    text.includes('support') ||
    text.includes('external')
  );
}

/**
 * Extract unique assignees from tickets
 */
export function extractAssignees(tickets) {
  const assigneeMap = new Map();
  tickets.forEach((t) => {
    if (t.assignee && t.assignee !== 'Unassigned') {
      if (!assigneeMap.has(t.assignee)) {
        assigneeMap.set(t.assignee, { name: t.assignee, capacity: 40 });
      }
    }
  });
  return Array.from(assigneeMap.values());
}

export function getPriorityLabel(priority) {
  switch (priority) {
    case 'Highest':
      return 'Do Now';
    case 'High':
      return 'This Sprint';
    case 'Low':
      return 'Nice to Have';
    case 'Lowest':
      return 'Backlog/Ignore';
    default:
      return priority;
  }
}

export function getPriorityColor(priority) {
  switch (priority) {
    case 'Highest':
      return '#ef4444';
    case 'High':
      return '#f59e0b';
    case 'Low':
      return '#3b82f6';
    case 'Lowest':
      return '#94a3b8';
    default:
      return '#64748b';
  }
}

export function getPriorityValue(priority) {
  switch (priority) {
    case 'Highest':
      return 4;
    case 'High':
      return 3;
    case 'Low':
      return 2;
    case 'Lowest':
      return 1;
    default:
      return 0;
  }
}

/**
 * Detect ticket hierarchy level based on type and key format
 * Epic: name only (never IT-###)
 * User Story: IT-### format, type contains "story"
 * Sub Task: IT-### format, has parentKey, type contains "sub"
 */
export function getTicketLevel(ticket) {
  const typeLC = (ticket.type || '').toLowerCase();
  const hasITKey = /^[A-Z]+-\d+$/.test(ticket.key);

  // Epic: has epic name and is not an IT key, OR type is Epic
  if (typeLC.includes('epic') || (!hasITKey && ticket.epic)) {
    return 'epic';
  }

  // Sub Task: has parent and type indicates subtask
  if (ticket.parentKey && (typeLC.includes('sub-task') || typeLC.includes('subtask'))) {
    return 'subtask';
  }

  // User Story: has IT key and type is story, or has subtasks
  if (hasITKey && (typeLC.includes('story') || ticket.subtaskKeys.length > 0)) {
    return 'story';
  }

  // Default: if has parent, it's a subtask; otherwise it's a story
  return ticket.parentKey ? 'subtask' : 'story';
}

/**
 * Build hierarchy structure and aggregate subtask data to user stories.
 * Returns object with:
 * - allTickets: original tickets with hierarchy info
 * - userStories: aggregated user story data (for charts)
 * - hierarchy: structured tree of epics > stories > subtasks
 */
export function buildHierarchy(tickets) {
  // Add hierarchy level to each ticket
  const enrichedTickets = tickets.map(t => ({
    ...t,
    level: getTicketLevel(t),
  }));

  // Create maps for quick lookup
  const ticketMap = new Map(enrichedTickets.map(t => [t.key, t]));
  const epicMap = new Map(); // epic name -> tickets
  const storyMap = new Map(); // story key -> story with subtasks

  // Group tickets by epic
  enrichedTickets.forEach(t => {
    const epicName = t.epic || 'No Epic';
    if (!epicMap.has(epicName)) {
      epicMap.set(epicName, []);
    }
    epicMap.get(epicName).push(t);
  });

  // Build story map with aggregated subtask data
  enrichedTickets.forEach(t => {
    if (t.level === 'story') {
      const subtasks = t.subtaskKeys
        .map(sk => ticketMap.get(sk))
        .filter(Boolean);

      // Aggregate subtask data to the story
      let aggregatedEstimate = t.estimateHours || 0;
      let aggregatedSpent = t.timeSpentHours || 0;

      if (subtasks.length > 0) {
        // If story has subtasks, use aggregated data from subtasks
        aggregatedEstimate = subtasks.reduce((sum, st) => sum + (st.estimateHours || 0), 0);
        aggregatedSpent = subtasks.reduce((sum, st) => sum + (st.timeSpentHours || 0), 0);
      }

      storyMap.set(t.key, {
        ...t,
        subtasks,
        originalEstimateHours: t.estimateHours,
        originalTimeSpentHours: t.timeSpentHours,
        estimateHours: aggregatedEstimate,
        timeSpentHours: aggregatedSpent,
        hasSubtasks: subtasks.length > 0,
      });
    }
  });

  // Build hierarchy structure
  const hierarchy = [];
  epicMap.forEach((epicTickets, epicName) => {
    const stories = epicTickets.filter(t => t.level === 'story');
    const epicNode = {
      name: epicName,
      stories: stories.map(s => storyMap.get(s.key) || s),
    };
    hierarchy.push(epicNode);
  });

  // Return aggregated user stories for charts (only story-level tickets)
  const userStories = Array.from(storyMap.values());

  return {
    allTickets: enrichedTickets,
    userStories,
    hierarchy,
  };
}
