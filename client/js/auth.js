// LifeOS Authentication Handler

const Auth = {
  init() {
    this.loginForm = document.getElementById('login-form');
    this.signupForm = document.getElementById('signup-form');
    this.authScreen = document.getElementById('auth-screen');
    this.mainScreen = document.getElementById('main-screen');
    this.authMsg = document.getElementById('auth-message');
    
    this.switchToSignup = document.getElementById('switch-to-signup');
    this.switchToLogin = document.getElementById('switch-to-login');
    this.logoutBtn = document.getElementById('logout-btn');

    this.bindEvents();
  },

  bindEvents() {
    // Switch between Forms
    if (this.switchToSignup) {
      this.switchToSignup.addEventListener('click', () => this.toggleForm('signup'));
    }
    if (this.switchToLogin) {
      this.switchToLogin.addEventListener('click', () => this.toggleForm('login'));
    }

    // Form Submissions
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    if (this.signupForm) {
      this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
    }

    // Logout Action
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => this.logout());
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
      const data = await API.post('/auth/login', { username, password });
      API.setToken(data.token);
      this.showMessage('Success! Entering portal...', 'success');
      
      // Delay transition for smooth visual feedback
      setTimeout(() => {
        this.loginSuccess(data.user);
      }, 1000);
    } catch (err) {
      this.showMessage(err.message || 'Login failed. Check your credentials.');
    }
  },

  async handleSignup(e) {
    e.preventDefault();
    this.hideMessage();

    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!username || password.length < 6) {
      this.showMessage('Password must be at least 6 characters long.');
      return;
    }

    try {
      const data = await API.post('/auth/register', { username, password });
      API.setToken(data.token);
      this.showMessage('Account created successfully! Redirecting...', 'success');

      setTimeout(() => {
        this.loginSuccess(data.user);
      }, 1000);
    } catch (err) {
      this.showMessage(err.message || 'Registration failed. Username may be taken.');
    }
  },

  loginSuccess(user) {
    this.loginForm.reset();
    this.signupForm.reset();
    this.hideMessage();
    
    // Hide auth screen and show main application workspace
    this.authScreen.classList.remove('active');
    this.mainScreen.classList.add('active');

    // Notify Main App coordinator
    if (window.MainApp && typeof window.MainApp.onLogin === 'function') {
      window.MainApp.onLogin(user);
    }
  },

  async checkSession() {
    if (API.isAuthenticated()) {
      try {
        const user = await API.get('/auth/me');
        this.loginSuccess(user);
      } catch (err) {
        console.error('Session validation failed:', err);
        API.clearToken();
        this.showLoginScreen();
      }
    } else {
      this.showLoginScreen();
    }
  },

  showLoginScreen() {
    this.mainScreen.classList.remove('active');
    this.authScreen.classList.add('active');
  },

  logout() {
    API.clearToken();
    if (window.MainApp && typeof window.MainApp.onLogout === 'function') {
      window.MainApp.onLogout();
    }
    this.showLoginScreen();
    this.toggleForm('login');
  }
};

// Bind to window to allow global coordination
window.Auth = Auth;
