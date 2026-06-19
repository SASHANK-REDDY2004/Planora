// LifeOS Daily Planner Handler — localStorage powered

const Planner = {
  tasks: [],
  currentFilter: 'all',
  searchQuery: '',

  _userId() {
    return LocalDB.Session.get()?.id;
  },

  init() {
    this.taskForm     = document.getElementById('task-form');
    this.tasksList    = document.getElementById('tasks-list');
    this.dashTasksList = document.getElementById('dash-tasks-list');
    
    this.searchBar    = document.getElementById('task-search');
    this.filterBtns   = document.querySelectorAll('.filter-btn');
    
    this.compCountEl  = document.getElementById('planner-completed-count');
    this.totalCountEl = document.getElementById('planner-total-count');
    this.progressRing = document.getElementById('planner-progress-ring');

    this.bindEvents();
  },

  bindEvents() {
    if (this.taskForm) {
      this.taskForm.addEventListener('submit', (e) => this.handleAddTask(e));
    }
    if (this.searchBar) {
      this.searchBar.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.render();
      });
    }
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.render();
      });
    });
  },

  loadTasks() {
    this.tasks = LocalDB.Tasks.getAll(this._userId());
    this.render();
  },

  handleAddTask(e) {
    e.preventDefault();
    const titleInput    = document.getElementById('task-title');
    const prioritySelect = document.getElementById('task-priority');
    const dueDateInput  = document.getElementById('task-due-date');

    const title    = titleInput.value.trim();
    const priority = prioritySelect.value;
    const dueDate  = dueDateInput.value;

    if (!title) return;

    const newTask = LocalDB.Tasks.create(this._userId(), { title, priority, dueDate });
    this.tasks.push(newTask);

    titleInput.value   = '';
    dueDateInput.value = '';
    prioritySelect.value = 'medium';

    this.render();
    if (window.MainApp) window.MainApp.updateStats();
  },

  toggleTask(id, completed) {
    const updated = LocalDB.Tasks.update(this._userId(), id, { completed });
    this.tasks = this.tasks.map(t => t._id === id ? updated : t);
    this.render();
    if (window.MainApp) window.MainApp.updateStats();
  },

  deleteTask(id) {
    LocalDB.Tasks.delete(this._userId(), id);
    this.tasks = this.tasks.filter(t => t._id !== id);
    this.render();
    if (window.MainApp) window.MainApp.updateStats();
  },

  editTaskTitle(id, oldTitle) {
    const newTitle = prompt('Edit task description:', oldTitle);
    if (newTitle === null) return;

    const trimmed = newTitle.trim();
    if (!trimmed) {
      this.deleteTask(id);
      return;
    }

    const updated = LocalDB.Tasks.update(this._userId(), id, { title: trimmed });
    this.tasks = this.tasks.map(t => t._id === id ? updated : t);
    this.render();
  },

  calculateStats() {
    const total     = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const percent   = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (this.compCountEl) this.compCountEl.textContent = completed;
    if (this.totalCountEl) this.totalCountEl.textContent = total;

    if (this.progressRing) {
      const circumference = 2 * Math.PI * 16;
      this.progressRing.style.strokeDashoffset = circumference - (percent / 100) * circumference;
    }

    return { total, completed, percent };
  },

  render() {
    this.calculateStats();

    let filtered = this.tasks.filter(task => {
      if (this.currentFilter === 'active'    && task.completed)  return false;
      if (this.currentFilter === 'completed' && !task.completed) return false;
      if (this.searchQuery && !task.title.toLowerCase().includes(this.searchQuery)) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const w = { high: 3, medium: 2, low: 1 };
      return w[b.priority] - w[a.priority];
    });

    if (filtered.length === 0) {
      this.tasksList.innerHTML = `
        <li class="empty-state">
          <i class="fa-regular fa-clipboard"></i>
          <span>No tasks found. ${this.searchQuery ? 'Try a different search.' : 'Add some tasks to begin!'}</span>
        </li>`;
    } else {
      this.tasksList.innerHTML = filtered.map(task => {
        const dateStr   = task.dueDate ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
        const prioEmoji = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
        return `
          <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task._id}">
            <div class="task-item-left">
              <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
              <div class="task-info">
                <span class="task-title-text">${this.escapeHTML(task.title)}</span>
                <div class="task-meta-row">
                  <span class="prio-badge prio-${task.priority}">${prioEmoji} ${task.priority}</span>
                  ${dateStr ? `<span class="task-due-badge"><i class="fa-regular fa-calendar"></i> ${dateStr}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="task-actions">
              <button class="task-action-btn edit-btn" title="Edit Task"><i class="fa-regular fa-pen-to-square"></i></button>
              <button class="task-action-btn delete-btn" title="Delete Task"><i class="fa-regular fa-trash-can"></i></button>
            </div>
          </li>`;
      }).join('');

      this.tasksList.querySelectorAll('.task-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const id = e.target.closest('.task-item').dataset.id;
          this.toggleTask(id, e.target.checked);
        });
      });
      this.tasksList.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const item  = e.target.closest('.task-item');
          const id    = item.dataset.id;
          const title = item.querySelector('.task-title-text').textContent;
          this.editTaskTitle(id, title);
        });
      });
      this.tasksList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.deleteTask(e.target.closest('.task-item').dataset.id);
        });
      });
    }

    // Dashboard Widget (max 4 pending tasks)
    const dashTasks = this.tasks.filter(t => !t.completed).slice(0, 4);
    if (dashTasks.length === 0) {
      this.dashTasksList.innerHTML = `
        <li class="empty-state">
          <i class="fa-solid fa-circle-check" style="color: var(--success-color); opacity: 1;"></i>
          <span>All caught up! No pending tasks.</span>
        </li>`;
    } else {
      this.dashTasksList.innerHTML = dashTasks.map(task => `
        <li class="task-summary-item" data-id="${task._id}">
          <div class="task-summary-left">
            <input type="checkbox" class="task-quick-check">
            <span>${this.escapeHTML(task.title)}</span>
          </div>
          <span class="prio-badge prio-${task.priority}">${task.priority}</span>
        </li>`).join('');

      this.dashTasksList.querySelectorAll('.task-quick-check').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const id = e.target.closest('.task-summary-item').dataset.id;
          this.toggleTask(id, e.target.checked);
        });
      });
    }
  },

  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

window.Planner = Planner;
