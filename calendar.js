/**
 * Habit Tracker - Calendar Module
 * Full calendar view with GitHub-style heatmap and Today's Targets integration
 */

const Calendar = {
  currentDate: new Date(),
  selectedDate: null,

  // Initialize calendar page
  init() {
    if (!Page.requireAuth()) return;

    this.render();
    this.loadData();
  },

  // Render calendar page
  render() {
    document.body.innerHTML = Page.render('Calendar', 'calendar', `
      <div class="grid-cols-2" style="gap: var(--space-6);">
        <!-- Monthly Calendar -->
        <div class="card">
          <div class="calendar-header">
            <div class="calendar-nav">
              <button class="calendar-nav-btn" onclick="Calendar.prevMonth()">
                <i data-lucide="chevron-left"></i>
              </button>
              <h3 class="calendar-title" id="calendarTitle"></h3>
              <button class="calendar-nav-btn" onclick="Calendar.nextMonth()">
                <i data-lucide="chevron-right"></i>
              </button>
            </div>
            <button class="btn btn-sm btn-ghost" onclick="Calendar.goToToday()">Today</button>
          </div>

          <div class="calendar-grid" id="calendarGrid">
            <!-- Calendar will be rendered here -->
          </div>
        </div>

        <!-- Selected Day Details -->
        <div class="card" id="dayDetails">
          <h3 style="margin-bottom: var(--space-4);">Select a Day</h3>
          <p style="color: var(--text-tertiary);">Click on any day to view completed habits and daily targets for that date.</p>
        </div>
      </div>

      <!-- GitHub-style Heatmap -->
      <div class="heatmap-container" style="margin-top: var(--space-6);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
          <h3 class="heatmap-title">Activity Heatmap (Habits)</h3>
          <div style="font-size: var(--font-size-sm); color: var(--text-tertiary);">
            Last 365 days
          </div>
        </div>

        <div style="display: flex; gap: var(--space-4); margin-bottom: var(--space-2);">
          <div style="width: 40px; text-align: right; font-size: var(--font-size-xs); color: var(--text-tertiary);"></div>
          <div style="flex: 1; display: flex; gap: var(--space-2);">
            <span style="font-size: var(--font-size-xs); color: var(--text-tertiary); flex: 1; text-align: center;">Jan</span>
            <span style="font-size: var(--font-size-xs); color: var(--text-tertiary); flex: 1; text-align: center;">Feb</span>
            <span style="font-size: var(--font-size-xs); color: var(--text-tertiary); flex: 1; text-align: center;">Mar</span>
            <span style="font-size: var(--font-size-xs); color: var(--text-tertiary); flex: 1; text-align: center;">Apr</span>
            <span style="font-size: var(--font-size-xs); color: var(--text-tertiary); flex: 1; text-align: center;">May</span>
            <span style="font-size: var(--font-size-xs); color: var(--text-tertiary); flex: 1; text-align: center;">Jun</span>
            <span style="font-size: var(--font-size-xs); color: var(--text-tertiary); flex: 1; text-align: center;">Jul</span>
            <span style="font-size: var(--font-size-xs); color: var(--text-tertiary); flex: 1; text-align: center;">Aug</span>
            <span style="font-size: var(--font-size-xs); color: var(--text-tertiary); flex: 1; text-align: center;">Sep</span>
            <span style="font-size: var(--font-size-xs); color: var(--text-tertiary); flex: 1; text-align: center;">Oct</span>
            <span style="font-size: var(--font-size-xs); color: var(--text-tertiary); flex: 1; text-align: center;">Nov</span>
            <span style="font-size: var(--font-size-xs); color: var(--text-tertiary); flex: 1; text-align: center;">Dec</span>
          </div>
        </div>

        <div id="heatmapGrid" style="display: flex; gap: var(--space-2);">
          <!-- Heatmap will be rendered here -->
        </div>

        <div class="heatmap-legend">
          <span>Less</span>
          <div class="heatmap-legend-cells">
            <div class="heatmap-cell"></div>
            <div class="heatmap-cell level-1"></div>
            <div class="heatmap-cell level-2"></div>
            <div class="heatmap-cell level-3"></div>
            <div class="heatmap-cell level-4"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <!-- Today's Targets History Heatmap -->
      <div class="heatmap-container" style="margin-top: var(--space-6);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
          <h3 class="heatmap-title">Daily Targets Heatmap</h3>
          <div style="font-size: var(--font-size-sm); color: var(--text-tertiary);">
            Green = 80%+ | Yellow = 50-79% | Red = &lt;50%
          </div>
        </div>

        <div id="targetHeatmapGrid" style="display: flex; gap: var(--space-2);">
          <!-- Target heatmap will be rendered here -->
        </div>

        <div class="heatmap-legend">
          <span>0%</span>
          <div class="heatmap-legend-cells">
            <div class="heatmap-cell" style="background: var(--bg-tertiary);"></div>
            <div class="heatmap-cell" style="background: #ef4444;"></div>
            <div class="heatmap-cell" style="background: #f59e0b;"></div>
            <div class="heatmap-cell" style="background: #22c55e;"></div>
          </div>
          <span>100%</span>
        </div>
      </div>

      <!-- Target History -->
      <div class="card" style="margin-top: var(--space-6);">
        <h3 style="margin-bottom: var(--space-4);">Target History</h3>
        <div id="targetHistoryList">
          <!-- History will be rendered here -->
        </div>
      </div>
    `);
  },

  // Load data
  loadData() {
    this.renderCalendar();
    this.renderHeatmap();
    this.renderTargetHeatmap();
    this.renderTargetHistory();
  },

  // Render monthly calendar
  renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const titleEl = document.getElementById('calendarTitle');

    if (!grid || !titleEl) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Update title
    titleEl.textContent = new Date(year, month).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    const habits = Storage.getHabits();
    const logs = Storage.getLogs();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);
    const userHabitIds = userHabits.map(h => h.id);

    // Get target history for calendar
    const targetHistory = Storage.getTargetHistory();

    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = dayNames.map(day => `<div class="calendar-day-header">${day}</div>`).join('');

    // First day of month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = Utils.formatDate(new Date());

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      html += `<div class="calendar-day other-month"><span class="calendar-day-number">${day}</span></div>`;
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = Utils.formatDate(new Date(year, month, day));
      const isToday = dateStr === today;
      const isSelected = dateStr === this.selectedDate;

      // Check habit completions
      const dayLogs = logs.filter(l => l.date === dateStr && userHabitIds.includes(l.habitId) && l.completed);
      const hasCompletions = dayLogs.length > 0;

      // Check target completion
      const dayTargetHistory = targetHistory.find(h => h.date === dateStr && h.userId === App.currentUser?.id);
      let targetIndicator = '';

      if (dayTargetHistory && dayTargetHistory.total > 0) {
        const percentage = dayTargetHistory.percentage;
        if (percentage >= 80) {
          targetIndicator = 'style="border: 2px solid var(--success-500);"';
        } else if (percentage >= 50) {
          targetIndicator = 'style="border: 2px solid var(--warning-500);"';
        } else if (percentage > 0) {
          targetIndicator = 'style="border: 2px solid var(--error-500);"';
        }
      }

      html += `
        <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasCompletions ? 'has-completions' : ''}"
             onclick="Calendar.selectDay('${dateStr}')"
             data-date="${dateStr}"
             ${targetIndicator}>
          <span class="calendar-day-number">${day}</span>
        </div>
      `;
    }

    // Next month days (fill remaining cells)
    const totalCells = firstDay + daysInMonth;
    const remainingCells = 7 - (totalCells % 7);
    if (remainingCells < 7) {
      for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="calendar-day other-month"><span class="calendar-day-number">${day}</span></div>`;
      }
    }

    grid.innerHTML = html;
    lucide.createIcons();
  },

  // Render GitHub-style heatmap for habits
  renderHeatmap() {
    const container = document.getElementById('heatmapGrid');
    if (!container) return;

    const heatmapData = Stats.getHeatmapData();

    // Day labels
    const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
    let html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-1); margin-right: var(--space-2);">
        ${dayLabels.map(label => `<div style="height: 14px; font-size: var(--font-size-xs); color: var(--text-tertiary); line-height: 14px;">${label}</div>`).join('')}
      </div>
    `;

    // Calculate start offset for today
    const today = new Date();
    const startOffset = today.getDay();

    // Create cells array
    const cells = [];

    // Initialize with empty cells for alignment
    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: null, level: 0, count: 0 });
    }

    // Add actual data
    heatmapData.forEach(day => {
      cells.push(day);
    });

    // Render in columns (weeks)
    const weeksCount = Math.ceil(cells.length / 7);
    for (let week = 0; week < weeksCount; week++) {
      html += `<div style="display: flex; flex-direction: column; gap: var(--space-1);">`;
      for (let day = 0; day < 7; day++) {
        const index = week * 7 + day;
        if (index < cells.length) {
          const cell = cells[index];
          if (cell.date) {
            const level = cell.count === 0 ? 0 : cell.count <= 2 ? 1 : cell.count <= 4 ? 2 : cell.count <= 6 ? 3 : 4;
            const title = `${cell.date}: ${cell.count || 0} completions`;

            html += `
              <div class="heatmap-cell level-${level}"
                   title="${title}"
                   onclick="Calendar.selectDay('${cell.date}')"
                   style="cursor: pointer;">
              </div>
            `;
          } else {
            html += `<div class="heatmap-cell" style="opacity: 0;"></div>`;
          }
        } else {
          html += `<div class="heatmap-cell" style="opacity: 0;"></div>`;
        }
      }
      html += `</div>`;
    }

    container.innerHTML = html;
  },

  // Render Today's Targets heatmap
  renderTargetHeatmap() {
    const container = document.getElementById('targetHeatmapGrid');
    if (!container) return;

    const targetHeatmapData = DailyTargets.getTargetHeatmapData();

    const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
    let html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-1); margin-right: var(--space-2);">
        ${dayLabels.map(label => `<div style="height: 14px; font-size: var(--font-size-xs); color: var(--text-tertiary); line-height: 14px;">${label}</div>`).join('')}
      </div>
    `;

    const today = new Date();
    const startOffset = today.getDay();
    const cells = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: null, level: 0, percentage: 0 });
    }

    targetHeatmapData.forEach(day => {
      cells.push(day);
    });

    const weeksCount = Math.ceil(cells.length / 7);
    for (let week = 0; week < weeksCount; week++) {
      html += `<div style="display: flex; flex-direction: column; gap: var(--space-1);">`;
      for (let day = 0; day < 7; day++) {
        const index = week * 7 + day;
        if (index < cells.length) {
          const cell = cells[index];
          if (cell.date) {
            let color = 'var(--bg-tertiary)';
            if (cell.level === 4) color = '#22c55e';
            else if (cell.level === 3) color = '#22c55e';
            else if (cell.level === 2) color = '#f59e0b';
            else if (cell.level === 1) color = '#ef4444';

            html += `
              <div class="heatmap-cell"
                   style="background: ${color}; cursor: pointer;"
                   title="${cell.date}: ${cell.percentage}% targets completed"
                   onclick="Calendar.selectDay('${cell.date}')">
              </div>
            `;
          } else {
            html += `<div class="heatmap-cell" style="opacity: 0;"></div>`;
          }
        } else {
          html += `<div class="heatmap-cell" style="opacity: 0;"></div>`;
        }
      }
      html += `</div>`;
    }

    container.innerHTML = html;
  },

  // Render target history
  renderTargetHistory() {
    const container = document.getElementById('targetHistoryList');
    if (!container) return;

    const history = Storage.getTargetHistory()
      .filter(h => h.userId === App.currentUser?.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    if (history.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: var(--space-6); color: var(--text-tertiary);">
          <i data-lucide="history" style="width: 32px; height: 32px; margin-bottom: var(--space-2);"></i>
          <p>No target history yet</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = history.map(h => {
      const dateStr = Utils.formatShortDate(h.date);
      let statusColor = 'var(--text-tertiary)';
      let statusText = `${h.completed}/${h.total} Completed`;

      if (h.percentage >= 80) {
        statusColor = 'var(--success-500)';
      } else if (h.percentage >= 50) {
        statusColor = 'var(--warning-500)';
      } else if (h.percentage > 0) {
        statusColor = 'var(--error-500)';
      }

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-lg); margin-bottom: var(--space-2);">
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: white;">
              <i data-lucide="calendar" style="width: 18px; height: 18px;"></i>
            </div>
            <div>
              <div style="font-weight: 500;">${dateStr}</div>
              <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">${h.percentage}% completion rate</div>
            </div>
          </div>
          <span style="font-weight: 600; color: ${statusColor};">${statusText}</span>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  },

  // Select a day
  selectDay(dateStr) {
    this.selectedDate = dateStr;
    this.renderCalendar();
    this.showDayDetails(dateStr);
  },

  // Show day details
  showDayDetails(dateStr) {
    const container = document.getElementById('dayDetails');
    if (!container) return;

    const habits = Storage.getHabits();
    const logs = Storage.getLogs();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);
    const userHabitIds = userHabits.map(h => h.id);

    const date = new Date(dateStr);
    const isToday = dateStr === Utils.formatDate(new Date());
    const dayLogs = logs.filter(l => l.date === dateStr && userHabitIds.includes(l.habitId));

    const completedLogs = dayLogs.filter(l => l.completed);
    const pendingHabits = userHabits.filter(h => !dayLogs.some(l => l.habitId === h.id && l.completed));

    // Get target data for this day
    const targetHistory = Storage.getTargetHistory().find(h => h.date === dateStr && h.userId === App.currentUser?.id);
    const dayTargets = targetHistory?.targets || [];

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
        <h3>${isToday ? 'Today' : Utils.formatShortDate(dateStr)}</h3>
        <span class="badge ${completedLogs.length > 0 ? 'success' : ''}">${completedLogs.length} habits completed</span>
      </div>
    `;

    // Show target stats if available
    if (targetHistory && targetHistory.total > 0) {
      html += `
        <div style="background: var(--gradient-primary); color: white; padding: var(--space-4); border-radius: var(--radius-lg); margin-bottom: var(--space-4);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: var(--font-size-sm); opacity: 0.9;">Daily Targets</div>
              <div style="font-size: var(--font-size-xl); font-weight: 700;">${targetHistory.percentage}%</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: var(--font-size-sm); opacity: 0.9;">${targetHistory.completed}/${targetHistory.total} completed</div>
              <div style="margin-top: var(--space-2);">${dayTargets.filter(t => t.completed).length} of ${dayTargets.length} targets</div>
            </div>
          </div>
        </div>
      `;
    }

    if (completedLogs.length === 0 && pendingHabits.length === 0 && dayTargets.length === 0) {
      html += `
        <div style="text-align: center; padding: var(--space-8); color: var(--text-tertiary);">
          <i data-lucide="calendar-off" style="width: 48px; height: 48px; margin-bottom: var(--space-3);"></i>
          <p>No activity for this date</p>
        </div>
      `;
    } else {
      // Show targets for this day
      if (dayTargets.length > 0) {
        html += `
          <div style="margin-bottom: var(--space-4);">
            <div style="font-size: var(--font-size-sm); color: var(--text-tertiary); margin-bottom: var(--space-2);">
              <i data-lucide="target" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i>
              Daily Targets
            </div>
            ${dayTargets.map(target => `
              <div style="display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2); background: var(--bg-tertiary); border-radius: var(--radius-md); margin-bottom: var(--space-2);">
                <div style="width: 18px; height: 18px; border-radius: var(--radius-sm); background: ${target.completed ? 'var(--success-500)' : 'var(--bg-secondary)'}; display: flex; align-items: center; justify-content: center;">
                  ${target.completed ? '<i data-lucide="check" style="width: 12px; height: 12px; color: white;"></i>' : ''}
                </div>
                <span style="${target.completed ? 'text-decoration: line-through; color: var(--text-tertiary);' : ''}">${target.title}</span>
              </div>
            `).join('')}
          </div>
        `;
      }

      // Completed habits
      if (completedLogs.length > 0) {
        html += `<div style="margin-bottom: var(--space-4);">
          <div style="font-size: var(--font-size-sm); color: var(--text-tertiary); margin-bottom: var(--space-2);">Completed Habits</div>
          ${completedLogs.map(log => {
            const habit = userHabits.find(h => h.id === log.habitId);
            if (!habit) return '';

            return `
              <div class="activity-item">
                <div class="habit-checkbox checked" style="width: 20px; height: 20px;">
                  <i data-lucide="check" style="width: 12px; height: 12px;"></i>
                </div>
                <div style="flex: 1;">
                  <div style="font-weight: 500;">${habit.title}</div>
                  <span class="habit-badge ${habit.category}" style="font-size: 10px;">${App.categories[habit.category]?.name || habit.category}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>`;
      }

      // Pending habits (for today only)
      if (isToday && pendingHabits.length > 0) {
        html += `<div>
          <div style="font-size: var(--font-size-sm); color: var(--text-tertiary); margin-bottom: var(--space-2);">Still To Do</div>
          ${pendingHabits.map(habit => `
            <div class="activity-item" onclick="Habits.toggleComplete('${habit.id}')" style="cursor: pointer;">
              <div class="habit-checkbox" style="width: 20px; height: 20px;"></div>
              <div style="flex: 1;">
                <div style="font-weight: 500;">${habit.title}</div>
                <span class="habit-badge ${habit.category}" style="font-size: 10px;">${App.categories[habit.category]?.name || habit.category}</span>
              </div>
            </div>
          `).join('')}
        </div>`;
      }
    }

    container.innerHTML = html;
    lucide.createIcons();
  },

  // Navigation
  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderCalendar();
  },

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderCalendar();
  },

  goToToday() {
    this.currentDate = new Date();
    this.selectedDate = Utils.formatDate(new Date());
    this.loadData();
    this.showDayDetails(this.selectedDate);
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('calendar.html')) {
    Calendar.init();
  }
});

window.Calendar = Calendar;
