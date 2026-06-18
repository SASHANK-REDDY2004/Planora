// LifeOS Main Application Coordinator

const MainApp = {
  currentUser: null,

  init() {
    this.themeToggle = document.getElementById('theme-toggle');
    this.navLinks = document.querySelectorAll('.nav-link');
    this.viewTabBtns = document.querySelectorAll('.view-tab-btn');
    this.tabPanes = document.querySelectorAll('.tab-pane');
    
    this.setupTheme();
    this.setupNavigation();
    this.updateDashboardDate();

    // Start checking sessions
    Auth.init();
    Auth.checkSession();
  },

  // Theme Management (Light / Dark Mode)
  setupTheme() {
    const savedTheme = localStorage.getItem('lifeos_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('lifeos_theme', newTheme);
      });
    }
  },

  // SPA Tab Navigation
  setupNavigation() {
    const handleTabSwitch = (targetTabId) => {
      // Deactivate all links
      this.navLinks.forEach(l => l.classList.remove('active'));
      
      // Activate matching nav link (handles cases where link text vs icon clicked)
      const matchingLink = Array.from(this.navLinks).find(l => l.dataset.target === targetTabId);
      if (matchingLink) matchingLink.classList.add('active');

      // Show/Hide Tab Panes
      this.tabPanes.forEach(pane => {
        if (pane.id === `tab-${targetTabId}`) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });

      // Special action on tab switch
      if (targetTabId === 'planner') {
        Planner.loadTasks();
      } else if (targetTabId === 'habits') {
        Habits.loadHabits();
      } else if (targetTabId === 'mood') {
        Mood.loadMoodLogs();
      }
    };

    // Header Links
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const target = e.currentTarget.dataset.target;
        handleTabSwitch(target);
      });
    });

    // Dashboard "Go to" Widget Links
    this.viewTabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target.dataset.target;
        handleTabSwitch(target);
      });
    });
  },

  updateDashboardDate() {
    const dateEl = document.getElementById('dashboard-date');
    if (dateEl) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      dateEl.textContent = new Date().toLocaleDateString(undefined, options);
    }
  },

  // Auth Callbacks
  onLogin(user) {
    this.currentUser = user;
    
    // Update header name display
    document.getElementById('user-display').textContent = user.username;
    document.getElementById('welcome-username').textContent = user.username;

    // Initialize all app modules
    Planner.init();
    FocusTimer.init();
    Habits.init();
    Meals.init();
    Mood.init();

    // Load initial data
    this.loadAllData();
  },

  onLogout() {
    this.currentUser = null;
    document.title = "LifeOS — Smart Daily Productivity Portal";
  },

  loadAllData() {
    // Concurrent fetch requests for speed
    Promise.all([
      Planner.loadTasks(),
      Habits.loadHabits(),
      Mood.loadMoodLogs()
    ]).then(() => {
      this.updateStats();
    }).catch(err => {
      console.error('Error loading initial portal data:', err);
    });
  },

  // Aggregate stats across modules and update overview screen
  updateStats() {
    if (!this.currentUser) return;

    // 1. Planner Progress
    const plannerStats = Planner.calculateStats();
    const plannerValEl = document.getElementById('stat-tasks-progress');
    const plannerBarEl = document.getElementById('stat-tasks-bar');
    if (plannerValEl) plannerValEl.textContent = `${plannerStats.percent}%`;
    if (plannerBarEl) plannerBarEl.style.width = `${plannerStats.percent}%`;

    // 2. Timer Status
    const timerModeEl = document.getElementById('stat-timer-mode');
    const timerTimeEl = document.getElementById('stat-timer-time');
    if (timerModeEl && timerTimeEl) {
      const modeLabels = {
        focus: 'Focusing',
        'short-break': 'Short Break',
        'long-break': 'Long Break'
      };
      
      if (FocusTimer.isRunning) {
        timerModeEl.textContent = modeLabels[FocusTimer.currentMode];
        timerModeEl.style.color = FocusTimer.currentMode === 'focus' ? 'var(--info-color)' : 'var(--success-color)';
      } else {
        timerModeEl.textContent = 'Idle';
        timerModeEl.style.color = 'var(--text-secondary)';
      }

      const mins = Math.floor(FocusTimer.timeLeft / 60);
      const secs = FocusTimer.timeLeft % 60;
      timerTimeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // 3. Habits Streaks
    const streakEl = document.getElementById('stat-habits-streak');
    const habitCountEl = document.getElementById('stat-habits-count');
    if (streakEl && habitCountEl) {
      const activeHabitsCount = Habits.habits.length;
      const streaks = Habits.habits.map(h => h.streak);
      const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
      
      streakEl.textContent = `${maxStreak} ${maxStreak === 1 ? 'day' : 'days'}`;
      habitCountEl.textContent = `${activeHabitsCount} active habit${activeHabitsCount === 1 ? '' : 's'}`;
    }

    // 4. Mood Stats
    const moodDisplayEl = document.getElementById('stat-mood-display');
    const moodQuoteEl = document.getElementById('stat-mood-quote');
    if (moodDisplayEl && moodQuoteEl) {
      const todayStr = Mood.getTodayStr();
      const todayLog = Mood.logs.find(log => log.date === todayStr);

      if (todayLog) {
        const emojis = { 1: '😢', 2: '😔', 3: '😐', 4: '🙂', 5: '🤩' };
        const ratingsText = { 1: 'Low', 2: 'Down', 3: 'Okay', 4: 'Good', 5: 'Great' };
        
        moodDisplayEl.textContent = `${emojis[todayLog.mood]} ${ratingsText[todayLog.mood]}`;
        // Truncate quote to fit in stats card nicely
        const cleanQuote = todayLog.quote.length > 30 ? todayLog.quote.substring(0, 28) + '...' : todayLog.quote;
        moodQuoteEl.textContent = `"${cleanQuote}"`;
      } else {
        moodDisplayEl.textContent = 'Not Logged';
        moodQuoteEl.textContent = 'How are you feeling?';
      }
    }
  }
};

// Start application
document.addEventListener('DOMContentLoaded', () => {
  window.MainApp = MainApp;
  MainApp.init();
});
