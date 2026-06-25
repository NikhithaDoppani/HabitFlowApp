/**
 * Habit Tracker - Reminders Module
 * Browser notification reminders for habits
 */

const Reminders = {
  // Initialize reminders page
  init() {
    if (!Page.requireAuth()) return;

    this.render();
    this.loadData();
    this.checkNotificationPermission();
  },

  // Render reminders page
  render() {
    document.body.innerHTML = Page.render('Reminders', 'reminders', `
      <!-- Notification Permission Banner -->
      <div class="card" id="permissionBanner" style="margin-bottom: var(--space-6); display: none;">
        <div style="display: flex; align-items: center; gap: var(--space-4);">
          <div style="width: 48px; height: 48px; border-radius: var(--radius-lg); background: var(--warning-100); color: var(--warning-600); display: flex; align-items: center; justify-content: center;">
            <i data-lucide="bell-ring"></i>
          </div>
          <div style="flex: 1;">
            <h4>Enable Notifications</h4>
            <p style="font-size: var(--font-size-sm); color: var(--text-tertiary); margin: 0;">Allow notifications to receive habit reminders</p>
          </div>
          <button class="btn btn-primary" onclick="Reminders.requestPermission()">
            <i data-lucide="bell"></i>
            Enable
          </button>
        </div>
      </div>

      <!-- Active Reminders -->
      <div class="card" style="margin-bottom: var(--space-6);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
          <h3>Active Reminders</h3>
          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn-sm btn-ghost" onclick="Reminders.enableAll()">Enable All</button>
            <button class="btn btn-sm btn-ghost" onclick="Reminders.disableAll()">Disable All</button>
          </div>
        </div>
        <div id="remindersList">
          <!-- Reminders will be rendered here -->
        </div>
      </div>

      <!-- Reminder Settings -->
      <div class="card">
        <h3 style="margin-bottom: var(--space-4);">Reminder Settings</h3>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Browser Notifications</div>
            <div class="settings-item-description">Receive push notifications for habit reminders</div>
          </div>
          <button class="toggle" id="notificationsToggle" onclick="Reminders.toggleNotifications()"></button>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Sound Alerts</div>
            <div class="settings-item-description">Play a sound when reminders trigger</div>
          </div>
          <button class="toggle" id="soundToggle" onclick="Reminders.toggleSound()"></button>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Quiet Hours</div>
            <div class="settings-item-description">No reminders between 10 PM and 7 AM</div>
          </div>
          <button class="toggle" id="quietHoursToggle" onclick="Reminders.toggleQuietHours()"></button>
        </div>
      </div>
    `);
  },

  // Load reminder data
  loadData() {
    this.renderReminders();
    this.updateToggles();
  },

  // Check notification permission
  async checkNotificationPermission() {
    const banner = document.getElementById('permissionBanner');

    if (!('Notification' in window)) {
      if (banner) {
        banner.innerHTML = `
          <div style="text-align: center; padding: var(--space-4);">
            <i data-lucide="alert-circle" style="width: 32px; height: 32px; color: var(--warning-500); margin-bottom: var(--space-2);"></i>
            <p style="color: var(--text-secondary);">Your browser does not support notifications</p>
          </div>
        `;
        banner.style.display = 'block';
      }
      return false;
    }

    if (Notification.permission === 'default') {
      if (banner) banner.style.display = 'block';
      return false;
    }

    if (banner) banner.style.display = 'none';
    return Notification.permission === 'granted';
  },

  // Request notification permission
  async requestPermission() {
    const granted = await Notifications.requestPermission();
    const banner = document.getElementById('permissionBanner');

    if (granted) {
      Toast.success('Notifications Enabled', 'You will receive habit reminders');
      if (banner) banner.style.display = 'none';
      this.updateToggles();
    } else {
      Toast.error('Permission Denied', 'Please enable notifications in your browser settings');
    }
  },

  // Render reminders list
  renderReminders() {
    const container = document.getElementById('remindersList');
    if (!container) return;

    const habits = Storage.getHabits();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id && h.reminderTime);

    if (userHabits.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: var(--space-8); color: var(--text-tertiary);">
          <i data-lucide="bell-off" style="width: 48px; height: 48px; margin-bottom: var(--space-3);"></i>
          <p>No reminders set</p>
          <p style="font-size: var(--font-size-sm);">Add a reminder time to your habits to see them here</p>
          <a href="habits.html" class="btn btn-ghost" style="margin-top: var(--space-4);">
            <i data-lucide="plus"></i>
            Add Habits
          </a>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = userHabits.map(habit => {
      const isActive = habit.reminderEnabled !== false;

      return `
        <div class="reminder-card" style="margin-bottom: var(--space-3);">
          <div class="reminder-icon">
            <i data-lucide="bell"></i>
          </div>
          <div class="reminder-info">
            <div class="reminder-title">${habit.title}</div>
            <div class="reminder-time">
              <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
              ${Utils.formatTime(habit.reminderTime)}
            </div>
          </div>
          <button class="reminder-toggle ${isActive ? 'active' : ''}" onclick="Reminders.toggleReminder('${habit.id}')"></button>
          <button class="btn btn-icon-sm btn-ghost" onclick="Habits.edit('${habit.id}')" title="Edit">
            <i data-lucide="pencil"></i>
          </button>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  },

  // Toggle individual reminder
  toggleReminder(habitId) {
    const habits = Storage.getHabits();
    const habitIndex = habits.findIndex(h => h.id === habitId);

    if (habitIndex >= 0) {
      habits[habitIndex].reminderEnabled = !habits[habitIndex].reminderEnabled;
      Storage.saveHabits(habits);

      const status = habits[habitIndex].reminderEnabled ? 'enabled' : 'disabled';
      Toast.info(`Reminder ${status}`, habits[habitIndex].title);

      this.renderReminders();
    }
  },

  // Enable all reminders
  enableAll() {
    const habits = Storage.getHabits();
    habits.forEach(h => {
      if (h.reminderTime) {
        h.reminderEnabled = true;
      }
    });
    Storage.saveHabits(habits);
    Toast.success('All Reminders Enabled', '');
    this.renderReminders();
  },

  // Disable all reminders
  disableAll() {
    const habits = Storage.getHabits();
    habits.forEach(h => {
      if (h.reminderTime) {
        h.reminderEnabled = false;
      }
    });
    Storage.saveHabits(habits);
    Toast.info('All Reminders Disabled', '');
    this.renderReminders();
  },

  // Toggle notifications
  async toggleNotifications() {
    if (Notification.permission !== 'granted') {
      await this.requestPermission();
    }

    const settings = App.currentUser?.settings || {};
    settings.notifications = !settings.notifications;
    Auth.updateProfile({ settings });

    this.updateToggles();
    Toast.info(
      settings.notifications ? 'Notifications On' : 'Notifications Off',
      ''
    );
  },

  // Toggle sound
  toggleSound() {
    const settings = App.currentUser?.settings || {};
    settings.sound = !settings.sound;
    Auth.updateProfile({ settings });

    this.updateToggles();
  },

  // Toggle quiet hours
  toggleQuietHours() {
    const settings = App.currentUser?.settings || {};
    settings.quietHours = !settings.quietHours;
    Auth.updateProfile({ settings });

    this.updateToggles();
  },

  // Update toggle buttons
  updateToggles() {
    const settings = App.currentUser?.settings || {};

    const notificationsToggle = document.getElementById('notificationsToggle');
    const soundToggle = document.getElementById('soundToggle');
    const quietHoursToggle = document.getElementById('quietHoursToggle');

    if (notificationsToggle && Notification.permission === 'granted' && settings.notifications !== false) {
      notificationsToggle.classList.add('active');
    }

    if (soundToggle && settings.sound) {
      soundToggle.classList.add('active');
    }

    if (quietHoursToggle && settings.quietHours) {
      quietHoursToggle.classList.add('active');
    }
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('reminders.html')) {
    Reminders.init();
  }
});

window.Reminders = Reminders;
