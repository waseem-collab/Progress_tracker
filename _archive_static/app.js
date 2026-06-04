(() => {
  'use strict';

  const STORAGE_KEY = 'cs-task-manager.tasks.v1';
  const STATUSES = ['escalated', 'in-progress', 'completed', 'rejected'];
  const STATUS_LABEL = {
    escalated: 'Escalated to Team',
    'in-progress': 'In Progress',
    completed: 'Completed',
    rejected: 'Rejected',
  };

  /** @type {Array<Task>} */
  let tasks = load();
  let editingId = null;

  // -------- Storage --------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedExamples();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function seedExamples() {
    const today = new Date();
    const inDays = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    };
    return [
      {
        id: uid(),
        title: 'API rate limit increase request',
        client: 'Acme Corp',
        description: 'Customer hitting 429s during peak hours. Need infra team to bump quota from 1k → 5k rpm.',
        priority: 'high',
        status: 'escalated',
        dueDate: inDays(2),
        createdAt: Date.now() - 3 * 86400000,
        updatedAt: Date.now() - 3 * 86400000,
      },
      {
        id: uid(),
        title: 'SSO configuration walkthrough',
        client: 'Globex Inc',
        description: 'Schedule call with their IT lead to set up Okta integration.',
        priority: 'medium',
        status: 'in-progress',
        dueDate: inDays(5),
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
      },
      {
        id: uid(),
        title: 'Quarterly business review prep',
        client: 'Initech',
        description: 'Pulled usage metrics, drafted slides. Awaiting CSM sign-off.',
        priority: 'medium',
        status: 'completed',
        dueDate: inDays(-1),
        createdAt: Date.now() - 7 * 86400000,
        updatedAt: Date.now() - 86400000,
      },
    ];
  }

  function uid() {
    return 't_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  // -------- DOM refs --------
  const $ = (id) => document.getElementById(id);
  const board = $('board');
  const modal = $('modalBackdrop');
  const form = $('taskForm');
  const clientFilter = $('clientFilter');
  const priorityFilter = $('priorityFilter');
  const searchInput = $('searchInput');
  const toast = $('toast');

  // -------- Render --------
  function render() {
    renderStats();
    renderClientOptions();
    renderBoard();
  }

  function renderStats() {
    const counts = { escalated: 0, 'in-progress': 0, completed: 0, rejected: 0 };
    tasks.forEach((t) => (counts[t.status] = (counts[t.status] || 0) + 1));
    $('statTotal').textContent = tasks.length;
    $('statEscalated').textContent = counts.escalated;
    $('statProgress').textContent = counts['in-progress'];
    $('statCompleted').textContent = counts.completed;
    $('statRejected').textContent = counts.rejected;
    $('countEscalated').textContent = counts.escalated;
    $('countProgress').textContent = counts['in-progress'];
    $('countCompleted').textContent = counts.completed;
    $('countRejected').textContent = counts.rejected;
  }

  function renderClientOptions() {
    const clients = [...new Set(tasks.map((t) => t.client).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
    const prev = clientFilter.value;
    clientFilter.innerHTML =
      '<option value="">All clients</option>' +
      clients.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    if (clients.includes(prev)) clientFilter.value = prev;

    const datalist = $('clientList');
    datalist.innerHTML = clients.map((c) => `<option value="${escapeHtml(c)}">`).join('');
  }

  function renderBoard() {
    const clientQ = clientFilter.value;
    const priorityQ = priorityFilter.value;
    const search = searchInput.value.trim().toLowerCase();

    const visible = tasks.filter((t) => {
      if (clientQ && t.client !== clientQ) return false;
      if (priorityQ && t.priority !== priorityQ) return false;
      if (search) {
        const hay = `${t.title} ${t.description || ''} ${t.client}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

    STATUSES.forEach((status) => {
      const zone = board.querySelector(`[data-dropzone="${status}"]`);
      zone.innerHTML = '';
      const items = visible
        .filter((t) => t.status === status)
        .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || a.createdAt - b.createdAt);
      items.forEach((t) => zone.appendChild(cardEl(t)));
    });
  }

  function priorityRank(p) {
    return { high: 3, medium: 2, low: 1 }[p] || 0;
  }

  function cardEl(task) {
    const el = document.createElement('div');
    el.className = `card priority-${task.priority}`;
    el.draggable = true;
    el.dataset.id = task.id;

    const dueInfo = dueDateInfo(task.dueDate);

    el.innerHTML = `
      <div class="card-title">${escapeHtml(task.title)}</div>
      <span class="card-client">🏢 ${escapeHtml(task.client)}</span>
      ${task.description ? `<div class="card-desc">${escapeHtml(task.description)}</div>` : ''}
      <div class="card-meta">
        <span class="badge priority-${task.priority}">${task.priority}</span>
        ${dueInfo ? `<span class="due-date ${dueInfo.cls}">📅 ${dueInfo.text}</span>` : ''}
      </div>
    `;

    el.addEventListener('click', () => openModal(task.id));
    el.addEventListener('dragstart', (e) => {
      el.classList.add('dragging');
      e.dataTransfer.setData('text/plain', task.id);
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));

    return el;
  }

  function dueDateInfo(dateStr) {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.round((due - today) / 86400000);
    let cls = '';
    let text = formatDate(due);
    if (diffDays < 0) {
      cls = 'overdue';
      text = `Overdue · ${formatDate(due)}`;
    } else if (diffDays === 0) {
      cls = 'soon';
      text = 'Due today';
    } else if (diffDays <= 2) {
      cls = 'soon';
      text = `Due in ${diffDays}d`;
    }
    return { cls, text };
  }

  function formatDate(d) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // -------- Drag and drop --------
  STATUSES.forEach((status) => {
    const zone = board.querySelector(`[data-dropzone="${status}"]`);
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', (e) => {
      if (e.target === zone) zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      if (!id) return;
      moveTask(id, status);
    });
  });

  function moveTask(id, newStatus) {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === newStatus) return;
    task.status = newStatus;
    task.updatedAt = Date.now();
    save();
    render();
    showToast(`Moved to "${STATUS_LABEL[newStatus]}"`);
  }

  // -------- Modal --------
  function openModal(taskId) {
    editingId = taskId || null;
    const task = taskId ? tasks.find((t) => t.id === taskId) : null;
    $('modalTitle').textContent = task ? 'Edit Task' : 'New Task';
    $('taskId').value = task?.id || '';
    $('taskTitle').value = task?.title || '';
    $('taskClient').value = task?.client || '';
    $('taskPriority').value = task?.priority || 'medium';
    $('taskStatus').value = task?.status || 'escalated';
    $('taskDueDate').value = task?.dueDate || '';
    $('taskDescription').value = task?.description || '';
    $('modalDeleteBtn').hidden = !task;
    modal.hidden = false;
    setTimeout(() => $('taskTitle').focus(), 50);
  }

  function closeModal() {
    modal.hidden = true;
    editingId = null;
    form.reset();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('taskTitle').value.trim();
    const client = $('taskClient').value.trim();
    if (!title || !client) return;

    const data = {
      title,
      client,
      description: $('taskDescription').value.trim(),
      priority: $('taskPriority').value,
      status: $('taskStatus').value,
      dueDate: $('taskDueDate').value || null,
    };

    if (editingId) {
      const t = tasks.find((x) => x.id === editingId);
      Object.assign(t, data, { updatedAt: Date.now() });
      showToast('Task updated');
    } else {
      tasks.push({ id: uid(), ...data, createdAt: Date.now(), updatedAt: Date.now() });
      showToast('Task created');
    }
    save();
    render();
    closeModal();
  });

  $('modalDeleteBtn').addEventListener('click', () => {
    if (!editingId) return;
    if (!confirm('Delete this task? This cannot be undone.')) return;
    tasks = tasks.filter((t) => t.id !== editingId);
    save();
    render();
    closeModal();
    showToast('Task deleted');
  });

  $('modalCloseBtn').addEventListener('click', closeModal);
  $('modalCancelBtn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  // -------- Topbar / filters --------
  $('newTaskBtn').addEventListener('click', () => openModal(null));
  clientFilter.addEventListener('change', renderBoard);
  priorityFilter.addEventListener('change', renderBoard);
  searchInput.addEventListener('input', renderBoard);
  $('clearFiltersBtn').addEventListener('click', () => {
    clientFilter.value = '';
    priorityFilter.value = '';
    searchInput.value = '';
    renderBoard();
  });

  // -------- Import / Export --------
  $('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `cs-tasks-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported tasks');
  });

  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid file format');
      if (!confirm(`Import ${data.length} tasks? This will replace your current data.`)) return;
      tasks = data;
      save();
      render();
      showToast(`Imported ${data.length} tasks`);
    } catch (err) {
      alert('Could not import file: ' + err.message);
    } finally {
      e.target.value = '';
    }
  });

  // -------- Utils --------
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), 2200);
  }

  // -------- Init --------
  save();
  render();
})();
