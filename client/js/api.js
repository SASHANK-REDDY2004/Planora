// LifeOS Centralized API Helper

const API_BASE = '/api';

const API = {
  // Token Storage Helpers
  getToken() {
    return localStorage.getItem('lifeos_token');
  },

  setToken(token) {
    localStorage.setItem('lifeos_token', token);
  },

  clearToken() {
    localStorage.removeItem('lifeos_token');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  // HTTP Request Wrappers
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    // Set headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);

      // Safely parse JSON — avoid crash if response is empty or HTML
      let data = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } else {
        // Non-JSON response (e.g. HTML error page or empty body)
        data = {};
      }

      if (!response.ok) {
        // If unauthorized, clear token and redirect/reset
        if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
          this.clearToken();
          window.location.reload(); // Boot user out to login screen
        }
        throw new Error(data.message || `Server error (${response.status}). Is the server running?`);
      }

      return data;
    } catch (error) {
      // Network error or server is completely down
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please make sure the server is running.');
      }
      console.error(`API Request Error [${endpoint}]:`, error);
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};
