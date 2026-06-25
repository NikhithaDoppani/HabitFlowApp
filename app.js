/**
 * Habit Tracker - Core Application Module
 * Handles all core functionality, utilities, and shared components
 */

// ========================================
// Data Structures
// ========================================

/**
 * User data structure
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} name - User's display name
 * @property {string} email - User's email address
 * @property {string} profileImage - Profile image URL or base64
 * @property {string} joinDate - ISO date string
 * @property {Object} settings - User settings
 */

/**
 * Habit data structure
 * @typedef {Object} Habit
 * @property {string} id - Unique habit identifier
 * @property {string} userId - Owner user ID
 * @property {string} title - Habit name
 * @property {string} description - Habit description
 * @property {string} category - Category (health, fitness, study, etc.)
 * @property {string} frequency - Frequency (daily, weekly, monthly, weekdays)
 * @property {string} reminderTime - Reminder time (HH:MM format)
 * @property {string} notes - Additional notes
 * @property {number} streak - Current streak count
 * @property {number} longestStreak - Best streak achieved
 * @property {boolean} reminderEnabled - Whether reminders are enabled
 * @property {string} createdDate - ISO date string
 */

/**
 * Habit Log entry structure
 * @typedef {Object} HabitLog
 * @property {string} id - Unique log identifier
 * @property {string} habitId - Associated habit ID
 * @property {string} date - Completion date (YYYY-MM-DD)
 * @property {boolean} completed - Whether habit was completed
 * @property {string} notes - Notes for the day
 */

// ========================================
// Global State
// ========================================

const App = {
  currentUser: null,
  habits: [],
  habitLogs: [],
  achievements: [],
  theme: 'light',
  sidebarOpen: false,

  // Category colors
  categories: {
    health: { name: 'Health', color: 'health', icon: 'heart' },
    fitness: { name: 'Fitness', color: 'fitness', icon: 'activity' },
    study: { name: 'Study', color: 'study', icon: 'book-open' },
    productivity: { name: 'Productivity', color: 'productivity', icon: 'zap' },
    personal: { name: 'Personal', color: 'personal', icon: 'user' },
    reading: { name: 'Reading', color: 'reading', icon: 'book' },
    meditation: { name: 'Meditation', color: 'meditation', icon: 'sun' }
  },

  // Achievement definitions
  achievementDefs: [
    { id: 'first_habit', name: 'First Habit', icon: 'trophy', description: 'Create your first habit', requirement: 1, type: 'habits_created' },
    { id: 'streak_7', name: '7-Day Streak', icon: 'flame', description: 'Maintain a 7-day streak', requirement: 7, type: 'streak' },
    { id: 'streak_30', name: '30-Day Streak', icon: 'star', description: 'Maintain a 30-day streak', requirement: 30, type: 'streak' },
    { id: 'completions_100', name: '100 Completions', icon: 'award', description: 'Complete habits 100 times', requirement: 100, type: 'total_completions' },
    { id: 'master', name: 'Productivity Master', icon: 'crown', description: 'Complete 50 habits in a month', requirement: 50, type: 'monthly_completions' },
    { id: 'consistency_week', name: 'Perfect Week', icon: 'calendar-check', description: 'Complete all habits for 7 days straight', requirement: 7, type: 'perfect_days' },
    { id: 'early_bird', name: 'Early Bird', icon: 'sunrise', description: 'Complete a habit before 6 AM', requirement: 1, type: 'early_completion' },
    { id: 'night_owl', name: 'Night Owl', icon: 'moon', description: 'Complete a habit after 10 PM', requirement: 1, type: 'late_completion' },
    { id: 'habits_10', name: 'Habit Collector', icon: 'layers', description: 'Create 10 different habits', requirement: 10, type: 'habits_created' },
    { id: 'streak_100', name: 'Century Streak', icon: 'medal', description: 'Maintain a 100-day streak', requirement: 100, type: 'streak' }
  ]
};

// ========================================
// Utility Functions
// ========================================

const Utils = {
  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Format date to YYYY-MM-DD
  formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },

  // Format date for display
  formatDisplayDate(date) {
    const d = new Date(date);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  },

  // Format short date
  formatShortDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  // Get time greeting
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  },

  // Format time to 12-hour
  formatTime(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  },

  // Get current time in HH:MM
  getCurrentTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  },

  // Check if same day
  isSameDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
  },

  // Get days between dates
  daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  },

  // Get date string for N days ago
  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.formatDate(date);
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Deep clone object
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Get initials from name
  getInitials(name) {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
};

// ========================================
// Storage Module
// ========================================

