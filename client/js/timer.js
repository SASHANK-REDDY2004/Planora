// LifeOS Pomodoro Focus Timer Handler

const FocusTimer = {
  // Config
  modes: {
    focus: 1500,        // 25 minutes
    'short-break': 300, // 5 minutes
    'long-break': 900   // 15 minutes
  },
  
  currentMode: 'focus',
  timeLeft: 1500,       // in seconds
  totalDuration: 1500,  // in seconds
  isRunning: false,
  timerInterval: null,

  init() {
    this.timerTimeEl = document.getElementById('timer-time');
    this.timerStatusEl = document.getElementById('timer-status');
    this.timerProgressRing = document.getElementById('timer-progress-ring');
    this.timerToggleBtn = document.getElementById('timer-toggle-btn');
    this.timerResetBtn = document.getElementById('timer-reset-btn');
    
    this.audioToggle = document.getElementById('timer-audio-toggle');
    this.alertSound = document.getElementById('alert-sound');

    // Mini widgets
    this.miniTimeEl = document.getElementById('mini-timer-time');
    this.miniLabelEl = document.getElementById('mini-timer-label');
    this.miniToggleBtn = document.getElementById('mini-timer-toggle-btn');
    this.miniResetBtn = document.getElementById('mini-timer-reset-btn');

    this.modeButtons = document.querySelectorAll('.timer-mode-btn');

    this.bindEvents();
    this.resetTimer();
  },

  bindEvents() {
    // Mode Buttons
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.modeButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.setMode(e.target.dataset.mode);
      });
    });

    // Start / Pause Controls
    this.timerToggleBtn.addEventListener('click', () => this.toggleTimer());
    this.miniToggleBtn.addEventListener('click', () => this.toggleTimer());

    // Reset Controls
    this.timerResetBtn.addEventListener('click', () => this.resetTimer());
    this.miniResetBtn.addEventListener('click', () => this.resetTimer());

    // Keyboard Hotkey (Spacebar) - Avoid trigger when writing in forms
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        const activeEl = document.activeElement;
        const isInputField = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable;
        if (!isInputField) {
          e.preventDefault();
          this.toggleTimer();
        }
      }
    });
  },

  setMode(mode) {
    this.pauseTimer();
    this.currentMode = mode;
    this.totalDuration = this.modes[mode];
    this.timeLeft = this.totalDuration;
    
    // Sync mode tabs if changed from mini/elsewhere
    this.modeButtons.forEach(btn => {
      if (btn.dataset.mode === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Label updates
    const modeLabels = {
      focus: 'Focusing',
      'short-break': 'Short Break',
      'long-break': 'Long Break'
    };
    
    this.timerStatusEl.textContent = modeLabels[mode];
    this.miniLabelEl.textContent = mode === 'focus' ? 'Focus' : 'Break';

    this.updateDisplay();
    
    if (window.MainApp) window.MainApp.updateStats();
  },

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  },

  startTimer() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // UI Update
    this.timerToggleBtn.innerHTML = `<i class="fa-solid fa-pause"></i> Pause Session`;
    this.miniToggleBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
    
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();

      if (this.timeLeft <= 0) {
        this.timerCompleted();
      }
    }, 1000);

    if (window.MainApp) window.MainApp.updateStats();
  },

  pauseTimer() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.timerInterval);
    
    // UI Update
    this.timerToggleBtn.innerHTML = `<i class="fa-solid fa-play"></i> Start Session`;
    this.miniToggleBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;

    if (window.MainApp) window.MainApp.updateStats();
  },

  resetTimer() {
    this.pauseTimer();
    this.timeLeft = this.totalDuration;
    this.updateDisplay();
  },

  timerCompleted() {
    this.pauseTimer();
    
    // Play sound alert
    if (this.audioToggle && this.audioToggle.checked && this.alertSound) {
      this.alertSound.play().catch(e => console.log('Audio playback prevented:', e));
    }

    // Browser Notification
    if (Notification.permission === 'granted') {
      const messages = {
        focus: "Great work! Time for a well-deserved break.",
        'short-break': "Break's over. Let's get back to work!",
        'long-break': "Refreshed? Let's start focusing again!"
      };
      new Notification("LifeOS Focus Timer", {
        body: messages[this.currentMode],
        icon: '/favicon.ico' // fallback
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    alert(this.currentMode === 'focus' ? 'Focus session completed! Time for a break.' : 'Break completed! Ready to focus?');

    // Cycle Mode
    if (this.currentMode === 'focus') {
      this.setMode('short-break');
    } else {
      this.setMode('focus');
    }
  },

  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Update texts
    this.timerTimeEl.textContent = formattedTime;
    this.miniTimeEl.textContent = formattedTime;

    // Update document title for background tracking
    const stateLabel = this.currentMode === 'focus' ? 'Focus' : 'Break';
    document.title = `[${formattedTime}] ${stateLabel} | LifeOS`;

    // Update SVG Progress (circumference is 753.98)
    if (this.timerProgressRing) {
      const radius = 120;
      const circumference = 2 * Math.PI * radius; // 753.98
      const percent = this.timeLeft / this.totalDuration;
      const offset = (1 - percent) * circumference;
      this.timerProgressRing.style.strokeDashoffset = offset;
    }
  }
};

window.FocusTimer = FocusTimer;
