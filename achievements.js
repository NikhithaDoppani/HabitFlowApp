/**
 * Habit Tracker - Achievements Module
 * Badge system with automatic unlocking including Today's Targets badges
 */

const AchievementsPage = {
  // Initialize achievements page
  init() {
    if (!Page.requireAuth()) return;

    this.render();
    this.loadData();
  },

  // Render achievements page
  render() {
    document.body.innerHTML = Page.render('Achievements', 'achievements', `
      <!-- Achievement Stats -->
      <div class="stats-grid" style="margin-bottom: var(--space-6);">
        ${this.renderAchievementStats()}
      </div>

      <!-- Achievements Grid -->
      <h3 style="margin-bottom: var(--space-4);">Your Badges</h3>
      <div class="achievements-grid" id="achievementsGrid">
        <!-- Achievements will be rendered here -->
      </div>
    `);
  },

  // Render achievement stats
  renderAchievementStats() {
    const achievements = Achievements.getAllAchievements();
    const unlocked = achievements.filter(a => a.unlocked).length;
    const total = achievements.length;

    // Get Today's Targets stats
    const targetStreak = DailyTargets.getStreak();
    const targetsCompleted = DailyTargets.getTotalCompleted();

    return `
      <div class="stat-card">
        <div class="stat-icon success">
          <i data-lucide="trophy"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${unlocked}</div>
          <div class="stat-label">Badges Unlocked</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon primary">
          <i data-lucide="target"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${total}</div>
          <div class="stat-label">Total Badges</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon warning">
          <i data-lucide="flame"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${targetStreak}</div>
          <div class="stat-label">Target Streak</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon accent">
          <i data-lucide="award"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${targetsCompleted}</div>
          <div class="stat-label">Targets Completed</div>
        </div>
      </div>
    `;
  },

  // Load achievements
  loadData() {
    this.renderAchievements();
  },

  // Render achievements grid
  renderAchievements() {
    const container = document.getElementById('achievementsGrid');
    if (!container) return;

    const achievements = Achievements.getAllAchievements();

    if (achievements.length === 0) {
      container.innerHTML = Page.emptyState(
        'trophy',
        'No achievements available',
        'Start tracking habits to unlock achievements!'
      );
      lucide.createIcons();
      return;
    }

    container.innerHTML = achievements.map(achievement => {
      const progressPercent = Math.min((achievement.progress || 0) / achievement.requirement * 100, 100);

      return `
        <div class="achievement-card ${!achievement.unlocked ? 'locked' : ''}" onclick="AchievementsPage.showDetails('${achievement.id}')">
          <div class="achievement-icon">
            <i data-lucide="${achievement.icon}"></i>
          </div>
          <h4 class="achievement-title">${achievement.name}</h4>
          <p class="achievement-description">${achievement.description}</p>
          ${achievement.unlocked ? `
            <div class="achievement-date">
              <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i>
              Unlocked ${Utils.formatShortDate(achievement.unlockedDate)}
            </div>
          ` : `
            <div class="achievement-progress">
              <div class="progress-container" style="height: 4px;">
                <div class="progress-bar" style="width: ${progressPercent}%"></div>
              </div>
              <div class="achievement-progress-value">${achievement.progress || 0} / ${achievement.requirement}</div>
            </div>
          `}
        </div>
      `;
    }).join('');

    lucide.createIcons();
  },

  // Show achievement details
  showDetails(achievementId) {
    const achievement = App.achievementDefs.find(a => a.id === achievementId);
    const unlocked = Storage.getAchievements();
    const unlockedData = unlocked.find(a => a.id === achievementId);

    if (!achievement) return;

    const progress = unlockedData?.progress || 0;
    const remaining = Math.max(achievement.requirement - progress, 0);
    const progressPercent = Math.min(progress / achievement.requirement * 100, 100);

    Modal.open({
      title: achievement.name,
      width: '450px',
      content: `
        <div style="text-align: center;">
          <div style="width: 100px; height: 100px; margin: 0 auto var(--space-4); border-radius: var(--radius-xl); background: ${unlockedData ? 'var(--gradient-primary)' : 'var(--bg-tertiary)'}; display: flex; align-items: center; justify-content: center;">
            <i data-lucide="${achievement.icon}" style="width: 48px; height: 48px; color: ${unlockedData ? 'white' : 'var(--text-tertiary)'};"></i>
          </div>

          <p style="font-size: var(--font-size-base); color: var(--text-secondary); margin-bottom: var(--space-4);">
            ${achievement.description}
          </p>

          ${unlockedData ? `
            <div class="badge success" style="font-size: var(--font-size-sm); padding: var(--space-2) var(--space-4);">
              <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
              Unlocked on ${Utils.formatDisplayDate(unlockedData.unlockedDate)}
            </div>
          ` : `
            <div style="background: var(--bg-tertiary); border-radius: var(--radius-lg); padding: var(--space-4);">
              <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-2);">
                <span style="font-size: var(--font-size-sm); color: var(--text-secondary);">Progress</span>
                <span style="font-size: var(--font-size-sm); font-weight: 600;">${progress} / ${achievement.requirement}</span>
              </div>
              <div class="progress-container">
                <div class="progress-bar primary" style="width: ${progressPercent}%"></div>
              </div>
              <p style="font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: var(--space-2);">
                ${remaining > 0 ? `${remaining} more to unlock` : 'Almost there!'}
              </p>
            </div>
          `}
        </div>
      `
    });
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('achievements.html')) {
    AchievementsPage.init();
  }
});

window.AchievementsPage = AchievementsPage;