const Storage = {
  keys: {
    USER: 'habitTracker_user',
    HABITS: 'habitTracker_habits',
    LOGS: 'habitTracker_logs',
    ACHIEVEMENTS: 'habitTracker_achievements',
    THEME: 'habitTracker_theme',
    USERS: 'habitTracker_users',
    DAILY_TARGETS: 'habitTracker_dailyTargets',
    TARGET_HISTORY: 'habitTracker_targetHistory'
  },

  // Save data to localStorage
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error saving to localStorage:', e);
      return false;
    }
  },

  // Load data from localStorage
  load(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error loading from localStorage:', e);
      return null;
    }
  },

  // Remove data from localStorage
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from localStorage:', e);
      return false;
    }
  },

  // Clear all app data
  clearAll() {
    Object.values(this.keys).forEach(key => {
      if (key !== this.keys.USERS) {
        localStorage.removeItem(key);
      }
    });
  },

  // User management
  saveUser(user) {
    this.save(this.keys.USER, user);
    const users = this.load(this.keys.USERS) || [];
    const existingIndex = users.findIndex(u => u.email === user.email);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push({ email: user.email, name: user.name, password: user.password });
    }
    this.save(this.keys.USERS, users);
  },

  getUser() {
    return this.load(this.keys.USER);
  },

  // Habit management
  saveHabits(habits) {
    this.save(this.keys.HABITS, habits);
  },

  getHabits() {
    return this.load(this.keys.HABITS) || [];
  },

  // Log management
  saveLogs(logs) {
    this.save(this.keys.LOGS, logs);
  },

  getLogs() {
    return this.load(this.keys.LOGS) || [];
  },

  // Achievement management
  saveAchievements(achievements) {
    this.save(this.keys.ACHIEVEMENTS, achievements);
  },

  getAchievements() {
    return this.load(this.keys.ACHIEVEMENTS) || [];
  },

  // Theme management
  saveTheme(theme) {
    this.save(this.keys.THEME, theme);
  },

  getTheme() {
    return this.load(this.keys.THEME) || 'light';
  },

  // Find user by email
  findUser(email) {
    const users = this.load(this.keys.USERS) || [];
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  // Get all users
  getAllUsers() {
    return this.load(this.keys.USERS) || [];
  },

  // Daily Targets management
  saveDailyTargets(targets) {
    this.save(this.keys.DAILY_TARGETS, targets);
  },

  getDailyTargets() {
    return this.load(this.keys.DAILY_TARGETS) || [];
  },

  // Target History management
  saveTargetHistory(history) {
    this.save(this.keys.TARGET_HISTORY, history);
  },

  getTargetHistory() {
    return this.load(this.keys.TARGET_HISTORY) || [];
  }
};

// ========================================
// Toast Notification System
// ========================================

const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(options) {
    this.init();
    const { title, message, type = 'info', duration = 4000 } = options;

    const icons = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'alert-triangle',
      info: 'info'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i data-lucide="${icons[type]}" class="toast-icon"></i>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <i data-lucide="x"></i>
      </button>
    `;

    this.container.appendChild(toast);

    if (window.lucide) {
      lucide.createIcons();
    }

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(title, message) {
    this.show({ title, message, type: 'success' });
  },

  error(title, message) {
    this.show({ title, message, type: 'error' });
  },

  warning(title, message) {
    this.show({ title, message, type: 'warning' });
  },

  info(title, message) {
    this.show({ title, message, type: 'info' });
  }
};

// ========================================
// Modal System
// ========================================

const Modal = {
  backdrop: null,
  modal: null,

  init() {
    if (!document.querySelector('.modal-backdrop')) {
      this.backdrop = document.createElement('div');
      this.backdrop.className = 'modal-backdrop';
      this.backdrop.onclick = () => this.close();
      document.body.appendChild(this.backdrop);
    }

    if (!document.querySelector('.modal')) {
      this.modal = document.createElement('div');
      this.modal.className = 'modal';
      document.body.appendChild(this.modal);
    }
  },

  open(options) {
    this.init();
    const { title, content, footer, width = '500px' } = options;

    this.backdrop = document.querySelector('.modal-backdrop');
    this.modal = document.querySelector('.modal');
    this.modal.style.maxWidth = width;

    this.modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" onclick="Modal.close()">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    `;

    this.backdrop.classList.add('active');
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  close() {
    if (this.backdrop) this.backdrop.classList.remove('active');
    if (this.modal) this.modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  confirm(options) {
    const { title, message, type = 'warning', onConfirm, onCancel } = options;

    const icons = {
      warning: 'alert-triangle',
      danger: 'trash-2',
      info: 'info'
    };

    const colors = {
      warning: 'warning',
      danger: 'danger',
      info: 'primary'
    };

    this.open({
      title: '',
      width: '400px',
      content: `
        <div class="confirm-dialog">
          <div class="confirm-icon ${colors[type]}">
            <i data-lucide="${icons[type]}"></i>
          </div>
          <h3 class="confirm-title">${title}</h3>
          <p class="confirm-message">${message}</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" onclick="Modal.close(); ${onCancel ? onCancel + '()' : ''}">Cancel</button>
            <button class="btn btn-${type === 'danger' ? 'danger' : 'primary'}" onclick="Modal.close(); ${onConfirm}()">Confirm</button>
          </div>
        </div>
      `
    });
  }
};

// ========================================
// Theme Management
// ========================================

const Theme = {
  init() {
    const savedTheme = Storage.getTheme();
    this.set(savedTheme, false);
  },

  set(theme, save = true) {
    document.documentElement.setAttribute('data-theme', theme);
    App.theme = theme;
    if (save) {
      Storage.saveTheme(theme);
    }
    this.updateToggleIcon();
  },

  toggle() {
    const newTheme = App.theme === 'light' ? 'dark' : 'light';
    this.set(newTheme);
  },

  updateToggleIcon() {
    const toggleBtn = document.querySelector('.theme-toggle');
    if (toggleBtn) {
      const icon = App.theme === 'light' ? 'moon' : 'sun';
      toggleBtn.innerHTML = `<i data-lucide="${icon}"></i>`;
      if (window.lucide) {
        lucide.createIcons();
      }
    }
  }
};

// ========================================
// Sidebar Component
// ========================================

const Sidebar = {
  render(currentPage = '') {
    const user = Storage.getUser();
    const initials = user ? Utils.getInitials(user.name) : 'U';

    return `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon">
            <i data-lucide="target"></i>
          </div>
          <span class="sidebar-logo-text">HabitFlow</span>
        </div>

        <nav class="sidebar-nav">
          <a href="dashboard.html" class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}">
            <i data-lucide="layout-dashboard"></i>
            <span>Dashboard</span>
          </a>
          <a href="habits.html" class="nav-item ${currentPage === 'habits' ? 'active' : ''}">
            <i data-lucide="list-checks"></i>
            <span>Habits</span>
          </a>
          <a href="calendar.html" class="nav-item ${currentPage === 'calendar' ? 'active' : ''}">
            <i data-lucide="calendar"></i>
            <span>Calendar</span>
          </a>
          <a href="analytics.html" class="nav-item ${currentPage === 'analytics' ? 'active' : ''}">
            <i data-lucide="bar-chart-3"></i>
            <span>Analytics</span>
          </a>
          <a href="achievements.html" class="nav-item ${currentPage === 'achievements' ? 'active' : ''}">
            <i data-lucide="trophy"></i>
            <span>Achievements</span>
          </a>
          <a href="reminders.html" class="nav-item ${currentPage === 'reminders' ? 'active' : ''}">
            <i data-lucide="bell"></i>
            <span>Reminders</span>
          </a>
          <a href="profile.html" class="nav-item ${currentPage === 'profile' ? 'active' : ''}">
            <i data-lucide="user"></i>
            <span>Profile</span>
          </a>
          <a href="settings.html" class="nav-item ${currentPage === 'settings' ? 'active' : ''}">
            <i data-lucide="settings"></i>
            <span>Settings</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <a href="#" class="nav-item" onclick="Auth.logout(); return false;">
            <i data-lucide="log-out"></i>
            <span>Logout</span>
          </a>
        </div>
      </aside>
      <div class="sidebar-overlay" id="sidebarOverlay" onclick="Sidebar.toggleMobile()"></div>
    `;
  },

  toggleMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  },

  closeMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }
};

