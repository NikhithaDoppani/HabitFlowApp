/**
 * Habit Tracker - Settings Module
 * User settings and account management
 */

const Settings = {
  // Initialize settings page
  init() {
    if (!Page.requireAuth()) return;

    this.render();
    this.loadData();
  },

  // Render settings page
  render() {
    const user = App.currentUser;
    const settings = user?.settings || {};

    document.body.innerHTML = Page.render('Settings', 'settings', `
      <!-- Account Settings -->
      <div class="settings-section">
        <h3 class="settings-section-title">
          <i data-lucide="user"></i>
          Account Settings
        </h3>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Name</div>
            <div class="settings-item-description">${user?.name || 'Not set'}</div>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="Settings.openNameModal()">
            <i data-lucide="pencil"></i>
            Change
          </button>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Email</div>
            <div class="settings-item-description">${user?.email || 'Not set'}</div>
          </div>
          <span class="badge primary">Primary</span>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Password</div>
            <div class="settings-item-description">Last changed when account was created</div>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="Settings.openPasswordModal()">
            <i data-lucide="key"></i>
            Change
          </button>
        </div>
      </div>

      <!-- Appearance -->
      <div class="settings-section">
        <h3 class="settings-section-title">
          <i data-lucide="palette"></i>
          Appearance
        </h3>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Theme</div>
            <div class="settings-item-description">Choose between light and dark mode</div>
          </div>
          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn-sm ${App.theme === 'light' ? 'btn-primary' : 'btn-ghost'}" onclick="Settings.setTheme('light')">
              <i data-lucide="sun"></i>
              Light
            </button>
            <button class="btn btn-sm ${App.theme === 'dark' ? 'btn-primary' : 'btn-ghost'}" onclick="Settings.setTheme('dark')">
              <i data-lucide="moon"></i>
              Dark
            </button>
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div class="settings-section">
        <h3 class="settings-section-title">
          <i data-lucide="bell"></i>
          Notifications
        </h3>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Push Notifications</div>
            <div class="settings-item-description">Receive browser notifications for reminders</div>
          </div>
          <button class="toggle ${Notification.permission === 'granted' && settings.notifications !== false ? 'active' : ''}" id="pushNotificationsToggle" onclick="Settings.togglePushNotifications()"></button>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Sound Alerts</div>
            <div class="settings-item-description">Play a sound when reminders trigger</div>
          </div>
          <button class="toggle ${settings.sound ? 'active' : ''}" id="soundAlertsToggle" onclick="Settings.toggleSound()"></button>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Quiet Hours</div>
            <div class="settings-item-description">No reminders between 10 PM - 7 AM</div>
          </div>
          <button class="toggle ${settings.quietHours ? 'active' : ''}" id="quietHoursToggle" onclick="Settings.toggleQuietHours()"></button>
        </div>
      </div>

      <!-- Data Management -->
      <div class="settings-section">
        <h3 class="settings-section-title">
          <i data-lucide="database"></i>
          Data Management
        </h3>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Export All Data</div>
            <div class="settings-item-description">Download all your habits and logs</div>
          </div>
          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn-sm btn-ghost" onclick="Export.exportHabits()">
              <i data-lucide="file-text"></i>
              CSV
            </button>
            <button class="btn btn-sm btn-ghost" onclick="Export.toExcel(Export.getHabitData(), 'habits_export')">
              <i data-lucide="file-spreadsheet"></i>
              Excel
            </button>
          </div>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Import Data</div>
            <div class="settings-item-description">Import habits from a CSV file</div>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="Settings.importData()">
            <i data-lucide="upload"></i>
            Import
          </button>
          <input type="file" id="importInput" accept=".csv" style="display: none;" onchange="Settings.handleImport(this)">
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Clear Today's Targets</div>
            <div class="settings-item-description">Remove all daily targets for today</div>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="Settings.clearTodayTargets()" style="color: var(--warning-600);">
            <i data-lucide="rotate-ccw"></i>
            Clear
          </button>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Clear History</div>
            <div class="settings-item-description">Delete all completion logs but keep habits</div>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="Settings.clearHistory()" style="color: var(--warning-600);">
            <i data-lucide="trash-2"></i>
            Clear
          </button>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="settings-section" style="border: 2px solid var(--error-200); background: var(--error-50);">
        <h3 class="settings-section-title" style="color: var(--error-600);">
          <i data-lucide="alert-triangle"></i>
          Danger Zone
        </h3>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title" style="color: var(--error-600);">Delete Account</div>
            <div class="settings-item-description">Permanently delete your account and all data</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="Settings.deleteAccount()">
            <i data-lucide="trash-2"></i>
            Delete Account
          </button>
        </div>
      </div>

      <!-- About -->
      <div class="settings-section">
        <h3 class="settings-section-title">
          <i data-lucide="info"></i>
          About HabitFlow
        </h3>

        <div style="text-align: center; padding: var(--space-4);">
          <div style="width: 64px; height: 64px; margin: 0 auto var(--space-3); background: var(--gradient-primary); border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center;">
            <i data-lucide="target" style="width: 32px; height: 32px; color: white;"></i>
          </div>
          <h4 style="margin-bottom: var(--space-1);">HabitFlow</h4>
          <p style="font-size: var(--font-size-sm); color: var(--text-tertiary);">Version 1.0.0</p>
          <p style="font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: var(--space-3);">
            Build better habits, one day at a time.
          </p>
        </div>
      </div>
    `);

    lucide.createIcons();
  },

  // Load settings data
  loadData() {
    // Any additional data loading
  },

  // Open name change modal
  openNameModal() {
    const user = App.currentUser;

    Modal.open({
      title: 'Change Name',
      width: '400px',
      content: `
        <form id="nameForm" onsubmit="return false;">
          <div class="form-group">
            <label class="form-label">New Name</label>
            <input
              type="text"
              id="newName"
              class="form-input"
              value="${user?.name || ''}"
              required
              minlength="2"
              placeholder="Enter your new name"
            >
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="Settings.saveName()">Save</button>
      `
    });
  },

  // Save new name
  saveName() {
    const newName = document.getElementById('newName')?.value?.trim();

    if (!newName || newName.length < 2) {
      Toast.error('Error', 'Name must be at least 2 characters');
      return;
    }

    Auth.updateProfile({ name: newName });
    Toast.success('Name Updated', 'Your name has been changed');
    Modal.close();
    this.init();
  },

  // Open password change modal
  openPasswordModal() {
    Modal.open({
      title: 'Change Password',
      width: '400px',
      content: `
        <form id="passwordForm" onsubmit="return false;">
          <div class="form-group">
            <label class="form-label">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              class="form-input"
              required
              placeholder="Enter current password"
            >
          </div>

          <div class="form-group">
            <label class="form-label">New Password</label>
            <input
              type="password"
              id="newPassword"
              class="form-input"
              required
              minlength="6"
              placeholder="Enter new password"
            >
            <div class="form-hint">Minimum 6 characters</div>
          </div>

          <div class="form-group">
            <label class="form-label">Confirm New Password</label>
            <input
              type="password"
              id="confirmNewPassword"
              class="form-input"
              required
              placeholder="Confirm new password"
            >
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="Settings.savePassword()">Change Password</button>
      `
    });
  },

  // Save new password
  savePassword() {
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmNewPassword')?.value;

    if (newPassword !== confirmPassword) {
      Toast.error('Error', 'New passwords do not match');
      return;
    }

    const result = Auth.updatePassword(currentPassword, newPassword);

    if (result.success) {
      Toast.success('Password Updated', result.message);
      Modal.close();
    } else {
      Toast.error('Error', result.errors[0]);
    }
  },

  // Set theme
  setTheme(theme) {
    Theme.set(theme);
    this.init();
  },

  // Toggle push notifications
  async togglePushNotifications() {
    if (Notification.permission !== 'granted') {
      await Notifications.requestPermission();
    }

    const settings = App.currentUser?.settings || {};
    settings.notifications = !settings.notifications;
    Auth.updateProfile({ settings });

    Toast.info(
      settings.notifications ? 'Notifications Enabled' : 'Notifications Disabled',
      ''
    );
    this.init();
  },

  // Toggle sound
  toggleSound() {
    const settings = App.currentUser?.settings || {};
    settings.sound = !settings.sound;
    Auth.updateProfile({ settings });

    Toast.info(
      settings.sound ? 'Sound Enabled' : 'Sound Disabled',
      ''
    );
    this.init();
  },

  // Toggle quiet hours
  toggleQuietHours() {
    const settings = App.currentUser?.settings || {};
    settings.quietHours = !settings.quietHours;
    Auth.updateProfile({ settings });

    Toast.info(
      settings.quietHours ? 'Quiet Hours Enabled' : 'Quiet Hours Disabled',
      ''
    );
    this.init();
  },

  // Import data
  importData() {
    document.getElementById('importInput')?.click();
  },

  // Handle import
  handleImport(input) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');

        const habits = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= headers.length) {
            habits.push({
              id: Utils.generateId(),
              userId: App.currentUser?.id,
              title: values[0]?.replace(/"/g, '') || 'Imported Habit',
              category: values[1]?.replace(/"/g, '').toLowerCase() || 'personal',
              frequency: values[2]?.replace(/"/g, '').toLowerCase() || 'daily',
              streak: parseInt(values[3]) || 0,
              longestStreak: parseInt(values[4]) || 0,
              notes: values[6]?.replace(/"/g, '') || '',
              createdDate: values[5] || Utils.formatDate(new Date())
            });
          }
        }

        if (habits.length > 0) {
          const existingHabits = Storage.getHabits();
          Storage.saveHabits([...existingHabits, ...habits]);
          Toast.success('Import Successful', `Imported ${habits.length} habits`);
        }
      } catch (error) {
        Toast.error('Import Failed', 'Invalid CSV format');
      }
    };

    reader.readAsText(file);
    input.value = '';
  },

  // Clear today's targets
  clearTodayTargets() {
    Modal.confirm({
      title: 'Clear Today\'s Targets',
      message: 'This will remove all daily targets for today. This action cannot be undone.',
      type: 'warning',
      onConfirm: 'Settings.confirmClearTodayTargets'
    });
  },

  // Confirm clear today's targets
  confirmClearTodayTargets() {
    const today = Utils.formatDate(new Date());
    const targets = Storage.getDailyTargets();
    const filtered = targets.filter(t => !(t.date === today && t.userId === App.currentUser?.id));
    Storage.saveDailyTargets(filtered);
    Toast.success('Targets Cleared', 'All daily targets for today have been removed');
    this.init();
  },

  // Clear history
  clearHistory() {
    Modal.confirm({
      title: 'Clear History',
      message: 'This will delete all completion logs but keep your habits. This action cannot be undone.',
      type: 'warning',
      onConfirm: 'Settings.confirmClearHistory'
    });
  },

  // Confirm clear history
  confirmClearHistory() {
    const habits = Storage.getHabits();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);

    // Reset streaks
    userHabits.forEach(h => {
      h.streak = 0;
    });

    Storage.saveHabits(habits);

    // Clear logs
    Storage.saveLogs([]);

    Toast.success('History Cleared', 'All completion data has been removed');
  },

  // Delete account
  deleteAccount() {
    Modal.confirm({
      title: 'Delete Account',
      message: 'This will permanently delete your account and all your data. This action cannot be undone.',
      type: 'danger',
      onConfirm: 'Settings.confirmDeleteAccount'
    });
  },

  // Confirm delete account
  confirmDeleteAccount() {
    Auth.deleteAccount();
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('settings.html')) {
    Settings.init();
  }
});

window.Settings = Settings;
