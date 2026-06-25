/**
 * Habit Tracker - Dashboard Module
 * Main dashboard with stats, progress, overview, and Today's Targets
 */

const Dashboard = {
  // Initialize dashboard
  init() {
    if (!Page.requireAuth()) return;

    this.render();
    this.loadData();
    this.setupEventListeners();
  },

  // Render dashboard content
  render() {
    const user = App.currentUser;
    const greeting = Utils.getGreeting();

    document.body.innerHTML = Page.render('Dashboard', 'dashboard', `
      <!-- Greeting Section -->
      <div class="page-header">
        <h1 class="greeting">${greeting}, <span class="greeting-name">${user?.name || 'User'}</span></h1>
        <p class="page-subtitle">${Utils.formatDisplayDate(new Date())}</p>
      </div>

      <!-- Today's Targets Card (Top Priority) -->
      <div class="card" style="margin-bottom: var(--space-6); background: var(--gradient-primary); color: white; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -20px; right: -20px; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
        <div style="position: relative; z-index: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
            <h3 style="display: flex; align-items: center; gap: var(--space-2); margin: 0;">
              <i data-lucide="target" style="width: 24px; height: 24px;"></i>
              Today's Targets
            </h3>
            <button class="btn" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);" onclick="Dashboard.openAddTargetModal()">
              <i data-lucide="plus"></i>
              Add Target
            </button>
          </div>
          <div id="todayTargetsList" style="margin-bottom: var(--space-4);">
            <!-- Targets will be rendered here -->
          </div>
          <div id="todayTargetsProgress">
            <!-- Progress bar and stats -->
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid" id="statsGrid" style="margin-bottom: var(--space-6);">
        ${this.renderStatCards()}
      </div>

      <!-- Today's Progress -->
      <div class="card" style="margin-bottom: var(--space-6);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
          <h3>Today's Habits</h3>
          <span class="badge primary" id="todayPercentage">0%</span>
        </div>
        <div class="progress-container">
          <div class="progress-bar primary" id="todayProgressBar" style="width: 0%"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: var(--space-2); color: var(--text-tertiary); font-size: var(--font-size-sm);">
          <span id="completedToday">0 completed</span>
          <span id="totalHabits">0 total habits</span>
        </div>
      </div>

      <!-- Weekly Progress -->
      <div class="grid-cols-3" style="margin-bottom: var(--space-6);">
        <div class="card">
          <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
            <div style="width: 40px; height: 40px; border-radius: var(--radius-lg); background: var(--primary-100); color: var(--primary-500); display: flex; align-items: center; justify-content: center;">
              <i data-lucide="calendar-days"></i>
            </div>
            <div>
              <div style="font-size: var(--font-size-sm); color: var(--text-tertiary);">Today</div>
              <div style="font-weight: 600;" id="todayProgressValue">0%</div>
            </div>
          </div>
          <div class="progress-container" style="height: 8px;">
            <div class="progress-bar primary" id="todayMiniBar" style="width: 0%"></div>
          </div>
        </div>

        <div class="card">
          <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
            <div style="width: 40px; height: 40px; border-radius: var(--radius-lg); background: var(--accent-100); color: var(--accent-500); display: flex; align-items: center; justify-content: center;">
              <i data-lucide="calendar-range"></i>
            </div>
            <div>
              <div style="font-size: var(--font-size-sm); color: var(--text-tertiary);">This Week</div>
              <div style="font-weight: 600;" id="weekProgressValue">0%</div>
            </div>
          </div>
          <div class="progress-container" style="height: 8px;">
            <div class="progress-bar" id="weekMiniBar" style="width: 0%; background: var(--gradient-accent);"></div>
          </div>
        </div>

        <div class="card">
          <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
            <div style="width: 40px; height: 40px; border-radius: var(--radius-lg); background: var(--success-100); color: var(--success-500); display: flex; align-items: center; justify-content: center;">
              <i data-lucide="calendar"></i>
            </div>
            <div>
              <div style="font-size: var(--font-size-sm); color: var(--text-tertiary);">This Month</div>
              <div style="font-weight: 600;" id="monthProgressValue">0%</div>
            </div>
          </div>
          <div class="progress-container" style="height: 8px;">
            <div class="progress-bar" id="monthMiniBar" style="width: 0%"></div>
          </div>
        </div>
      </div>

      <div class="grid-cols-2" style="margin-bottom: var(--space-6);">
        <!-- Today's Habits -->
        <div class="card" id="todayHabitsCard">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
            <h3>Today's Habits</h3>
            <a href="habits.html" class="btn btn-sm btn-ghost">View All</a>
          </div>
          <div id="todayHabitsList">
            <!-- Habits will be rendered here -->
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card" id="recentActivityCard">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
            <h3>Recent Activity</h3>
            <a href="calendar.html" class="btn btn-sm btn-ghost">View All</a>
          </div>
          <div id="recentActivityList">
            <!-- Activity will be rendered here -->
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card">
        <h3 style="margin-bottom: var(--space-4);">Quick Actions</h3>
        <div class="quick-actions">
          <button class="btn btn-primary" onclick="Habits.openAddModal()">
            <i data-lucide="plus"></i>
            Add New Habit
          </button>
          <a href="calendar.html" class="btn btn-secondary">
            <i data-lucide="calendar"></i>
            View Calendar
          </a>
          <a href="analytics.html" class="btn btn-secondary">
            <i data-lucide="bar-chart-3"></i>
            View Analytics
          </a>
        </div>
      </div>
    `);
  },

  // Render stat cards
  renderStatCards() {
    const targetStats = DailyTargets.getTodayStats();
    const totalTargets = DailyTargets.getAllUserTargets().length;

    return `
      ${Page.statCard('list-checks', 'primary', Stats.getTotalHabits(), 'Total Habits')}
      ${Page.statCard('target', 'success', targetStats.completed, 'Targets Completed')}
      ${Page.statCard('clock', 'warning', targetStats.total - targetStats.completed, 'Pending Targets')}
      ${Page.statCard('percent', 'accent', targetStats.percentage + '%', 'Completion Rate')}
    `;
  },

  // Load and display data
  loadData() {
    this.updateProgressBars();
    this.renderTodayTargets();
    this.renderTodayHabits();
    this.renderRecentActivity();
  },

  // Render Today's Targets
  renderTodayTargets() {
    const listContainer = document.getElementById('todayTargetsList');
    const progressContainer = document.getElementById('todayTargetsProgress');

    if (!listContainer || !progressContainer) return;

    const targets = DailyTargets.getTodayTargets();
    const stats = DailyTargets.getTodayStats();

    if (targets.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: var(--space-6); opacity: 0.9;">
          <i data-lucide="clipboard-list" style="width: 48px; height: 48px; margin-bottom: var(--space-3); opacity: 0.7;"></i>
          <p style="margin-bottom: var(--space-2);">No targets for today. Start planning your day!</p>
          <button class="btn" style="background: white; color: var(--primary-500);" onclick="Dashboard.openAddTargetModal()">
            <i data-lucide="plus"></i>
            Add Your First Target
          </button>
        </div>
      `;
      lucide.createIcons();
      progressContainer.innerHTML = '';
      return;
    }

    listContainer.innerHTML = targets.map(target => {
      const categoryInfo = DailyTargets.targetCategories[target.category] || DailyTargets.targetCategories.custom;
      const priorityInfo = DailyTargets.priorities[target.priority] || DailyTargets.priorities.medium;

      return `
        <div style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); background: rgba(255,255,255,0.15); border-radius: var(--radius-lg); margin-bottom: var(--space-2); ${target.completed ? 'opacity: 0.7;' : ''}">
          <div style="width: 24px; height: 24px; border-radius: var(--radius-md); background: ${target.completed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)'}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;" onclick="Dashboard.toggleTarget('${target.id}')">
            ${target.completed ? '<i data-lucide="check" style="width: 16px; height: 16px;"></i>' : ''}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 500; ${target.completed ? 'text-decoration: line-through; opacity: 0.8;' : ''}">${target.title}</div>
            ${target.notes ? `<div style="font-size: var(--font-size-xs); opacity: 0.8; margin-top: var(--space-1);">${target.notes}</div>` : ''}
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            <span style="font-size: var(--font-size-xs); padding: 2px 8px; background: rgba(255,255,255,0.2); border-radius: var(--radius-sm);">${categoryInfo.name}</span>
            <button onclick="Dashboard.deleteTarget('${target.id}')" style="background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; padding: 4px;">
              <i data-lucide="x" style="width: 16px; height: 16px;"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Progress bar
    progressContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
        <span style="font-size: var(--font-size-lg); font-weight: 700;">${stats.completed} / ${stats.total} Completed</span>
        <span style="font-size: var(--font-size-2xl); font-weight: 700;">${stats.percentage}%</span>
      </div>
      <div class="progress-container" style="height: 10px; background: rgba(255,255,255,0.2);">
        <div class="progress-bar" style="width: ${stats.percentage}%; background: white; transition: width 0.3s ease;"></div>
      </div>
    `;

    lucide.createIcons();
  },

  // Open add target modal
  openAddTargetModal() {
    const categories = Object.entries(DailyTargets.targetCategories);
    const priorities = Object.entries(DailyTargets.priorities);

    Modal.open({
      title: 'Add Target',
      width: '450px',
      content: `
        <form id="targetForm" onsubmit="return false;">
          <div class="form-group">
            <label class="form-label">Target Title *</label>
            <input type="text" id="targetTitle" class="form-input" placeholder="e.g., Wake Up at 5 AM" required>
          </div>

          <div class="form-group">
            <label class="form-label">Notes (Optional)</label>
            <textarea id="targetNotes" class="form-input form-textarea" placeholder="Add any notes..." rows="2"></textarea>
          </div>

          <div class="grid-cols-2">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select id="targetCategory" class="form-input form-select">
                ${categories.map(([key, cat]) => `<option value="${key}">${cat.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Priority</label>
              <select id="targetPriority" class="form-input form-select">
                ${priorities.map(([key, pri]) => `<option value="${key}">${pri.name}</option>`).join('')}
              </select>
            </div>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="Dashboard.saveTarget()">Add Target</button>
      `
    });
  },

  // Save target
  saveTarget() {
    const title = document.getElementById('targetTitle')?.value?.trim();
    const notes = document.getElementById('targetNotes')?.value?.trim();
    const category = document.getElementById('targetCategory')?.value || 'personal';
    const priority = document.getElementById('targetPriority')?.value || 'medium';

    if (!title) {
      Toast.error('Error', 'Please enter a target title');
      return;
    }

    DailyTargets.addTarget({ title, notes, category, priority });
    Modal.close();
    this.loadData();
    Toast.success('Target Added', title);
  },

  // Toggle target completion
  toggleTarget(targetId) {
    DailyTargets.toggleTarget(targetId);
    this.loadData();
    this.updateStatCards();
  },

  // Delete target
  deleteTarget(targetId) {
    DailyTargets.deleteTarget(targetId);
    this.loadData();
    this.updateStatCards();
    Toast.success('Target Removed', 'Target has been deleted');
  },

  // Update stat cards
  updateStatCards() {
    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) {
      statsGrid.innerHTML = this.renderStatCards();
      lucide.createIcons();
    }
  },

  // Update progress bars
  updateProgressBars() {
    const todayPercentage = Stats.getTodayPercentage();
    const completedToday = Stats.getTodayCompleted();
    const totalHabits = Stats.getTotalHabits();

    // Today's progress
    if (document.getElementById('todayPercentage')) {
      document.getElementById('todayPercentage').textContent = todayPercentage + '%';
    }
    if (document.getElementById('todayProgressBar')) {
      document.getElementById('todayProgressBar').style.width = todayPercentage + '%';
    }
    if (document.getElementById('completedToday')) {
      document.getElementById('completedToday').textContent = completedToday + ' completed';
    }
    if (document.getElementById('totalHabits')) {
      document.getElementById('totalHabits').textContent = totalHabits + ' total habits';
    }

    // Mini progress bars
    if (document.getElementById('todayProgressValue')) {
      document.getElementById('todayProgressValue').textContent = todayPercentage + '%';
    }
    if (document.getElementById('todayMiniBar')) {
      document.getElementById('todayMiniBar').style.width = todayPercentage + '%';
    }

    // Weekly progress
    const weeklyData = Stats.getWeeklyProgress();
    const weekPercentage = weeklyData.length > 0
      ? Math.round(weeklyData.reduce((sum, d) => sum + d.percentage, 0) / weeklyData.length)
      : 0;

    if (document.getElementById('weekProgressValue')) {
      document.getElementById('weekProgressValue').textContent = weekPercentage + '%';
    }
    if (document.getElementById('weekMiniBar')) {
      document.getElementById('weekMiniBar').style.width = weekPercentage + '%';
    }

    // Monthly progress
    const monthlyData = Stats.getMonthlyProgress();
    const monthPercentage = monthlyData.length > 0
      ? Math.round(monthlyData.reduce((sum, d) => sum + d.percentage, 0) / monthlyData.length)
      : 0;

    if (document.getElementById('monthProgressValue')) {
      document.getElementById('monthProgressValue').textContent = monthPercentage + '%';
    }
    if (document.getElementById('monthMiniBar')) {
      document.getElementById('monthMiniBar').style.width = monthPercentage + '%';
    }
  },

  // Render today's habits
  renderTodayHabits() {
    const container = document.getElementById('todayHabitsList');
    if (!container) return;

    const habits = Storage.getHabits();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);
    const today = Utils.formatDate(new Date());
    const logs = Storage.getLogs();

    if (userHabits.length === 0) {
      container.innerHTML = Page.emptyState(
        'list-checks',
        'No habits yet',
        'Start building better habits today!',
        'Create First Habit',
        "window.location.href='habits.html'"
      );
      return;
    }

    // Show first 5 habits
    const habitsToShow = userHabits.slice(0, 5);

    container.innerHTML = habitsToShow.map(habit => {
      const todayLog = logs.find(l => l.habitId === habit.id && l.date === today);
      const completed = todayLog?.completed || false;

      return `
        <div class="activity-item" style="cursor: pointer;">
          <div class="habit-checkbox ${completed ? 'checked' : ''}" onclick="event.stopPropagation(); Habits.toggleComplete('${habit.id}'); Dashboard.loadData();">
            <i data-lucide="${completed ? 'check' : ''}" style="width: 16px; height: 16px;"></i>
          </div>
          <div style="flex: 1; min-width: 120px;">
            <div style="font-weight: 500; ${completed ? 'text-decoration: line-through; color: var(--text-tertiary);' : ''}">${habit.title}</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary); display: flex; gap: var(--space-2); align-items: center;">
              <span class="habit-badge ${habit.category}" style="font-size: 10px; padding: 2px 8px;">${App.categories[habit.category]?.name || habit.category}</span>
            </div>
          </div>
          <div class="habit-streak" style="font-size: var(--font-size-xs);">
            <i data-lucide="flame" style="width: 14px; height: 14px;"></i>
            ${habit.streak || 0}
          </div>
        </div>
      `;
    }).join('');

    if (userHabits.length > 5) {
      container.innerHTML += `
        <div style="text-align: center; padding: var(--space-3);">
          <a href="habits.html" class="btn btn-sm btn-ghost">View all ${userHabits.length} habits</a>
        </div>
      `;
    }

    lucide.createIcons();
  },

  // Render recent activity
  renderRecentActivity() {
    const container = document.getElementById('recentActivityList');
    if (!container) return;

    const logs = Storage.getLogs();
    const habits = Storage.getHabits();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);
    const userHabitIds = userHabits.map(h => h.id);

    // Get recent completed logs
    const recentLogs = logs
      .filter(l => userHabitIds.includes(l.habitId) && l.completed)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    // Add recent target completions
    const recentTargets = DailyTargets.getAllUserTargets()
      .filter(t => t.completed)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    if (recentLogs.length === 0 && recentTargets.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: var(--space-6); color: var(--text-tertiary);">
          <i data-lucide="activity" style="width: 32px; height: 32px; margin-bottom: var(--space-2);"></i>
          <p>No recent activity</p>
          <p style="font-size: var(--font-size-sm);">Complete a habit to see it here!</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    let html = '';

    // Show target completions
    recentTargets.forEach(target => {
      const daysAgo = Utils.daysBetween(new Date(), new Date(target.date));
      const timeText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
      html += `
        <div class="activity-item">
          <div class="activity-icon success">
            <i data-lucide="target"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title">${target.title}</div>
            <div class="activity-time">Target completed ${timeText}</div>
          </div>
        </div>
      `;
    });

    // Show habit completions
    recentLogs.forEach(log => {
      const habit = userHabits.find(h => h.id === log.habitId);
      if (!habit) return '';

      const daysAgo = Utils.daysBetween(new Date(), new Date(log.date));
      const timeText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;

      html += `
        <div class="activity-item">
          <div class="activity-icon success">
            <i data-lucide="check"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title">${habit.title}</div>
            <div class="activity-time">Completed ${timeText}</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    lucide.createIcons();
  },

  // Setup event listeners
  setupEventListeners() {
    // Refresh data periodically
    setInterval(() => {
      this.loadData();
    }, 30000); // Every 30 seconds

    // Archive targets at end of day
    DailyTargets.archiveToHistory();
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  Dashboard.init();
});

window.Dashboard = Dashboard;