// ========================================
// Navbar Component
// ========================================

const Navbar = {
  render(title = '') {
    const user = Storage.getUser();
    const initials = user ? Utils.getInitials(user.name) : 'U';

    return `
      <nav class="navbar">
        <div class="navbar-left">
          <button class="menu-toggle show-mobile" onclick="Sidebar.toggleMobile()">
            <i data-lucide="menu"></i>
          </button>
          <h1 class="navbar-title">${title}</h1>
        </div>

        <div class="navbar-right">
          <button class="theme-toggle" onclick="Theme.toggle()" title="Toggle theme">
            <i data-lucide="${App.theme === 'light' ? 'moon' : 'sun'}"></i>
          </button>
          <a href="profile.html" class="navbar-user">
            <div class="navbar-avatar">
              ${user?.profileImage
                ? `<img src="${user.profileImage}" alt="${user.name}">`
                : initials
              }
            </div>
            <div class="navbar-user-info">
              <div class="navbar-user-name">${user?.name || 'User'}</div>
              <div class="navbar-user-email">${user?.email || ''}</div>
            </div>
          </a>
        </div>
      </nav>
    `;
  }
};

// ========================================
// Statistics Calculation
// ========================================

const Stats = {
  // Get today's completion count
  getTodayCompleted() {
    const today = Utils.formatDate(new Date());
    const logs = Storage.getLogs();
    const habits = Storage.getHabits();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);

    return logs.filter(log => {
      const habit = userHabits.find(h => h.id === log.habitId);
      return habit && log.date === today && log.completed;
    }).length;
  },

  // Get total habits count
  getTotalHabits() {
    const habits = Storage.getHabits();
    return habits.filter(h => h.userId === App.currentUser?.id).length;
  },

  // Get pending habits for today
  getPendingToday() {
    const today = Utils.formatDate(new Date());
    const habits = Storage.getHabits();
    const logs = Storage.getLogs();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);

    return userHabits.filter(habit => {
      const log = logs.find(l => l.habitId === habit.id && l.date === today);
      return !log || !log.completed;
    }).length;
  },

  // Get today completion percentage
  getTodayPercentage() {
    const total = this.getTotalHabits();
    if (total === 0) return 0;
    const completed = this.getTodayCompleted();
    return Math.round((completed / total) * 100);
  },

  // Get current streak (days with all habits completed)
  getCurrentStreak() {
    const habits = Storage.getHabits();
    const logs = Storage.getLogs();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);

    if (userHabits.length === 0) return 0;

    let streak = 0;
    let date = new Date();

    while (true) {
      const dateStr = Utils.formatDate(date);
      const dayLogs = logs.filter(l => l.date === dateStr);
      const allCompleted = userHabits.every(habit =>
        dayLogs.some(log => log.habitId === habit.id && log.completed)
      );

      if (allCompleted && dayLogs.length > 0) {
        streak++;
        date.setDate(date.getDate() - 1);
      } else if (Utils.isSameDay(date, new Date())) {
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  },

  // Get highest individual streak
  getHighestStreak() {
    const habits = Storage.getHabits();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);

    if (userHabits.length === 0) return 0;

    return Math.max(...userHabits.map(h => h.longestStreak || h.streak || 0), 0);
  },

  // Get total completions
  getTotalCompletions() {
    const logs = Storage.getLogs();
    const habits = Storage.getHabits();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);
    const userHabitIds = userHabits.map(h => h.id);

    return logs.filter(log =>
      userHabitIds.includes(log.habitId) && log.completed
    ).length;
  },

  // Get weekly progress data
  getWeeklyProgress() {
    const data = [];
    const habits = Storage.getHabits();
    const logs = Storage.getLogs();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = Utils.formatDate(date);

      const completed = logs.filter(log =>
        log.date === dateStr && userHabits.some(h => h.id === log.habitId) && log.completed
      ).length;

      data.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed,
        total: userHabits.length,
        percentage: userHabits.length > 0 ? Math.round((completed / userHabits.length) * 100) : 0
      });
    }

    return data;
  },

  // Get monthly progress data
  getMonthlyProgress() {
    const data = [];
    const habits = Storage.getHabits();
    const logs = Storage.getLogs();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = Utils.formatDate(date);

      const completed = logs.filter(log =>
        log.date === dateStr && userHabits.some(h => h.id === log.habitId) && log.completed
      ).length;

      data.push({
        date: dateStr,
        completed,
        total: userHabits.length,
        percentage: userHabits.length > 0 ? Math.round((completed / userHabits.length) * 100) : 0
      });
    }

    return data;
  },

  // Get category distribution
  getCategoryDistribution() {
    const habits = Storage.getHabits();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);
    const distribution = {};

    userHabits.forEach(habit => {
      distribution[habit.category] = (distribution[habit.category] || 0) + 1;
    });

    return Object.entries(distribution).map(([category, count]) => ({
      category,
      label: App.categories[category]?.name || category,
      count,
      percentage: Math.round((count / userHabits.length) * 100)
    }));
  },

  // Get heatmap data
  getHeatmapData() {
    const data = [];
    const habits = Storage.getHabits();
    const logs = Storage.getLogs();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);
    const userHabitIds = userHabits.map(h => h.id);

    for (let i = 364; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = Utils.formatDate(date);

      const completed = logs.filter(log =>
        log.date === dateStr && userHabitIds.includes(log.habitId) && log.completed
      ).length;

      data.push({
        date: dateStr,
        count: completed,
        level: completed === 0 ? 0 : completed <= 2 ? 1 : completed <= 4 ? 2 : completed <= 6 ? 3 : 4
      });
    }

    return data;
  },

  // Get most consistent habit
  getMostConsistentHabit() {
    const habits = Storage.getHabits();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);

    if (userHabits.length === 0) return null;

    return userHabits.reduce((max, habit) =>
      (habit.streak || 0) > (max.streak || 0) ? habit : max
    , userHabits[0]);
  }
};

