// LifeOS Habit Consistency Tracker Handler

const Habits = {
  habits: [],
  weekDates: [], // Stores ['YYYY-MM-DD', ...] for Mon-Sun of current week
  
  init() {
    this.habitForm = document.getElementById('habit-form');
    this.habitsList = document.getElementById('habits-list');
    this.dashHabitsList = document.getElementById('dash-habits-list');
    
    this.calculateWeekDates();
    this.renderHeaders();
    this.bindEvents();
  },

  bindEvents() {
    if (this.habitForm) {
      this.habitForm.addEventListener('submit', (e) => this.handleAddHabit(e));
    }
  },

  // Calculate Monday to Sunday dates of the current week in local timezone
  calculateWeekDates() {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
    
    // Calculate difference to Monday
    // If Sunday (0), we want to subtract 6 days. Otherwise, subtract (currentDay - 1)
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    this.weekDates = [];
    for (let i = 0; i < 7; i++) {
      const tempDate = new Date(monday);
      tempDate.setDate(monday.getDate() + i);
      
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, '0');
      const day = String(tempDate.getDate()).padStart(2, '0');
      
      this.weekDates.push(`${year}-${month}-${day}`);
    }
  },

  getTodayStr() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  renderHeaders() {
    const daysAbbrev = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const headerEl = document.getElementById(`day-hdr-${i}`);
      if (headerEl) {
        // e.g. "Mon 18"
        const dateObj = new Date(this.weekDates[i]);
        const dayNum = dateObj.getDate();
        headerEl.innerHTML = `<span>${daysAbbrev[i]}</span><br><small style="font-weight: 500; opacity: 0.6;">${dayNum}</small>`;
      }
    }
  },

  async loadHabits() {
    try {
      this.habits = await API.get('/habits');
      this.render();
    } catch (err) {
      console.error('Failed to load habits:', err);
    }
  },

  async handleAddHabit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('habit-name');
    const name = nameInput.value.trim();

    if (!name) return;

    try {
      const newHabit = await API.post('/habits', { name });
      this.habits.push(newHabit);
      nameInput.value = '';
      
      this.render();
      
      if (window.MainApp) window.MainApp.updateStats();
    } catch (err) {
      console.error('Failed to add habit:', err);
    }
  },

  async toggleHabitDate(id, targetDate) {
    const todayStr = this.getTodayStr();
    try {
      const updated = await API.put(`/habits/${id}/toggle`, { 
        date: targetDate, 
        today: todayStr 
      });
      this.habits = this.habits.map(h => h._id === id ? updated : h);
      this.render();
      
      if (window.MainApp) window.MainApp.updateStats();
    } catch (err) {
      console.error('Failed to toggle habit date:', err);
    }
  },

  async deleteHabit(id) {
    if (!confirm('Are you sure you want to stop tracking this habit?')) return;

    try {
      await API.delete(`/habits/${id}`);
      this.habits = this.habits.filter(h => h._id !== id);
      this.render();
      
      if (window.MainApp) window.MainApp.updateStats();
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  },

  render() {
    const todayStr = this.getTodayStr();

    // 1. Render Habits Weekly Tracker Grid
    if (this.habits.length === 0) {
      this.habitsList.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-repeat"></i>
          <span>No habits tracked. Start creating positive routines!</span>
        </div>
      `;
    } else {
      this.habitsList.innerHTML = this.habits.map(habit => {
        const isStreakActive = habit.streak > 0;
        
        // Generate bubbles Mon-Sun
        const bubblesHtml = this.weekDates.map(date => {
          const isCompleted = habit.history.includes(date);
          const isToday = date === todayStr;
          return `
            <button 
              class="habit-bubble-btn ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}" 
              data-date="${date}" 
              title="${date === todayStr ? 'Today' : date}"
            ></button>
          `;
        }).join('');

        return `
          <div class="habit-row" data-id="${habit._id}">
            <div class="habit-name-txt" title="${this.escapeHTML(habit.name)}">${this.escapeHTML(habit.name)}</div>
            <div class="habit-week-bubbles">
              ${bubblesHtml}
            </div>
            <div class="habit-streak-display ${isStreakActive ? 'active' : ''}">
              <i class="fa-solid fa-fire"></i> 
              <span>${habit.streak} ${habit.streak === 1 ? 'day' : 'days'}</span>
            </div>
            <div class="habit-col-action">
              <button class="task-action-btn delete-btn habit-col-action-btn-del" title="Delete Habit"><i class="fa-regular fa-trash-can"></i></button>
            </div>
          </div>
        `;
      }).join('');

      // Bind Grid bubble toggle events
      this.habitsList.querySelectorAll('.habit-bubble-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.closest('.habit-row').dataset.id;
          const date = e.target.dataset.date;
          this.toggleHabitDate(id, date);
        });
      });

      // Bind delete events
      this.habitsList.querySelectorAll('.habit-col-action-btn-del').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.closest('.habit-row').dataset.id;
          this.deleteHabit(id);
        });
      });
    }

    // 2. Render Dashboard Widget List
    if (this.habits.length === 0) {
      this.dashHabitsList.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-repeat"></i>
          <span>No habits tracked.</span>
        </div>
      `;
    } else {
      this.dashHabitsList.innerHTML = this.habits.map(habit => {
        const completedToday = habit.history.includes(todayStr);
        return `
          <div class="habit-summary-item" data-id="${habit._id}">
            <div class="habit-summary-left">
              <button class="habit-quick-check ${completedToday ? 'done' : ''}" title="Mark completed today">
                <i class="fa-solid fa-check"></i>
              </button>
              <span>${this.escapeHTML(habit.name)}</span>
            </div>
            <span class="habit-summary-streak"><i class="fa-solid fa-fire"></i> ${habit.streak}d</span>
          </div>
        `;
      }).join('');

      // Bind Dashboard Quick check
      this.dashHabitsList.querySelectorAll('.habit-quick-check').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.closest('.habit-summary-item').dataset.id;
          this.toggleHabitDate(id, todayStr);
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

window.Habits = Habits;
