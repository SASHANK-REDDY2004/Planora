// LifeOS Authentication Handler — localStorage powered (no server required)

const Auth = {
  init() {
    this.loginForm    = document.getElementById('login-form');
    this.signupForm   = document.getElementById('signup-form');
    this.authScreen   = document.getElementById('auth-screen');
    this.mainScreen   = document.getElementById('main-screen');
    this.authMsg      = document.getElementById('auth-message');

    this.profileOverlay  = document.getElementById('profile-setup-overlay');
    this.profileForm     = document.getElementById('profile-setup-form');
    this.profileNameInput = document.getElementById('profile-name-input');
    this.profileSkipBtn  = document.getElementById('profile-skip-btn');

    this.switchToSignup = document.getElementById('switch-to-signup');
    this.switchToLogin  = document.getElementById('switch-to-login');
    this.logoutBtn      = document.getElementById('logout-btn');

    this.bindEvents();
  },

  bindEvents() {
    if (this.switchToSignup) {
      this.switchToSignup.addEventListener('click', () => this.toggleForm('signup'));
    }
    if (this.switchToLogin) {
      this.switchToLogin.addEventListener('click', () => this.toggleForm('login'));
    }
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    if (this.signupForm) {
      this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
    }
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => this.logout());
    }

    // Profile setup form
    if (this.profileForm) {
      this.profileForm.addEventListener('submit', (e) => this.handleProfileSetup(e));
    }
    if (this.profileSkipBtn) {
      this.profileSkipBtn.addEventListener('click', () => this.closeProfileOverlay());
    }
  },

  toggleForm(formType) {
    this.hideMessage();
    if (formType === 'signup') {
      this.loginForm.classList.remove('active');
      this.signupForm.classList.add('active');
      document.getElementById('auth-subtitle').textContent = "Join LifeOS and start organizing your life today.";
    } else {
      this.signupForm.classList.remove('active');
      this.loginForm.classList.add('active');
      document.getElementById('auth-subtitle').textContent = "Organize, focus, and build consistency daily.";
    }
  },

  showMessage(msg, type = 'error') {
    this.authMsg.textContent = msg;
    this.authMsg.className = `alert ${type}`;
    this.authMsg.classList.remove('hidden');
  },

  hideMessage() {
    this.authMsg.classList.add('hidden');
    this.authMsg.textContent = '';
  },

  async handleLogin(e) {
    e.preventDefault();
    this.hideMessage();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      this.showMessage('Please fill in all fields.');
      return;
    }

    try {
      const user = await LocalDB.Users.authenticate(username, password);
      LocalDB.Session.set(user);
      this.showMessage('Welcome back! Entering portal...', 'success');

      setTimeout(() => {
        this.loginSuccess({ id: user._id, username: user.username, displayName: user.displayName, email: user.email });
      }, 900);
    } catch (err) {
      this.showMessage(err.message || 'Login failed. Check your credentials.');
    }
  },

  async handleSignup(e) {
    e.preventDefault();
    this.hideMessage();

    const username = document.getElementById('signup-username').value.trim();
    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!username) {
      this.showMessage('Please enter a username.');
      return;
    }
    if (!email) {
      this.showMessage('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      this.showMessage('Password must be at least 6 characters long.');
      return;
    }

    try {
      const user = await LocalDB.Users.create(username, email, password);
      LocalDB.Session.set(user);
      this.showMessage('Account created! Entering portal...', 'success');

      setTimeout(() => {
        this.loginSuccess({ id: user._id, username: user.username, displayName: user.displayName, email: user.email });
      }, 900);
    } catch (err) {
      this.showMessage(err.message || 'Registration failed. Try a different username.');
    }
  },

  loginSuccess(user) {
    this.loginForm.reset();
    this.signupForm.reset();
    this.hideMessage();

    this.authScreen.classList.remove('active');
    this.mainScreen.classList.add('active');

    if (window.MainApp && typeof window.MainApp.onLogin === 'function') {
      window.MainApp.onLogin(user);
    }

    // Show name-collection overlay if displayName not yet set
    if (!user.displayName) {
      setTimeout(() => this.showProfileOverlay(), 400);
    }
  },

  // ── Profile name collection overlay ────────────────────────────────────────
  showProfileOverlay() {
    if (this.profileOverlay) {
      this.profileOverlay.classList.remove('hidden');
      // Focus the input after animation
      setTimeout(() => {
        if (this.profileNameInput) this.profileNameInput.focus();
      }, 300);
    }
  },

  closeProfileOverlay(displayName = '') {
    if (this.profileOverlay) {
      this.profileOverlay.classList.add('profile-overlay-hide');
      setTimeout(() => {
        this.profileOverlay.classList.add('hidden');
        this.profileOverlay.classList.remove('profile-overlay-hide');
      }, 400);
    }

    if (displayName && window.MainApp) {
      window.MainApp.updateDisplayName(displayName);
    }
  },

  handleProfileSetup(e) {
    e.preventDefault();
    const name = this.profileNameInput ? this.profileNameInput.value.trim() : '';

    if (!name) {
      this.profileNameInput.classList.add('shake');
      setTimeout(() => this.profileNameInput.classList.remove('shake'), 500);
      return;
    }

    // Save the name to LocalDB and session
    const session = LocalDB.Session.get();
    if (session) {
      LocalDB.Users.updateName(session.id, name);
      LocalDB.Session.updateDisplayName(name);
    }

    this.closeProfileOverlay(name);
  },

  checkSession() {
    const session = LocalDB.Session.get();
    if (session) {
      const user = LocalDB.Users.findById(session.id);
      if (user) {
        this.loginSuccess({ id: user._id, username: user.username, displayName: user.displayName, email: user.email });
        return;
      } else {
        LocalDB.Session.clear();
      }
    }
    this.showLoginScreen();
  },

  showLoginScreen() {
    this.mainScreen.classList.remove('active');
    this.authScreen.classList.add('active');
  },

  logout() {
    LocalDB.Session.clear();
    if (window.MainApp && typeof window.MainApp.onLogout === 'function') {
      window.MainApp.onLogout();
    }
    this.showLoginScreen();
    this.toggleForm('login');
  }
};

window.Auth = Auth;
