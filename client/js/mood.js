// LifeOS Mood & Motivation Handler — localStorage powered

const Mood = {
  logs: [],

  _userId() {
    return LocalDB.Session.get()?.id;
  },

  init() {
    this.moodForm    = document.getElementById('mood-form');
    this.historyList = document.getElementById('mood-history-list');
    this.quoteCard   = document.getElementById('mood-quote-card');

    this.quoteText   = document.getElementById('motivational-quote');
    this.quoteAuthor = document.getElementById('quote-author');

    this.emojiLabels = document.querySelectorAll('.mood-emoji-label');

    this.bindEvents();
  },

  bindEvents() {
    this.emojiLabels.forEach(label => {
      label.addEventListener('click', () => {
        this.emojiLabels.forEach(l => l.querySelector('.mood-emoji-box').style.transform = '');
        label.querySelector('.mood-emoji-box').style.transform = 'scale(1.08) translateY(-2px)';
      });
    });

    if (this.moodForm) {
      this.moodForm.addEventListener('submit', (e) => this.handleSaveMood(e));
    }
  },

  getTodayStr() {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day   = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  loadMoodLogs() {
    this.logs = LocalDB.Moods.getAll(this._userId());
    this.render();

    if (this.logs.length > 0 && this.logs[0].quote) {
      this.updateQuoteView(this.logs[0].quote);
    }
  },

  handleSaveMood(e) {
    e.preventDefault();

    const selectedRadio = this.moodForm.querySelector('input[name="mood-rating"]:checked');
    const notesInput    = document.getElementById('mood-notes');

    if (!selectedRadio) return;

    const mood  = parseInt(selectedRadio.value);
    const notes = notesInput.value.trim();
    const date  = this.getTodayStr();

    const savedLog = LocalDB.Moods.save(this._userId(), { mood, notes, date });

    const existingIdx = this.logs.findIndex(log => log.date === date);
    if (existingIdx > -1) {
      this.logs[existingIdx] = savedLog;
    } else {
      this.logs.unshift(savedLog);
    }

    notesInput.value = '';
    this.updateQuoteView(savedLog.quote);

    if (this.quoteCard) {
      this.quoteCard.style.transform = 'scale(1.03)';
      setTimeout(() => { this.quoteCard.style.transform = 'scale(1)'; }, 300);
    }

    this.render();
    if (window.MainApp) window.MainApp.updateStats();
  },

  updateQuoteView(quote) {
    if (this.quoteText) {
      this.quoteText.textContent = `"${quote}"`;
    }
  },

  render() {
    const emojis      = { 1: '😢', 2: '😔', 3: '😐', 4: '🙂', 5: '🤩' };
    const ratingsText = { 1: 'Low', 2: 'Down', 3: 'Okay', 4: 'Good', 5: 'Great' };

    if (this.logs.length === 0) {
      this.historyList.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-face-smile"></i>
          <span>No logs recorded yet. How's today going?</span>
        </div>`;
    } else {
      this.historyList.innerHTML = this.logs.map(log => {
        const dateFormatted = new Date(log.date + 'T00:00:00').toLocaleDateString(undefined, {
          weekday: 'short', month: 'short', day: 'numeric'
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
          </div>`;
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
