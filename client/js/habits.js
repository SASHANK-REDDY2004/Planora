// LifeOS Habit Consistency Tracker — localStorage powered

const Habits = {
  habits: [],
  weekDates: [],

  _userId() {
    return LocalDB.Session.get()?.id;
  },

  init() {
    this.habitForm     = document.getElementById('habit-form');
    this.habitsList    = document.getElementById('habits-list');
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

  calculateWeekDates() {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    this.weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const year  = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day   = String(d.getDate()).padStart(2, '0');
      this.weekDates.push(`${year}-${month}-${day}`);
    }
  },

  getTodayStr() {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day   = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  renderHeaders() {
    const daysAbbrev = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const el = document.getElementById(`day-hdr-${i}`);
      if (el) {
        const dateObj = new Date(this.weekDates[i] + 'T00:00:00');
        el.innerHTML = `<span>${daysAbbrev[i]}</span><br><small style="font-weight:500;opacity:0.6;">${dateObj.getDate()}</small>`;
      }
    }
  },

  loadHabits() {
    this.habits = LocalDB.Habits.getAll(this._userId());
    this.render();
  },

  handleAddHabit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('habit-name');
    const name = nameInput.value.trim();
    if (!name) return;

    const newHabit = LocalDB.Habits.create(this._userId(), { name });
    this.habits.push(newHabit);
    nameInput.value = '';

    this.render();
    if (window.MainApp) window.MainApp.updateStats();
  },

  toggleHabitDate(id, targetDate) {
    const todayStr = this.getTodayStr();
    const updated  = LocalDB.Habits.toggleDate(this._userId(), id, targetDate, todayStr);
    this.habits    = this.habits.map(h => h._id === id ? updated : h);
    this.render();
    if (window.MainApp) window.MainApp.updateStats();
  },

  deleteHabit(id) {
    if (!confirm('Are you sure you want to stop tracking this habit?')) return;
    LocalDB.Habits.delete(this._userId(), id);
    this.habits = this.habits.filter(h => h._id !== id);
    this.render();
    if (window.MainApp) window.MainApp.updateStats();
  },

  render() {
    const todayStr = this.getTodayStr();

    if (this.habits.length === 0) {
      this.habitsList.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-repeat"></i>
          <span>No habits tracked. Start creating positive routines!</span>
        </div>`;
    } else {
      this.habitsList.innerHTML = this.habits.map(habit => {
        const isStreakActive = habit.streak > 0;
        const bubblesHtml = this.weekDates.map(date => {
          const isCompleted = habit.history.includes(date);
          const isToday     = date === todayStr;
          return `
            <button
              class="habit-bubble-btn ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}"
              data-date="${date}"
              title="${isToday ? 'Today' : date}"
            ></button>`;
        }).join('');

        return `
          <div class="habit-row" data-id="${habit._id}">
            <div class="habit-name-txt" title="${this.escapeHTML(habit.name)}">${this.escapeHTML(habit.name)}</div>
            <div class="habit-week-bubbles">${bubblesHtml}</div>
            <div class="habit-streak-display ${isStreakActive ? 'active' : ''}">
              <i class="fa-solid fa-fire"></i>
              <span>${habit.streak} ${habit.streak === 1 ? 'day' : 'days'}</span>
            </div>
            <div class="habit-col-action">
              <button class="task-action-btn delete-btn habit-col-action-btn-del" title="Delete Habit">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </div>`;
      }).join('');

      this.habitsList.querySelectorAll('.habit-bubble-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id   = e.target.closest('.habit-row').dataset.id;
          const date = e.target.dataset.date;
          this.toggleHabitDate(id, date);
        });
      });

      this.habitsList.querySelectorAll('.habit-col-action-btn-del').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.deleteHabit(e.target.closest('.habit-row').dataset.id);
        });
      });
    }

    // Dashboard widget
    if (this.habits.length === 0) {
      this.dashHabitsList.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-repeat"></i>
          <span>No habits tracked.</span>
        </div>`;
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
          </div>`;
      }).join('');

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