// ========================================
// Streak Calculation
// ========================================

const Streak = {
  // Calculate streak for a habit
  calculateStreak(habitId) {
    const logs = Storage.getLogs();
    const habitLogs = logs
      .filter(l => l.habitId === habitId && l.completed)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (habitLogs.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();

    const todayStr = Utils.formatDate(new Date());
    const latestLog = habitLogs[0];

    if (latestLog.date === todayStr) {
      streak = 1;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      const yesterdayStr = Utils.formatDate(new Date(Date.now() - 86400000));
      if (latestLog.date !== yesterdayStr) {
        return 0;
      }
      streak = 1;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    for (let i = 1; i < habitLogs.length; i++) {
      const expectedDate = Utils.formatDate(currentDate);
      if (habitLogs[i].date === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  },

  // Update streak for a habit
  updateStreak(habitId) {
    const habits = Storage.getHabits();
    const habitIndex = habits.findIndex(h => h.id === habitId);

    if (habitIndex === -1) return;

    const currentStreak = this.calculateStreak(habitId);
    const prevLongestStreak = habits[habitIndex].longestStreak || 0;

    habits[habitIndex].streak = currentStreak;
    habits[habitIndex].longestStreak = Math.max(prevLongestStreak, currentStreak);

    Storage.saveHabits(habits);

    return { currentStreak, longestStreak: habits[habitIndex].longestStreak };
  }
};

// ========================================
// Achievement System
// ========================================

const Achievements = {
  // Check and unlock achievements
  checkAchievements() {
    const unlocked = Storage.getAchievements();
    const newAchievements = [];

    App.achievementDefs.forEach(def => {
      const alreadyUnlocked = unlocked.some(a => a.id === def.id);
      if (alreadyUnlocked) return;

      let progress = 0;

      switch (def.type) {
        case 'habits_created':
          progress = Stats.getTotalHabits();
          break;
        case 'streak':
          progress = Stats.getHighestStreak();
          break;
        case 'total_completions':
          progress = Stats.getTotalCompletions();
          break;
        case 'monthly_completions':
          const monthLogs = Storage.getLogs().filter(l =>
            new Date(l.date).getMonth() === new Date().getMonth() && l.completed
          );
          progress = monthLogs.length;
          break;
        case 'perfect_days':
          const weeklyData = Stats.getWeeklyProgress();
          progress = weeklyData.filter(d => d.percentage === 100).length;
          break;
        case 'daily_targets_completed':
          progress = DailyTargets.getTotalCompleted();
          break;
        case 'daily_targets_streak':
          progress = DailyTargets.getStreak();
          break;
        case 'total_daily_targets':
          progress = DailyTargets.getAllTimeCompleted();
          break;
        default:
          progress = 0;
      }

      if (progress >= def.requirement) {
        const achievement = {
          id: def.id,
          unlockedDate: Utils.formatDate(new Date()),
          progress: progress
        };
        newAchievements.push(achievement);
        unlocked.push(achievement);

        Toast.success('Achievement Unlocked!', def.name);
      }
    });

    if (newAchievements.length > 0) {
      Storage.saveAchievements(unlocked);
      App.achievements = unlocked;
    }

    return newAchievements;
  },

  // Get all achievements with status
  getAllAchievements() {
    const unlocked = Storage.getAchievements();

    return App.achievementDefs.map(def => {
      const unlockedData = unlocked.find(a => a.id === def.id);
      return {
        ...def,
        unlocked: !!unlockedData,
        unlockedDate: unlockedData?.unlockedDate,
        progress: unlockedData?.progress
      };
    });
  }
};

// ========================================
// Daily Targets Module (Today's Tasks Checklist)
// ========================================

const DailyTargets = {
  targetCategories: {
    study: { name: 'Study', color: '#6366f1', icon: 'book-open' },
    health: { name: 'Health', color: '#22c55e', icon: 'heart' },
    fitness: { name: 'Fitness', color: '#f59e0b', icon: 'dumbbell' },
    work: { name: 'Work', color: '#3b82f6', icon: 'briefcase' },
    personal: { name: 'Personal', color: '#a855f7', icon: 'user' },
    custom: { name: 'Custom', color: '#64748b', icon: 'star' }
  },

  priorities: {
    high: { name: 'High', color: '#ef4444', icon: 'alert-circle' },
    medium: { name: 'Medium', color: '#f59e0b', icon: 'minus-circle' },
    low: { name: 'Low', color: '#22c55e', icon: 'arrow-down-circle' }
  },

  // Get today's targets
  getTodayTargets() {
    const today = Utils.formatDate(new Date());
    const targets = Storage.getDailyTargets();
    return targets.filter(t => t.date === today && t.userId === App.currentUser?.id);
  },

  // Get all user targets
  getAllUserTargets() {
    const targets = Storage.getDailyTargets();
    return targets.filter(t => t.userId === App.currentUser?.id);
  },

  // Add new target
  addTarget(target) {
    const targets = Storage.getDailyTargets();
    const newTarget = {
      id: Utils.generateId(),
      userId: App.currentUser?.id,
      date: Utils.formatDate(new Date()),
      title: target.title,
      notes: target.notes || '',
      category: target.category || 'personal',
      priority: target.priority || 'medium',
      completed: false,
      createdDate: Utils.formatDate(new Date())
    };
    targets.push(newTarget);
    Storage.saveDailyTargets(targets);
    Achievements.checkAchievements();
    return newTarget;
  },

  // Toggle target completion
  toggleTarget(targetId) {
    const targets = Storage.getDailyTargets();
    const target = targets.find(t => t.id === targetId);
    if (target) {
      target.completed = !target.completed;
      Storage.saveDailyTargets(targets);
      Achievements.checkAchievements();
      return target;
    }
    return null;
  },

  // Update target
  updateTarget(targetId, updates) {
    const targets = Storage.getDailyTargets();
    const target = targets.find(t => t.id === targetId);
    if (target) {
      Object.assign(target, updates);
      Storage.saveDailyTargets(targets);
      return target;
    }
    return null;
  },

  // Delete target
  deleteTarget(targetId) {
    const targets = Storage.getDailyTargets();
    const filtered = targets.filter(t => t.id !== targetId);
    Storage.saveDailyTargets(filtered);
  },

  // Get completion stats for today
  getTodayStats() {
    const targets = this.getTodayTargets();
    const completed = targets.filter(t => t.completed).length;
    const total = targets.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  },

  // Get total completed (all time)
  getTotalCompleted() {
    const targets = this.getAllUserTargets();
    return targets.filter(t => t.completed).length;
  },

  // Get all time completed
  getAllTimeCompleted() {
    return this.getTotalCompleted();
  },

  // Get streak (days with all targets completed)
  getStreak() {
    const history = Storage.getTargetHistory();
    if (history.length === 0) return 0;

    let streak = 0;
    let date = new Date();

    while (true) {
      const dateStr = Utils.formatDate(date);
      const dayHistory = history.find(h => h.date === dateStr && h.userId === App.currentUser?.id);

      if (dayHistory && dayHistory.percentage >= 100) {
        streak++;
        date.setDate(date.getDate() - 1);
      } else if (Utils.isSameDay(date, new Date())) {
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  },

  // Archive today's targets to history at end of day
  archiveToHistory() {
    const today = Utils.formatDate(new Date());
    const targets = this.getTodayTargets();
    const stats = this.getTodayStats();

    if (targets.length === 0) return;

    const history = Storage.getTargetHistory();
    const existingIndex = history.findIndex(h => h.date === today && h.userId === App.currentUser?.id);

    const historyEntry = {
      date: today,
      userId: App.currentUser?.id,
      completed: stats.completed,
      total: stats.total,
      percentage: stats.percentage,
      targets: targets.map(t => ({
        title: t.title,
        category: t.category,
        priority: t.priority,
        completed: t.completed
      }))
    };

    if (existingIndex >= 0) {
      history[existingIndex] = historyEntry;
    } else {
      history.push(historyEntry);
    }

    Storage.saveTargetHistory(history);
  },

  // Get history data for analytics
  getHistoryData(days = 30) {
    const history = Storage.getTargetHistory();
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = Utils.formatDate(date);
      const dayHistory = history.find(h => h.date === dateStr && h.userId === App.currentUser?.id);

      data.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: dayHistory?.completed || 0,
        total: dayHistory?.total || 0,
        percentage: dayHistory?.percentage || 0
      });
    }

    return data;
  },

  // Get target heatmap data for calendar
  getTargetHeatmapData() {
    const history = Storage.getTargetHistory();
    const data = [];

    for (let i = 364; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = Utils.formatDate(date);
      const dayHistory = history.find(h => h.date === dateStr && h.userId === App.currentUser?.id);

      let level = 0;
      if (dayHistory) {
        if (dayHistory.percentage >= 80) level = 4;
        else if (dayHistory.percentage >= 50) level = 3;
        else if (dayHistory.percentage > 0) level = 2;
        else level = 1;
      }

      data.push({
        date: dateStr,
        percentage: dayHistory?.percentage || 0,
        level
      });
    }

    return data;
  },

  // Get most productive day
  getMostProductiveDay() {
    const history = Storage.getTargetHistory().filter(h => h.userId === App.currentUser?.id);
    if (history.length === 0) return null;

    const dayStats = {};
    history.forEach(h => {
      const day = new Date(h.date).toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayStats[day]) {
        dayStats[day] = { total: 0, count: 0 };
      }
      dayStats[day].total += h.percentage;
      dayStats[day].count++;
    });

    let bestDay = null;
    let bestAvg = 0;

    Object.entries(dayStats).forEach(([day, stats]) => {
      const avg = stats.total / stats.count;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestDay = day;
      }
    });

    return bestDay;
  }
};

// ========================================
// Charts Module (Canvas-based)
// ========================================

const Charts = {
  colors: {
    primary: '#6366f1',
    secondary: '#a855f7',
    accent: '#06b6d4',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    grid: 'rgba(148, 163, 184, 0.2)',
    text: '#64748b'
  },

  // Create line chart
  createLineChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { label = 'Progress', color = this.colors.primary } = options;

    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 250;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.colors.text = isDark ? '#94a3b8' : '#64748b';
    this.colors.grid = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)';

    ctx.strokeStyle = this.colors.grid;
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding + (height - 2 * padding) * (i / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    const maxValue = Math.max(...data.map(d => d.value || d.percentage || 0), 100);
    const points = data.map((d, i) => ({
      x: padding + (width - 2 * padding) * (i / (data.length - 1 || 1)),
      y: height - padding - (height - 2 * padding) * ((d.value || d.percentage || 0) / maxValue)
    }));

    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');

    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
      ctx.fill();
    });

    ctx.fillStyle = this.colors.text;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';

    data.forEach((d, i) => {
      const x = padding + (width - 2 * padding) * (i / (data.length - 1 || 1));
      ctx.fillText(d.label || d.day || '', x, height - padding + 20);
    });

    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height - 2 * padding) * (i / 5);
      const value = Math.round(maxValue * (1 - i / 5));
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }
  },

  // Create bar chart
  createBarChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { label = 'Completions', color = this.colors.primary } = options;

    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 250;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.colors.text = isDark ? '#94a3b8' : '#64748b';

    const maxValue = Math.max(...data.map(d => d.value || d.completed || d.count || 0), 1);
    const barWidth = (width - 2 * padding) / data.length - 8;

    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding + (height - 2 * padding) * (i / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    data.forEach((d, i) => {
      const value = d.value || d.completed || d.count || 0;
      const barHeight = (value / maxValue) * (height - 2 * padding);
      const x = padding + i * ((width - 2 * padding) / data.length) + 4;
      const y = height - padding - barHeight;

      const gradient = ctx.createLinearGradient(x, y, x, height - padding);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '80');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
      ctx.fill();

      ctx.fillStyle = this.colors.text;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label || d.day || '', x + barWidth / 2, height - padding + 20);

      if (value > 0) {
        ctx.fillStyle = color;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(value.toString(), x + barWidth / 2, y - 8);
      }
    });

    ctx.fillStyle = this.colors.text;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 5; i++) {
      const y = padding + (height - 2 * padding) * (i / 5);
      const value = Math.round(maxValue * (1 - i / 5));
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }
  },

  // Create pie chart
  createPieChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 250;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 3;
    const centerY = height / 2;
    const radius = Math.min(width / 3, height / 2) - 20;

    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.colors.text = isDark ? '#94a3b8' : '#64748b';

    const colors = [
      this.colors.primary,
      this.colors.secondary,
      this.colors.accent,
      this.colors.success,
      this.colors.warning,
      this.colors.error,
      '#8b5cf6'
    ];

    const total = data.reduce((sum, d) => sum + (d.count || d.value || 0), 0);

    if (total === 0) {
      ctx.fillStyle = isDark ? '#334155' : '#e2e8f0';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.colors.text;
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data', centerX, centerY + 5);
      return;
    }

    let angle = -Math.PI / 2;

    data.forEach((d, i) => {
      const value = d.count || d.value || 0;
      if (value === 0) return;

      const sliceAngle = (value / total) * Math.PI * 2;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      angle += sliceAngle;
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
    ctx.fill();

    ctx.fillStyle = isDark ? '#f8fafc' : '#1e293b';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(total.toString(), centerX, centerY + 8);

    const legendX = width * 0.65;
    let legendY = 30;

    data.forEach((d, i) => {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(legendX, legendY - 10, 16, 16);

      ctx.fillStyle = isDark ? '#f8fafc' : '#1e293b';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${d.label || d.category} (${d.percentage || d.count}%)`, legendX + 24, legendY + 2);

      legendY += 28;
    });
  },

  // Create area chart
  createAreaChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { color = this.colors.accent } = options;

    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 250;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.colors.text = isDark ? '#94a3b8' : '#64748b';

    const maxValue = Math.max(...data.map(d => d.value || d.percentage || 0), 100);
    const points = data.map((d, i) => ({
      x: padding + (width - 2 * padding) * (i / (data.length - 1 || 1)),
      y: height - padding - (height - 2 * padding) * ((d.value || d.percentage || 0) / maxValue)
    }));

    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding + (height - 2 * padding) * (i / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, color + '60');
    gradient.addColorStop(1, color + '05');

    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding);

    for (let i = 0; i < points.length - 1; i++) {
      const xMid = (points[i].x + points[i + 1].x) / 2;
      const yMid = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xMid, yMid);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.lineTo(points[points.length - 1].x, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    for (let i = 0; i < points.length - 1; i++) {
      const xMid = (points[i].x + points[i + 1].x) / 2;
      const yMid = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xMid, yMid);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();

    ctx.fillStyle = this.colors.text;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';

    data.forEach((d, i) => {
      const x = padding + (width - 2 * padding) * (i / (data.length - 1 || 1));
      if (i % 5 === 0) {
        ctx.fillText(d.label || '', x, height - padding + 20);
      }
    });

    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height - 2 * padding) * (i / 5);
      const value = Math.round(maxValue * (1 - i / 5));
      ctx.fillText(value + '%', padding - 10, y + 4);
    }
  }
};

// ========================================
// Export Module
// ========================================

const Export = {
  // Export to CSV
  toCSV(data, filename) {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    this.download(csvContent, filename + '.csv', 'text/csv');
  },

  // Export to Excel (simple XML-based)
  toExcel(data, filename) {
    const headers = Object.keys(data[0] || {});

    let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">';
    xml += '<Worksheet><Table>';

    xml += '<Row>';
    headers.forEach(h => {
      xml += `<Cell><Data Type="String">${h}</Data></Cell>`;
    });
    xml += '</Row>';

    data.forEach(row => {
      xml += '<Row>';
      headers.forEach(h => {
        xml += `<Cell><Data Type="String">${row[h] || ''}</Data></Cell>`;
      });
      xml += '</Row>';
    });

    xml += '</Table></Worksheet></Workbook>';

    this.download(xml, filename + '.xls', 'application/vnd.ms-excel');
  },

  // Export to PDF (basic text-based)
  toPDF(content, filename) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #6366f1; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #6366f1; color: white; }
          tr:nth-child(even) { background: #f8f9fa; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  },

  // Download helper
  download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Toast.success('Export Complete', `${filename} has been downloaded`);
  },

  // Export habits data
  exportHabits() {
    const habits = Storage.getHabits();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);
    const exportData = userHabits.map(h => ({
      Title: h.title,
      Category: h.category,
      Frequency: h.frequency,
      'Current Streak': h.streak || 0,
      'Longest Streak': h.longestStreak || 0,
      'Created Date': h.createdDate,
      Notes: h.notes || ''
    }));

    this.toCSV(exportData, 'habits_export');
  },

  // Export full report
  exportFullReport() {
    const habits = Storage.getHabits();
    const logs = Storage.getLogs();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);

    const content = `
      <h1>Habit Tracker Report</h1>
      <p>Generated on: ${Utils.formatDisplayDate(new Date())}</p>
      <p>User: ${App.currentUser?.name}</p>

      <h2>Summary</h2>
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Habits</td><td>${Stats.getTotalHabits()}</td></tr>
        <tr><td>Total Completions</td><td>${Stats.getTotalCompletions()}</td></tr>
        <tr><td>Current Streak</td><td>${Stats.getCurrentStreak()} days</td></tr>
        <tr><td>Highest Streak</td><td>${Stats.getHighestStreak()} days</td></tr>
      </table>

      <h2>Habits</h2>
      <table>
        <tr>
          <th>Habit</th>
          <th>Category</th>
          <th>Streak</th>
          <th>Longest Streak</th>
        </tr>
        ${userHabits.map(h => `
          <tr>
            <td>${h.title}</td>
            <td>${h.category}</td>
            <td>${h.streak || 0}</td>
            <td>${h.longestStreak || 0}</td>
          </tr>
        `).join('')}
      </table>
    `;

    this.toPDF(content, 'habit_report');
  }
};

// ========================================
// Notification System
// ========================================

const Notifications = {
  // Request permission
  async requestPermission() {
    if (!('Notification' in window)) {
      Toast.warning('Notifications Not Supported', 'Your browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  // Show notification
  show(title, options = {}) {
    if (Notification.permission !== 'granted') return;

    const notification = new Notification(title, {
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1"><circle cx="12" cy="12" r="10"/></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1"><circle cx="12" cy="12" r="10"/></svg>',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  },

  // Schedule reminder
  scheduleReminder(habitId, time) {
    const habits = Storage.getHabits();
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const reminders = Storage.load('habitTracker_reminders') || {};

    if (time) {
      reminders[habitId] = {
        time,
        title: habit.title,
        enabled: true
      };
      Storage.save('habitTracker_reminders', reminders);
    }
  },

  // Check reminders (call periodically)
  checkReminders() {
    const reminders = Storage.load('habitTracker_reminders') || {};
    const currentTime = Utils.getCurrentTime();

    Object.entries(reminders).forEach(([habitId, reminder]) => {
      if (reminder.enabled && reminder.time === currentTime) {
        this.show('Habit Reminder', {
          body: `Time to ${reminder.title}!`,
          tag: habitId
        });
      }
    });
  }
};

// ========================================
// Page Layout Helper
// ========================================

const Page = {
  // Render app layout
  render(pageTitle, currentPage, content) {
    return `
      <div class="app-layout">
        ${Sidebar.render(currentPage)}
        <main class="main-content">
          ${Navbar.render(pageTitle)}
          <div class="page-container animate-fade-in">
            ${content}
          </div>
        </main>
      </div>
      <div id="toast-container"></div>
    `;
  },

  // Check authentication
  requireAuth() {
    const user = Storage.getUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    App.currentUser = user;
    return user;
  },

  // Render empty state
  emptyState(icon, title, description, buttonText, buttonAction) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i data-lucide="${icon}"></i>
        </div>
        <h3 class="empty-state-title">${title}</h3>
        <p class="empty-state-description">${description}</p>
        ${buttonText ? `
          <button class="btn btn-primary btn-lg" onclick="${buttonAction}">
            <i data-lucide="plus"></i>
            ${buttonText}
          </button>
        ` : ''}
      </div>
    `;
  },

  // Render stat card
  statCard(icon, iconColor, value, label, change = null) {
    return `
      <div class="stat-card">
        <div class="stat-icon ${iconColor}">
          <i data-lucide="${icon}"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${value}</div>
          <div class="stat-label">${label}</div>
          ${change !== null ? `
            <div class="stat-change ${change >= 0 ? 'positive' : 'negative'}">
              <i data-lucide="${change >= 0 ? 'trending-up' : 'trending-down'}"></i>
              ${Math.abs(change)}%
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  // Render habit card
  habitCard(habit, completed = false) {
    const categoryInfo = App.categories[habit.category] || { name: habit.category, color: 'primary', icon: 'circle' };

    return `
      <div class="habit-card ${completed ? 'completed' : ''}" data-habit-id="${habit.id}">
        <div class="habit-header">
          <div class="habit-checkbox ${completed ? 'checked' : ''}" onclick="Habits.toggleComplete('${habit.id}')">
            <i data-lucide="${completed ? 'check' : ''}"></i>
          </div>
          <div class="habit-info">
            <h4 class="habit-title">${habit.title}</h4>
            <div class="habit-meta">
              <span class="habit-badge ${habit.category}">${categoryInfo.name}</span>
              <span class="habit-badge">${habit.frequency}</span>
              ${habit.reminderTime ? `<span class="habit-badge"><i data-lucide="clock" style="width:12px;height:12px"></i> ${Utils.formatTime(habit.reminderTime)}</span>` : ''}
            </div>
          </div>
          <div class="habit-streak">
            <i data-lucide="flame"></i>
            ${habit.streak || 0} days
          </div>
        </div>
        ${habit.notes ? `<div class="habit-notes">${habit.notes}</div>` : ''}
        <div class="habit-actions">
          <button class="btn btn-icon-sm btn-ghost" onclick="Habits.edit('${habit.id}')" title="Edit">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn btn-icon-sm btn-ghost" onclick="Habits.delete('${habit.id}')" title="Delete">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `;
  },

  // Render achievement card
  achievementCard(achievement) {
    return `
      <div class="achievement-card ${!achievement.unlocked ? 'locked' : ''}">
        <div class="achievement-icon">
          <i data-lucide="${achievement.icon}"></i>
        </div>
        <h4 class="achievement-title">${achievement.name}</h4>
        <p class="achievement-description">${achievement.description}</p>
        ${achievement.unlocked ? `
          <div class="achievement-date">Unlocked ${Utils.formatShortDate(achievement.unlockedDate)}</div>
        ` : `
          <div class="achievement-progress">
            <div class="progress-container">
              <div class="progress-bar" style="width: ${Math.min((achievement.progress || 0) / achievement.requirement * 100, 100)}%"></div>
            </div>
            <div class="achievement-progress-value">${achievement.progress || 0} / ${achievement.requirement}</div>
          </div>
        `}
      </div>
    `;
  }
};

// ========================================
// Initialize Application
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme
  Theme.init();

  // Initialize current user
  App.currentUser = Storage.getUser();

  // Load data
  App.habits = Storage.getHabits();
  App.habitLogs = Storage.getLogs();
  App.achievements = Storage.getAchievements();

  // Start notification checker
  setInterval(() => Notifications.checkReminders(), 60000);

  // Archive daily targets history periodically
  DailyTargets.archiveToHistory();
  setInterval(() => DailyTargets.archiveToHistory(), 3600000);
});

// Export for use in other modules
window.App = App;
window.Utils = Utils;
window.Storage = Storage;
window.Toast = Toast;
window.Modal = Modal;
window.Theme = Theme;
window.Sidebar = Sidebar;
window.Navbar = Navbar;
window.Stats = Stats;
window.Streak = Streak;
window.Achievements = Achievements;
window.Charts = Charts;
window.Export = Export;
window.Notifications = Notifications;
window.Page = Page;
window.DailyTargets = DailyTargets;
