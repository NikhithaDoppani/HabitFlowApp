/**
 * Habit Tracker - Habits Management Module
 * Full CRUD operations for habits
 */

const Habits = {
  // Initialize habits page
  init() {
    if (!Page.requireAuth()) return;

    this.render();
    this.loadData();
    this.setupEventListeners();
  },

  // Render habits page
  render() {
    const user = App.currentUser;

    document.body.innerHTML = Page.render('My Habits', 'habits', `
      <!-- Header with search and add -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4);">
        <div class="search-bar">
          <i data-lucide="search"></i>
          <input
            type="text"
            id="searchInput"
            placeholder="Search habits..."
            onkeyup="Habits.handleSearch(this.value)"
          >
        </div>
        <button class="btn btn-primary" onclick="Habits.openAddModal()">
          <i data-lucide="plus"></i>
          Add Habit
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-container" id="filtersContainer">
        <button class="filter-chip active" data-filter="all" onclick="Habits.setFilter('all')">All</button>
        <button class="filter-chip" data-filter="completed" onclick="Habits.setFilter('completed')">Completed</button>
        <button class="filter-chip" data-filter="pending" onclick="Habits.setFilter('pending')">Pending</button>
        <span style="color: var(--border-color);">|</span>
        <button class="filter-chip" data-filter="health" onclick="Habits.setFilter('health')">Health</button>
        <button class="filter-chip" data-filter="fitness" onclick="Habits.setFilter('fitness')">Fitness</button>
        <button class="filter-chip" data-filter="study" onclick="Habits.setFilter('study')">Study</button>
        <button class="filter-chip" data-filter="productivity" onclick="Habits.setFilter('productivity')">Productivity</button>
        <button class="filter-chip" data-filter="personal" onclick="Habits.setFilter('personal')">Personal</button>
        <button class="filter-chip" data-filter="reading" onclick="Habits.setFilter('reading')">Reading</button>
        <button class="filter-chip" data-filter="meditation" onclick="Habits.setFilter('meditation')">Meditation</button>
        <span style="color: var(--border-color);">|</span>
        <button class="filter-chip" data-filter="daily" onclick="Habits.setFilter('daily')">Daily</button>
        <button class="filter-chip" data-filter="weekly" onclick="Habits.setFilter('weekly')">Weekly</button>
        <button class="filter-chip" data-filter="monthly" onclick="Habits.setFilter('monthly')">Monthly</button>
      </div>

      <!-- Sort Dropdown -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5);">
        <div style="display: flex; align-items: center; gap: var(--space-2);">
          <span style="color: var(--text-tertiary); font-size: var(--font-size-sm);">Sort by:</span>
          <select id="sortSelect" class="form-input" style="width: auto; padding: var(--space-2) var(--space-4);" onchange="Habits.handleSort(this.value)">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="streak">Highest Streak</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
        <div style="color: var(--text-tertiary); font-size: var(--font-size-sm);" id="habitCount">0 habits</div>
      </div>

      <!-- Habits Grid -->
      <div class="habits-grid" id="habitsGrid">
        <!-- Habits will be rendered here -->
      </div>
    `);
  },

  currentFilter: 'all',
  currentSort: 'newest',
  searchQuery: '',

  // Load and display habits
  loadData() {
    const habits = Storage.getHabits();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);
    const today = Utils.formatDate(new Date());
    const logs = Storage.getLogs();

    // Apply filters and search
    let filteredHabits = this.filterHabits(userHabits, logs, today);

    // Apply sorting
    filteredHabits = this.sortHabits(filteredHabits);

    // Render
    this.renderHabits(filteredHabits, logs, today);

    // Update count
    if (document.getElementById('habitCount')) {
      document.getElementById('habitCount').textContent = `${filteredHabits.length} habit${filteredHabits.length !== 1 ? 's' : ''}`;
    }
  },

  // Filter habits
  filterHabits(habits, logs, today) {
    let filtered = [...habits];

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(h =>
        h.title.toLowerCase().includes(query) ||
        (h.description && h.description.toLowerCase().includes(query)) ||
        h.category.toLowerCase().includes(query)
      );
    }

    // Status/category filter
    switch (this.currentFilter) {
      case 'completed':
        filtered = filtered.filter(h => {
          const log = logs.find(l => l.habitId === h.id && l.date === today);
          return log?.completed;
        });
        break;
      case 'pending':
        filtered = filtered.filter(h => {
          const log = logs.find(l => l.habitId === h.id && l.date === today);
          return !log || !log.completed;
        });
        break;
      case 'health':
      case 'fitness':
      case 'study':
      case 'productivity':
      case 'personal':
      case 'reading':
      case 'meditation':
        filtered = filtered.filter(h => h.category === this.currentFilter);
        break;
      case 'daily':
      case 'weekly':
      case 'monthly':
        filtered = filtered.filter(h => h.frequency === this.currentFilter);
        break;
    }

    return filtered;
  },

  // Sort habits
  sortHabits(habits) {
    const sorted = [...habits];

    switch (this.currentSort) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
        break;
      case 'streak':
        sorted.sort((a, b) => (b.streak || 0) - (a.streak || 0));
        break;
      case 'alphabetical':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return sorted;
  },

  // Render habits
  renderHabits(habits, logs, today) {
    const container = document.getElementById('habitsGrid');
    if (!container) return;

    if (habits.length === 0) {
      container.innerHTML = Page.emptyState(
        'list-checks',
        'No habits found',
        this.searchQuery ? 'Try a different search term' : 'Start building better habits today!',
        'Create First Habit',
        'Habits.openAddModal()'
      );
      lucide.createIcons();
      return;
    }

    container.innerHTML = habits.map(habit => {
      const todayLog = logs.find(l => l.habitId === habit.id && l.date === today);
      const completed = todayLog?.completed || false;

      return `
        <div class="habit-card ${completed ? 'completed' : ''}" data-habit-id="${habit.id}">
          <div class="habit-header">
            <div class="habit-checkbox ${completed ? 'checked' : ''}" onclick="Habits.toggleComplete('${habit.id}')">
              <i data-lucide="${completed ? 'check' : ''}"></i>
            </div>
            <div class="habit-info">
              <h4 class="habit-title">${habit.title}</h4>
              <div class="habit-meta">
                <span class="habit-badge ${habit.category}">${App.categories[habit.category]?.name || habit.category}</span>
                <span class="habit-badge">${habit.frequency}</span>
                ${habit.reminderTime ? `<span class="habit-badge"><i data-lucide="clock" style="width:12px;height:12px"></i> ${Utils.formatTime(habit.reminderTime)}</span>` : ''}
              </div>
            </div>
          </div>

          ${habit.description ? `<p style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: var(--space-2);">${habit.description}</p>` : ''}

          <div style="display: flex; align-items: center; gap: var(--space-4); margin-top: var(--space-4);">
            <div class="habit-streak">
              <i data-lucide="flame"></i>
              ${habit.streak || 0} days
            </div>
            ${habit.longestStreak > 0 ? `
              <span style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Best: ${habit.longestStreak} days</span>
            ` : ''}
          </div>

          ${habit.notes ? `
            <div class="habit-notes">
              <i data-lucide="file-text" style="width: 14px; height: 14px;"></i>
              ${habit.notes}
            </div>
          ` : ''}

          <div class="habit-actions" style="margin-top: var(--space-4); justify-content: flex-start;">
            <button class="btn btn-sm btn-ghost" onclick="Habits.edit('${habit.id}')" title="Edit">
              <i data-lucide="pencil"></i>
              Edit
            </button>
            <button class="btn btn-sm btn-ghost" onclick="Habits.viewDetails('${habit.id}')" title="Details">
              <i data-lucide="eye"></i>
              Details
            </button>
            <button class="btn btn-sm btn-ghost" style="color: var(--error-500);" onclick="Habits.delete('${habit.id}')" title="Delete">
              <i data-lucide="trash-2"></i>
              Delete
            </button>
          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  },

  // Toggle habit completion
  toggleComplete(habitId) {
    const today = Utils.formatDate(new Date());
    const logs = Storage.getLogs();

    const existingLogIndex = logs.findIndex(l => l.habitId === habitId && l.date === today);

    if (existingLogIndex >= 0) {
      logs[existingLogIndex].completed = !logs[existingLogIndex].completed;
    } else {
      logs.push({
        id: Utils.generateId(),
        habitId,
        date: today,
        completed: true,
        notes: ''
      });
    }

    Storage.saveLogs(logs);
    Streak.updateStreak(habitId);
    Achievements.checkAchievements();
    this.loadData();

    const updatedLogs = Storage.getLogs();
    const isCompleted = updatedLogs.find(l => l.habitId === habitId && l.date === today)?.completed;
    const habits = Storage.getHabits();
    const habit = habits.find(h => h.id === habitId);
    Toast.success(
      isCompleted ? 'Habit Completed!' : 'Habit Unmarked',
      habit?.title || 'Habit'
    );
  },

  // Open add modal
  openAddModal() {
    Modal.open({
      title: 'Add New Habit',
      width: '550px',
      content: this.getFormHTML(),
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="Habits.save()">Create Habit</button>
      `
    });
  },

  // Get form HTML
  getFormHTML(habit = null) {
    const isEdit = !!habit;

    return `
      <form id="habitForm" onsubmit="return false;">
        <div class="form-group">
          <label class="form-label">Habit Name *</label>
          <input
            type="text"
            id="habitTitle"
            class="form-input"
            placeholder="e.g., Drink 8 glasses of water"
            value="${habit?.title || ''}"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea
            id="habitDescription"
            class="form-input form-textarea"
            placeholder="Add some details about this habit..."
            rows="2"
          >${habit?.description || ''}</textarea>
        </div>

        <div class="grid-cols-2" style="--space-5: var(--space-4);">
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select id="habitCategory" class="form-input form-select" required>
              <option value="">Select category</option>
              ${Object.entries(App.categories).map(([key, cat]) => `
                <option value="${key}" ${habit?.category === key ? 'selected' : ''}>${cat.name}</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Frequency *</label>
            <select id="habitFrequency" class="form-input form-select" required>
              <option value="">Select frequency</option>
              <option value="daily" ${habit?.frequency === 'daily' ? 'selected' : ''}>Daily</option>
              <option value="weekly" ${habit?.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
              <option value="monthly" ${habit?.frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
              <option value="weekdays" ${habit?.frequency === 'weekdays' ? 'selected' : ''}>Weekdays Only</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Reminder Time</label>
          <input
            type="time"
            id="habitReminder"
            class="form-input"
            value="${habit?.reminderTime || ''}"
          >
          <div class="form-hint">Set a daily reminder for this habit</div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea
            id="habitNotes"
            class="form-input form-textarea"
            placeholder="Any additional notes..."
            rows="3"
          >${habit?.notes || ''}</textarea>
        </div>

        <input type="hidden" id="habitId" value="${habit?.id || ''}">
      </form>
    `;
  },

  // Save habit
  save() {
    const title = document.getElementById('habitTitle')?.value?.trim();
    const description = document.getElementById('habitDescription')?.value?.trim();
    const category = document.getElementById('habitCategory')?.value;
    const frequency = document.getElementById('habitFrequency')?.value;
    const reminderTime = document.getElementById('habitReminder')?.value;
    const notes = document.getElementById('habitNotes')?.value?.trim();
    const habitId = document.getElementById('habitId')?.value;

    // Validate
    if (!title || !category || !frequency) {
      Toast.error('Error', 'Please fill in all required fields');
      return;
    }

    const habits = Storage.getHabits();

    if (habitId) {
      // Edit existing
      const index = habits.findIndex(h => h.id === habitId);
      if (index >= 0) {
        habits[index] = {
          ...habits[index],
          title,
          description,
          category,
          frequency,
          reminderTime,
          notes
        };
        Toast.success('Habit Updated', title);
      }
    } else {
      // Create new
      const newHabit = {
        id: Utils.generateId(),
        userId: App.currentUser?.id,
        title,
        description,
        category,
        frequency,
        reminderTime,
        notes,
        streak: 0,
        longestStreak: 0,
        reminderEnabled: !!reminderTime,
        createdDate: Utils.formatDate(new Date())
      };
      habits.push(newHabit);
      Toast.success('Habit Created', title);

      // Check for first habit achievement
      Achievements.checkAchievements();
    }

    Storage.saveHabits(habits);
    Modal.close();
    this.loadData();
  },

  // Edit habit
  edit(habitId) {
    const habits = Storage.getHabits();
    const habit = habits.find(h => h.id === habitId);

    if (!habit) {
      Toast.error('Error', 'Habit not found');
      return;
    }

    Modal.open({
      title: 'Edit Habit',
      width: '550px',
      content: this.getFormHTML(habit),
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="Habits.save()">Save Changes</button>
      `
    });
  },

  // View habit details
  viewDetails(habitId) {
    const habits = Storage.getHabits();
    const habit = habits.find(h => h.id === habitId);
    const logs = Storage.getLogs();
    const habitLogs = logs.filter(l => l.habitId === habitId && l.completed);

    if (!habit) {
      Toast.error('Error', 'Habit not found');
      return;
    }

    Modal.open({
      title: habit.title,
      width: '600px',
      content: `
        <div style="margin-bottom: var(--space-4);">
          <span class="habit-badge ${habit.category}">${App.categories[habit.category]?.name || habit.category}</span>
          <span class="habit-badge">${habit.frequency}</span>
        </div>

        ${habit.description ? `<p style="color: var(--text-secondary); margin-bottom: var(--space-4);">${habit.description}</p>` : ''}

        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: var(--space-4);">
          <div style="text-align: center; padding: var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
            <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--warning-500);">${habit.streak || 0}</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Current Streak</div>
          </div>
          <div style="text-align: center; padding: var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
            <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--success-500);">${habit.longestStreak || 0}</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Longest Streak</div>
          </div>
          <div style="text-align: center; padding: var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
            <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--primary-500);">${habitLogs.length}</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Total Completions</div>
          </div>
        </div>

        ${habit.reminderTime ? `
          <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-4); padding: var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
            <i data-lucide="bell" style="width: 18px; height: 18px; color: var(--primary-500);"></i>
            <span style="font-size: var(--font-size-sm);">Reminder at ${Utils.formatTime(habit.reminderTime)}</span>
          </div>
        ` : ''}

        ${habit.notes ? `
          <div style="padding: var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-lg); margin-bottom: var(--space-4);">
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: var(--space-1);">Notes</div>
            <div style="font-size: var(--font-size-sm);">${habit.notes}</div>
          </div>
        ` : ''}

        <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">
          Created on ${Utils.formatDisplayDate(habit.createdDate)}
        </div>
      `
    });
  },

  // Delete habit
  delete(habitId) {
    Modal.confirm({
      title: 'Delete Habit',
      message: 'Are you sure you want to delete this habit? This action cannot be undone.',
      type: 'danger',
      onConfirm: `Habits.confirmDelete('${habitId}')`
    });
  },

  // Confirm delete
  confirmDelete(habitId) {
    const habits = Storage.getHabits();
    const filteredHabits = habits.filter(h => h.id !== habitId);
    Storage.saveHabits(filteredHabits);

    // Also remove logs
    const logs = Storage.getLogs();
    const filteredLogs = logs.filter(l => l.habitId !== habitId);
    Storage.saveLogs(filteredLogs);

    Toast.success('Habit Deleted', 'The habit has been removed');
    this.loadData();
  },

  // Set filter
  setFilter(filter) {
    this.currentFilter = filter;

    // Update UI
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.classList.remove('active');
      if (chip.dataset.filter === filter) {
        chip.classList.add('active');
      }
    });

    this.loadData();
  },

  // Handle search
  handleSearch: Utils.debounce(function(query) {
    Habits.searchQuery = query;
    Habits.loadData();
  }, 300),

  // Handle sort
  handleSort(sort) {
    this.currentSort = sort;
    this.loadData();
  },

  // Setup event listeners
  setupEventListeners() {
    // Any additional event listeners
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('habits.html')) {
    Habits.init();
  }
});

window.Habits = Habits;
