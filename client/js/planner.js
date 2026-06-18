// LifeOS Daily Planner Handler

const Planner = {
  tasks: [],
  currentFilter: 'all',
  searchQuery: '',

  init() {
    this.taskForm = document.getElementById('task-form');
    this.tasksList = document.getElementById('tasks-list');
    this.dashTasksList = document.getElementById('dash-tasks-list');
    
    this.searchBar = document.getElementById('task-search');
    this.filterBtns = document.querySelectorAll('.filter-btn');
    
    this.compCountEl = document.getElementById('planner-completed-count');
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

  async loadTasks() {
    try {
      this.tasks = await API.get('/tasks');
      this.render();
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  },

  async handleAddTask(e) {
    e.preventDefault();
    const titleInput = document.getElementById('task-title');
    const prioritySelect = document.getElementById('task-priority');
    const dueDateInput = document.getElementById('task-due-date');

    const title = titleInput.value.trim();
    const priority = prioritySelect.value;
    const dueDate = dueDateInput.value;

    if (!title) return;

    try {
      const newTask = await API.post('/tasks', { title, priority, dueDate });
      this.tasks.push(newTask);
      titleInput.value = '';
      dueDateInput.value = '';
      prioritySelect.value = 'medium';
      
      this.render();
      
      // Update general app dashboard stats
      if (window.MainApp) window.MainApp.updateStats();
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  },

  async toggleTask(id, completed) {
    try {
      const updated = await API.put(`/tasks/${id}`, { completed });
      this.tasks = this.tasks.map(t => t._id === id ? updated : t);
      this.render();
      
      if (window.MainApp) window.MainApp.updateStats();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  },

  async deleteTask(id) {
    try {
      await API.delete(`/tasks/${id}`);
      this.tasks = this.tasks.filter(t => t._id !== id);
      this.render();
      
      if (window.MainApp) window.MainApp.updateStats();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  },

  async editTaskTitle(id, oldTitle) {
    const newTitle = prompt('Edit task description:', oldTitle);
    if (newTitle === null) return; // Cancelled
    
    const trimmed = newTitle.trim();
    if (!trimmed) {
      this.deleteTask(id);
      return;
    }

    try {
      const updated = await API.put(`/tasks/${id}`, { title: trimmed });
      this.tasks = this.tasks.map(t => t._id === id ? updated : t);
      this.render();
    } catch (err) {
      console.error('Failed to edit task title:', err);
    }
  },

  calculateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update values
    if (this.compCountEl) this.compCountEl.textContent = completed;
    if (this.totalCountEl) this.totalCountEl.textContent = total;

    // Update progress ring stroke-dashoffset (total length is 100.53)
    if (this.progressRing) {
      const radius = 16;
      const circumference = 2 * Math.PI * radius; // 100.53
      const offset = circumference - (percent / 100) * circumference;
      this.progressRing.style.strokeDashoffset = offset;
    }

    return { total, completed, percent };
  },

  render() {
    // 1. Calculate and update stats
    this.calculateStats();

    // 2. Render Main Planner List
    let filtered = this.tasks.filter(task => {
      // Filter tab check
      if (this.currentFilter === 'active' && task.completed) return false;
      if (this.currentFilter === 'completed' && !task.completed) return false;
      
      // Search check
      if (this.searchQuery && !task.title.toLowerCase().includes(this.searchQuery)) return false;
      
      return true;
    });

    // Sort by: Incomplete first, then priority (high -> medium -> low)
    filtered.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });

    if (filtered.length === 0) {
      this.tasksList.innerHTML = `
        <li class="empty-state">
          <i class="fa-regular fa-clipboard"></i>
          <span>No tasks found. ${this.searchQuery ? 'Try a different search query.' : 'Add some tasks to begin!'}</span>
        </li>
      `;
    } else {
      this.tasksList.innerHTML = filtered.map(task => {
        const dateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : '';
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
          </li>
        `;
      }).join('');

      // Bind dynamic events
      this.tasksList.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const id = e.target.closest('.task-item').dataset.id;
          this.toggleTask(id, e.target.checked);
        });
      });

      this.tasksList.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const item = e.target.closest('.task-item');
          const id = item.dataset.id;
          const title = item.querySelector('.task-title-text').textContent;
          this.editTaskTitle(id, title);
        });
      });

      this.tasksList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.closest('.task-item').dataset.id;
          this.deleteTask(id);
        });
      });
    }

    // 3. Render Dashboard Widget List (max 4 incomplete tasks)
    const dashTasks = this.tasks.filter(t => !t.completed).slice(0, 4);
    if (dashTasks.length === 0) {
      this.dashTasksList.innerHTML = `
        <li class="empty-state">
          <i class="fa-solid fa-circle-check" style="color: var(--success-color); opacity: 1;"></i>
          <span>All caught up! No pending tasks.</span>
        </li>
      `;
    } else {
      this.dashTasksList.innerHTML = dashTasks.map(task => `
        <li class="task-summary-item" data-id="${task._id}">
          <div class="task-summary-left">
            <input type="checkbox" class="task-quick-check">
            <span>${this.escapeHTML(task.title)}</span>
          </div>
          <span class="prio-badge prio-${task.priority}">${task.priority}</span>
        </li>
      `).join('');

      // Bind Quick Checks
      this.dashTasksList.querySelectorAll('.task-quick-check').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
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
