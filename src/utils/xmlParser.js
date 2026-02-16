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

    // Extract time estimate — only use Original Estimate (timeoriginalestimate)
    // Do NOT fall back to timeestimate (remaining estimate) or aggregate fields,
    // as Jira can auto-populate those even when no original estimate was set.
    const timeoriginalestimate = getText('timeoriginalestimate');

    let estimateHours = 0;
    const rawSeconds = parseInt(timeoriginalestimate) || 0;

    if (rawSeconds > 0) {
      estimateHours = rawSeconds / 3600;
    }

    // If no original estimate, check for explicit story points custom field
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
      epic: epic || parentKey || '',
      parentKey,
      subtaskKeys,
      labels,
      isCustomerRequest: detectCustomerRequest(labels, summary, type, epic),
    });
  });

  // Filter out parent tickets whose children are also in the dataset.
  // When children exist, the parent is just a container — counting both
  // would double-count hours and inflate all charts.
  const allKeys = new Set(tickets.map((t) => t.key).filter(Boolean));

  // Collect keys of tickets that are parents (have children present in dataset)
  const parentKeysInDataset = new Set();

  tickets.forEach((t) => {
    // Child references its parent via <parent> tag
    if (t.parentKey && allKeys.has(t.parentKey)) {
      parentKeysInDataset.add(t.parentKey);
    }
    // Parent lists its children via <subtasks> tag
    if (t.subtaskKeys.length > 0) {
      const hasChildInDataset = t.subtaskKeys.some((sk) => allKeys.has(sk));
      if (hasChildInDataset) {
        parentKeysInDataset.add(t.key);
      }
    }
  });

  // Return only leaf tickets (not parents with children in the dataset)
  return tickets.filter((t) => !parentKeysInDataset.has(t.key));
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
