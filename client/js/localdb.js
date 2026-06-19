// LifeOS Local Database Engine
// Stores all data in localStorage — no server or API required.

const LocalDB = (() => {
  // ─── Namespace Keys ───────────────────────────────────────────────────────
  const KEYS = {
    users:    'lifeos_db_users',
    tasks:    'lifeos_db_tasks',
    habits:   'lifeos_db_habits',
    moods:    'lifeos_db_moods',
    session:  'lifeos_session'
  };

  // ─── ID Generator ─────────────────────────────────────────────────────────
  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  // ─── Storage Helpers ──────────────────────────────────────────────────────
  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  function write(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function readObj(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
      return null;
    }
  }

  // ─── Simple Hash (SHA-256 via Web Crypto) ─────────────────────────────────
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'lifeos_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function verifyPassword(password, hash) {
    const computed = await hashPassword(password);
    return computed === hash;
  }

  // ─── Motivational Quotes ─────────────────────────────────────────────────
  const QUOTES = {
    1: [
      "Every storm runs out of rain. Hang in there.",
      "It's okay to not be okay. Be gentle with yourself.",
      "Hard times are just part of the journey. You'll get through this."
    ],
    2: [
      "Tomorrow is a new beginning. Rest well tonight.",
      "Small steps are still steps. Keep going.",
      "Even the darkest night will end and the sun will rise."
    ],
    3: [
      "Consistency is not about perfection. It's about showing up.",
      "Progress, not perfection. You're doing fine.",
      "Neutral days are productive days in disguise."
    ],
    4: [
      "You're building something great, one day at a time.",
      "Momentum is your friend. Keep this energy going!",
      "Good days fuel great habits. Ride this wave."
    ],
    5: [
      "This is your peak — document it, remember it, chase it again.",
      "Greatness is built on days exactly like this one.",
      "You're on fire! Channel this energy into your biggest goals."
    ]
  };

  function getQuote(moodRating) {
    const pool = QUOTES[moodRating] || QUOTES[3];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ─── Session Management ───────────────────────────────────────────────────
  const Session = {
    get() {
      return readObj(KEYS.session);
    },
    set(user) {
      localStorage.setItem(KEYS.session, JSON.stringify({
        id: user._id,
        username: user.username,
        email: user.email || '',
        displayName: user.displayName || ''
      }));
    },
    clear() {
      localStorage.removeItem(KEYS.session);
    },
    isActive() {
      return !!this.get();
    },
    updateDisplayName(name) {
      const s = this.get();
      if (s) {
        s.displayName = name;
        localStorage.setItem(KEYS.session, JSON.stringify(s));
      }
    }
  };

  // ─── Users Collection ─────────────────────────────────────────────────────
  const Users = {
    all() { return read(KEYS.users); },

    findByUsername(username) {
      return this.all().find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    },

    findById(id) {
      return this.all().find(u => u._id === id) || null;
    },

    async create(username, email, password) {
      const existing = this.findByUsername(username);
      if (existing) throw new Error('Username already taken.');

      // Basic email format check
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address.');
      }

      const hash = await hashPassword(password);
      const users = this.all();
      const newUser = {
        _id: genId(),
        username,
        email,
        password: hash,
        displayName: '',   // Set after first login
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      write(KEYS.users, users);
      return newUser;
    },

    async authenticate(username, password) {
      const user = this.findByUsername(username);
      if (!user) throw new Error('Invalid username or password.');
      const ok = await verifyPassword(password, user.password);
      if (!ok) throw new Error('Invalid username or password.');
      return user;
    },

    updateName(userId, displayName) {
      const all = this.all();
      const idx = all.findIndex(u => u._id === userId);
      if (idx === -1) return null;
      all[idx].displayName = displayName;
      write(KEYS.users, all);
      return all[idx];
    }
  };

  // ─── Tasks Collection ─────────────────────────────────────────────────────
  const Tasks = {
    _getForUser(userId) {
      return read(KEYS.tasks).filter(t => t.userId === userId);
    },

    _saveAll(tasks) {
      write(KEYS.tasks, tasks);
    },

    getAll(userId) {
      return this._getForUser(userId);
    },

    create(userId, { title, priority = 'medium', dueDate = '' }) {
      const all = read(KEYS.tasks);
      const task = {
        _id: genId(),
        userId,
        title,
        priority,
        dueDate,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      all.push(task);
      this._saveAll(all);
      return task;
    },

    update(userId, taskId, changes) {
      const all = read(KEYS.tasks);
      const idx = all.findIndex(t => t._id === taskId && t.userId === userId);
      if (idx === -1) throw new Error('Task not found.');
      all[idx] = { ...all[idx], ...changes, updatedAt: new Date().toISOString() };
      this._saveAll(all);
      return all[idx];
    },

    delete(userId, taskId) {
      const all = read(KEYS.tasks);
      const filtered = all.filter(t => !(t._id === taskId && t.userId === userId));
      this._saveAll(filtered);
    },

    deleteAllForUser(userId) {
      const all = read(KEYS.tasks).filter(t => t.userId !== userId);
      this._saveAll(all);
    }
  };

  // ─── Habits Collection ────────────────────────────────────────────────────
  const Habits = {
    _all() { return read(KEYS.habits); },
    _save(data) { write(KEYS.habits, data); },

    getAll(userId) {
      return this._all().filter(h => h.userId === userId);
    },

    create(userId, { name }) {
      const all = this._all();
      const habit = {
        _id: genId(),
        userId,
        name,
        history: [],
        streak: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      all.push(habit);
      this._save(all);
      return habit;
    },

    toggleDate(userId, habitId, targetDate, todayStr) {
      const all = this._all();
      const idx = all.findIndex(h => h._id === habitId && h.userId === userId);
      if (idx === -1) throw new Error('Habit not found.');

      const habit = { ...all[idx] };
      const dateIdx = habit.history.indexOf(targetDate);

      if (dateIdx > -1) {
        habit.history.splice(dateIdx, 1); // Uncheck
      } else {
        habit.history.push(targetDate); // Check
      }

      // Recalculate streak (consecutive days ending today or yesterday)
      habit.streak = this._calcStreak(habit.history, todayStr);
      habit.updatedAt = new Date().toISOString();

      all[idx] = habit;
      this._save(all);
      return habit;
    },

    _calcStreak(history, todayStr) {
      if (!history.length) return 0;
      const sorted = [...history].sort().reverse(); // Newest first
      let streak = 0;
      let checkDate = new Date(todayStr);

      for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().slice(0, 10);
        if (sorted.includes(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    },

    delete(userId, habitId) {
      const filtered = this._all().filter(h => !(h._id === habitId && h.userId === userId));
      this._save(filtered);
    },

    deleteAllForUser(userId) {
      this._save(this._all().filter(h => h.userId !== userId));
    }
  };

  // ─── Moods Collection ─────────────────────────────────────────────────────
  const Moods = {
    _all() { return read(KEYS.moods); },
    _save(data) { write(KEYS.moods, data); },

    getAll(userId) {
      return this._all()
        .filter(m => m.userId === userId)
        .sort((a, b) => b.date.localeCompare(a.date)); // Newest first
    },

    save(userId, { mood, notes = '', date }) {
      const all = this._all();
      const existingIdx = all.findIndex(m => m.userId === userId && m.date === date);
      const quote = getQuote(mood);

      if (existingIdx > -1) {
        // Update today's existing log
        all[existingIdx] = {
          ...all[existingIdx],
          mood,
          notes,
          quote,
          updatedAt: new Date().toISOString()
        };
        this._save(all);
        return all[existingIdx];
      } else {
        const entry = {
          _id: genId(),
          userId,
          mood,
          notes,
          date,
          quote,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        all.push(entry);
        this._save(all);
        return entry;
      }
    },

    deleteAllForUser(userId) {
      this._save(this._all().filter(m => m.userId !== userId));
    }
  };

  // ─── Public API ───────────────────────────────────────────────────────────
  return { Session, Users, Tasks, Habits, Moods };
})();

window.LocalDB = LocalDB;
