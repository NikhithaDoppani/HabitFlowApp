/**
 * Habit Tracker - Analytics Module
 * Data visualization with Canvas charts and Today's Targets analytics
 */

const Analytics = {
  // Initialize analytics page
  init() {
    if (!Page.requireAuth()) return;

    this.render();
    this.loadData();
  },

  // Render analytics page
  render() {
    document.body.innerHTML = Page.render('Analytics', 'analytics', `
      <!-- Key Stats -->
      <div class="stats-grid" style="margin-bottom: var(--space-6);">
        ${Page.statCard('check-circle', 'success', Stats.getTotalCompletions(), 'Total Completions')}
        ${Page.statCard('flame', 'warning', Stats.getHighestStreak(), 'Best Streak', 'days')}
        ${Page.statCard('percent', 'primary', Stats.getTodayPercentage() + '%', 'Today\'s Rate')}
        ${Page.statCard('trending-up', 'accent', Stats.getCurrentStreak(), 'Current Streak', 'days')}
      </div>

      <!-- Today's Targets Stats -->
      <div class="stats-grid" style="margin-bottom: var(--space-6);">
        ${Page.statCard('target', 'primary', DailyTargets.getTotalCompleted(), 'Targets Completed')}
        ${Page.statCard('award', 'success', DailyTargets.getStreak(), 'Target Streak', 'days')}
        ${Page.statCard('percent', 'warning', DailyTargets.getTodayStats().percentage + '%', 'Today\'s Rate')}
        ${Page.statCard('zap', 'accent', DailyTargets.getMostProductiveDay() || '-', 'Best Day')}
      </div>

      <!-- Today's Targets Charts -->
      <h3 style="margin-bottom: var(--space-4);">Daily Targets Performance</h3>
      <div class="grid-cols-2" style="margin-bottom: var(--space-6);">
        <div class="chart-container">
          <div class="chart-header">
            <h3 class="chart-title">Target Completion Trend (Last 7 Days)</h3>
          </div>
          <canvas id="dailyTargetChart"></canvas>
        </div>

        <div class="chart-container">
          <div class="chart-header">
            <h3 class="chart-title">Target Completion Rate (Weekly)</h3>
          </div>
          <canvas id="weeklyTargetChart"></canvas>
        </div>
      </div>

      <div class="grid-cols-2" style="margin-bottom: var(--space-6);">
        <div class="chart-container">
          <div class="chart-header">
            <h3 class="chart-title">Monthly Target Success</h3>
          </div>
          <canvas id="monthlyTargetChart"></canvas>
        </div>

        <div class="chart-container">
          <div class="chart-header">
            <h3 class="chart-title">Category Distribution</h3>
          </div>
          <canvas id="targetCategoryChart"></canvas>
        </div>
      </div>

      <!-- Habit Charts -->
      <h3 style="margin-bottom: var(--space-4);">Habit Completion Charts</h3>
      <div class="grid-cols-2" style="margin-bottom: var(--space-6);">
        <!-- Daily Progress (Line Chart) -->
        <div class="chart-container">
          <div class="chart-header">
            <h3 class="chart-title">Daily Progress (Last 7 Days)</h3>
          </div>
          <canvas id="dailyProgressChart"></canvas>
        </div>

        <!-- Weekly Completion (Bar Chart) -->
        <div class="chart-container">
          <div class="chart-header">
            <h3 class="chart-title">Weekly Completions</h3>
          </div>
          <canvas id="weeklyChart"></canvas>
        </div>
      </div>

      <div class="grid-cols-2" style="margin-bottom: var(--space-6);">
        <!-- Category Distribution (Pie Chart) -->
        <div class="chart-container">
          <div class="chart-header">
            <h3 class="chart-title">Habit Categories</h3>
          </div>
          <canvas id="categoryChart"></canvas>
        </div>

        <!-- Monthly Progress (Area Chart) -->
        <div class="chart-container">
          <div class="chart-header">
            <h3 class="chart-title">Monthly Progress</h3>
          </div>
          <canvas id="monthlyChart"></canvas>
        </div>
      </div>

      <!-- Statistics Summary -->
      <div class="card" style="margin-bottom: var(--space-6);">
        <h3 style="margin-bottom: var(--space-4);">Performance Summary</h3>
        <div class="grid-cols-4" style="gap: var(--space-4);">
          <div style="text-align: center; padding: var(--space-4); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
            <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--primary-500);" id="statThisWeek">0</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Habits This Week</div>
          </div>
          <div style="text-align: center; padding: var(--space-4); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
            <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--success-500);" id="statThisMonth">0</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Habits This Month</div>
          </div>
          <div style="text-align: center; padding: var(--space-4); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
            <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--warning-500);" id="statAvgStreak">0</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Avg Streak</div>
          </div>
          <div style="text-align: center; padding: var(--space-4); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
            <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--accent-500);" id="statConsistency">0%</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Consistency</div>
          </div>
        </div>
      </div>

      <!-- Target Performance Summary -->
      <div class="card" style="margin-bottom: var(--space-6);">
        <h3 style="margin-bottom: var(--space-4);">Target Performance</h3>
        <div class="grid-cols-4" style="gap: var(--space-4);">
          <div style="text-align: center; padding: var(--space-4); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
            <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--primary-500);" id="statTargetsTotal">0</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Total Targets</div>
          </div>
          <div style="text-align: center; padding: var(--space-4); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
            <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--success-500);" id="statTargetsCompleted">0</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Completed</div>
          </div>
          <div style="text-align: center; padding: var(--space-4); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
            <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--warning-500);" id="statTargetStreak">0</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Day Streak</div>
          </div>
          <div style="text-align: center; padding: var(--space-4); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
            <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--accent-500);" id="statBestDay">-</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Most Productive Day</div>
          </div>
        </div>
      </div>

      <!-- Most Consistent Habit -->
      <div class="card" id="consistentHabitCard">
        <h3 style="margin-bottom: var(--space-4);">Most Consistent Habit</h3>
        <div id="consistentHabitContent">
          <!-- Will be rendered -->
        </div>
      </div>
    `);
  },

  // Load and display data
  loadData() {
    this.renderCharts();
    this.renderStats();
    this.renderConsistentHabit();
  },

  // Render all charts
  renderCharts() {
    setTimeout(() => {
      // Habit charts
      this.renderDailyProgressChart();
      this.renderWeeklyChart();
      this.renderCategoryChart();
      this.renderMonthlyChart();

      // Today's Targets charts
      this.renderDailyTargetChart();
      this.renderWeeklyTargetChart();
      this.renderMonthlyTargetChart();
      this.renderTargetCategoryChart();
    }, 100);
  },

  // Daily progress line chart
  renderDailyProgressChart() {
    const weeklyData = Stats.getWeeklyProgress();
    const chartData = weeklyData.map(d => ({
      label: d.day,
      value: d.percentage
    }));

    Charts.createLineChart('dailyProgressChart', chartData, {
      label: 'Completion %',
      color: '#6366f1'
    });
  },

  // Weekly completion bar chart
  renderWeeklyChart() {
    const weeklyData = Stats.getWeeklyProgress();
    const chartData = weeklyData.map(d => ({
      label: d.day,
      value: d.completed
    }));

    Charts.createBarChart('weeklyChart', chartData, {
      label: 'Completions',
      color: '#22c55e'
    });
  },

  // Category distribution pie chart
  renderCategoryChart() {
    const categoryData = Stats.getCategoryDistribution();
    Charts.createPieChart('categoryChart', categoryData);
  },

  // Monthly progress area chart
  renderMonthlyChart() {
    const monthlyData = Stats.getMonthlyProgress();
    const chartData = monthlyData.map((d, i) => ({
      label: i % 5 === 0 ? Utils.formatShortDate(d.date) : '',
      value: d.percentage
    }));

    Charts.createAreaChart('monthlyChart', chartData, {
      color: '#06b6d4'
    });
  },

  // Daily target completion chart
  renderDailyTargetChart() {
    const historyData = DailyTargets.getHistoryData(7);
    const chartData = historyData.map(d => ({
      label: d.day,
      value: d.percentage
    }));

    Charts.createLineChart('dailyTargetChart', chartData, {
      label: 'Target %',
      color: '#22c55e'
    });
  },

  // Weekly target performance chart
  renderWeeklyTargetChart() {
    const historyData = DailyTargets.getHistoryData(7);
    const chartData = historyData.map(d => ({
      label: d.day,
      value: d.completed
    }));

    Charts.createBarChart('weeklyTargetChart', chartData, {
      label: 'Completed',
      color: '#6366f1'
    });
  },

  // Monthly target chart
  renderMonthlyTargetChart() {
    const historyData = DailyTargets.getHistoryData(30);
    const chartData = historyData.map((d, i) => ({
      label: i % 5 === 0 ? Utils.formatShortDate(d.date) : '',
      value: d.percentage
    }));

    Charts.createAreaChart('monthlyTargetChart', chartData, {
      color: '#a855f7'
    });
  },

  // Target category distribution
  renderTargetCategoryChart() {
    const targets = DailyTargets.getAllUserTargets();
    const categoryData = {};

    targets.forEach(t => {
      const catName = DailyTargets.targetCategories[t.category]?.name || 'Other';
      categoryData[catName] = (categoryData[catName] || 0) + 1;
    });

    const chartData = Object.entries(categoryData).map(([label, count]) => ({
      label,
      count,
      percentage: targets.length > 0 ? Math.round((count / targets.length) * 100) : 0
    }));

    Charts.createPieChart('targetCategoryChart', chartData);
  },

  // Render summary stats
  renderStats() {
    const weeklyData = Stats.getWeeklyProgress();
    const monthlyData = Stats.getMonthlyProgress();
    const habits = Storage.getHabits();
    const userHabits = habits.filter(h => h.userId === App.currentUser?.id);

    // This week completions
    const thisWeekCompletions = weeklyData.reduce((sum, d) => sum + d.completed, 0);
    document.getElementById('statThisWeek').textContent = thisWeekCompletions;

    // This month completions
    const thisMonthCompletions = monthlyData.reduce((sum, d) => sum + d.completed, 0);
    document.getElementById('statThisMonth').textContent = thisMonthCompletions;

    // Average streak
    const avgStreak = userHabits.length > 0
      ? Math.round(userHabits.reduce((sum, h) => sum + (h.streak || 0), 0) / userHabits.length)
      : 0;
    document.getElementById('statAvgStreak').textContent = avgStreak;

    // Consistency rate
    const daysWithCompletions = monthlyData.filter(d => d.completed > 0).length;
    const daysWithHabits = userHabits.length > 0 ? monthlyData.length : 0;
    const consistency = daysWithHabits > 0 ? Math.round((daysWithCompletions / daysWithHabits) * 100) : 0;
    document.getElementById('statConsistency').textContent = consistency + '%';

    // Target stats
    const allTargets = DailyTargets.getAllUserTargets();
    document.getElementById('statTargetsTotal').textContent = allTargets.length;
    document.getElementById('statTargetsCompleted').textContent = DailyTargets.getTotalCompleted();
    document.getElementById('statTargetStreak').textContent = DailyTargets.getStreak();
    document.getElementById('statBestDay').textContent = DailyTargets.getMostProductiveDay() || '-';
  },

  // Render most consistent habit
  renderConsistentHabit() {
    const container = document.getElementById('consistentHabitContent');
    if (!container) return;

    const habit = Stats.getMostConsistentHabit();

    if (!habit) {
      container.innerHTML = `
        <div style="text-align: center; padding: var(--space-6); color: var(--text-tertiary);">
          <p>No habits to analyze yet</p>
        </div>
      `;
      return;
    }

    const logs = Storage.getLogs();
    const habitLogs = logs.filter(l => l.habitId === habit.id && l.completed);

    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--space-4);">
        <div style="width: 64px; height: 64px; border-radius: var(--radius-xl); background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: white;">
          <i data-lucide="flame" style="width: 32px; height: 32px;"></i>
        </div>
        <div style="flex: 1;">
          <h4 style="font-size: var(--font-size-lg); margin-bottom: var(--space-1);">${habit.title}</h4>
          <div style="display: flex; gap: var(--space-3);">
            <span class="habit-badge ${habit.category}">${App.categories[habit.category]?.name || habit.category}</span>
            <span style="font-size: var(--font-size-sm); color: var(--text-tertiary);">🔥 ${habit.streak || 0} day streak</span>
            <span style="font-size: var(--font-size-sm); color: var(--text-tertiary);">📊 ${habitLogs.length} total completions</span>
          </div>
        </div>
        <button class="btn btn-ghost" onclick="Habits.viewDetails('${habit.id}')">View Details</button>
      </div>
    `;

    lucide.createIcons();
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('analytics.html')) {
    Analytics.init();
  }
});

window.addEventListener('resize', () => {
  if (window.location.pathname.includes('analytics.html')) {
    Analytics.renderCharts();
  }
});

window.Analytics = Analytics;
