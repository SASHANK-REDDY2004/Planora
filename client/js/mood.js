// LifeOS Mood & Motivation Handler

const Mood = {
  logs: [],

  init() {
    this.moodForm = document.getElementById('mood-form');
    this.historyList = document.getElementById('mood-history-list');
    this.quoteCard = document.getElementById('mood-quote-card');
    
    this.quoteText = document.getElementById('motivational-quote');
    this.quoteAuthor = document.getElementById('quote-author');

    // Emoji clicks styling helper
    this.emojiLabels = document.querySelectorAll('.mood-emoji-label');
    
    this.bindEvents();
  },

  bindEvents() {
    // Emoji click styling trigger
    this.emojiLabels.forEach(label => {
      label.addEventListener('click', (e) => {
        this.emojiLabels.forEach(l => l.querySelector('.mood-emoji-box').style.transform = '');
        const box = label.querySelector('.mood-emoji-box');
        box.style.transform = 'scale(1.08) translateY(-2px)';
      });
    });

    if (this.moodForm) {
      this.moodForm.addEventListener('submit', (e) => this.handleSaveMood(e));
    }
  },

  getTodayStr() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  async loadMoodLogs() {
    try {
      this.logs = await API.get('/mood');
      this.render();
      
      // Update Quote widget with latest log quote if exists
      if (this.logs.length > 0) {
        this.updateQuoteView(this.logs[0].quote);
      }
    } catch (err) {
      console.error('Failed to load mood logs:', err);
    }
  },

  async handleSaveMood(e) {
    e.preventDefault();
    
    const selectedRadio = this.moodForm.querySelector('input[name="mood-rating"]:checked');
    const notesInput = document.getElementById('mood-notes');
    
    if (!selectedRadio) return;

    const mood = parseInt(selectedRadio.value);
    const notes = notesInput.value.trim();
    const date = this.getTodayStr();

    try {
      const savedLog = await API.post('/mood', { mood, notes, date });
      
      // Update local logs list
      const existingIndex = this.logs.findIndex(log => log.date === date);
      if (existingIndex > -1) {
        this.logs[existingIndex] = savedLog; // Replace
      } else {
        this.logs.unshift(savedLog); // Add to top
      }

      notesInput.value = '';
      this.updateQuoteView(savedLog.quote);
      
      // Animate quote card
      if (this.quoteCard) {
        this.quoteCard.style.transform = 'scale(1.03)';
        setTimeout(() => {
          this.quoteCard.style.transform = 'scale(1)';
        }, 300);
      }

      this.render();

      if (window.MainApp) window.MainApp.updateStats();
    } catch (err) {
      console.error('Failed to save mood log:', err);
    }
  },

  updateQuoteView(quote) {
    if (this.quoteText) {
      this.quoteText.textContent = `"${quote}"`;
    }
  },

  render() {
    const emojis = { 1: '😢', 2: '😔', 3: '😐', 4: '🙂', 5: '🤩' };
    const ratingsText = { 1: 'Low', 2: 'Down', 3: 'Okay', 4: 'Good', 5: 'Great' };
    
    // Render logs history
    if (this.logs.length === 0) {
      this.historyList.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-face-smile"></i>
          <span>No logs recorded yet. How's today going?</span>
        </div>
      `;
    } else {
      this.historyList.innerHTML = this.logs.map(log => {
        const dateFormatted = new Date(log.date).toLocaleDateString(undefined, { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });

        return `
          <div class="mood-history-item">
            <div class="mood-history-left">
              <span class="mood-history-emoji">${emojis[log.mood]}</span>
              <div class="mood-history-details">
                <span class="mood-history-date">${dateFormatted}</span>
                <span class="mood-history-notes" title="${this.escapeHTML(log.notes || 'No notes.')}">
                  ${this.escapeHTML(log.notes || 'No notes.')}
                </span>
              </div>
            </div>
            <span class="mood-history-rating rating-${log.mood}">${ratingsText[log.mood]}</span>
          </div>
        `;
      }).join('');
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

window.Mood = Mood;
