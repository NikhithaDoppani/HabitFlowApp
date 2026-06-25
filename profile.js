/**
 * Habit Tracker - Profile Module
 * User profile management
 */

const Profile = {
  // Initialize profile page
  init() {
    if (!Page.requireAuth()) return;

    this.render();
    this.loadData();
  },

  // Render profile page
  render() {
    const user = App.currentUser;
    const initials = user ? Utils.getInitials(user.name) : 'U';
    const stats = Auth.getUserStats();

    document.body.innerHTML = Page.render('Profile', 'profile', `
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="profile-avatar" id="profileAvatar" onclick="Profile.selectImage()">
          ${user?.profileImage
            ? `<img src="${user.profileImage}" alt="${user.name}">`
            : initials
          }
        </div>
        <input type="file" id="profileImageInput" accept="image/*" style="display: none;" onchange="Profile.handleImageUpload(this)">

        <h2 class="profile-name">${user?.name || 'User'}</h2>
        <p class="profile-email">${user?.email || ''}</p>

        <div class="profile-stats">
          <div class="profile-stat">
            <div class="profile-stat-value">${stats?.totalHabits || 0}</div>
            <div class="profile-stat-label">Habits</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${stats?.highestStreak || 0}</div>
            <div class="profile-stat-label">Best Streak</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${Stats.getTotalCompletions()}</div>
            <div class="profile-stat-label">Completions</div>
          </div>
        </div>
      </div>

      <!-- Today's Targets Summary -->
      <div class="card" style="margin-bottom: var(--space-5); background: var(--gradient-primary); color: white; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -20px; right: -20px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
        <div style="position: relative; z-index: 1;">
          <h3 style="margin-bottom: var(--space-4); display: flex; align-items: center; gap: var(--space-2);">
            <i data-lucide="target" style="width: 20px; height: 20px;"></i>
            Target Performance
          </h3>
          <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr); gap: var(--space-4);">
            <div style="text-align: center; padding: var(--space-3); background: rgba(255,255,255,0.15); border-radius: var(--radius-lg);">
              <div style="font-size: var(--font-size-xl); font-weight: 700;" id="profileTargetTotal">0</div>
              <div style="font-size: var(--font-size-xs); opacity: 0.9;">Total Targets</div>
            </div>
            <div style="text-align: center; padding: var(--space-3); background: rgba(255,255,255,0.15); border-radius: var(--radius-lg);">
              <div style="font-size: var(--font-size-xl); font-weight: 700;" id="profileTargetCompleted">0</div>
              <div style="font-size: var(--font-size-xs); opacity: 0.9;">Completed</div>
            </div>
            <div style="text-align: center; padding: var(--space-3); background: rgba(255,255,255,0.15); border-radius: var(--radius-lg);">
              <div style="font-size: var(--font-size-xl); font-weight: 700;" id="profileTargetStreak">0</div>
              <div style="font-size: var(--font-size-xs); opacity: 0.9;">Day Streak</div>
            </div>
            <div style="text-align: center; padding: var(--space-3); background: rgba(255,255,255,0.15); border-radius: var(--radius-lg);">
              <div style="font-size: var(--font-size-xl); font-weight: 700;" id="profileBestDay">-</div>
              <div style="font-size: var(--font-size-xs); opacity: 0.9;">Best Day</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile Info -->
      <div class="card" style="margin-bottom: var(--space-5);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
          <h3>Profile Information</h3>
          <button class="btn btn-sm btn-ghost" onclick="Profile.openEditModal()">
            <i data-lucide="pencil"></i>
            Edit
          </button>
        </div>

        <div style="display: grid; gap: var(--space-4);">
          <div style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
            <i data-lucide="user" style="width: 20px; height: 20px; color: var(--text-tertiary);"></i>
            <div>
              <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Name</div>
              <div style="font-weight: 500;">${user?.name || '-'}</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
            <i data-lucide="mail" style="width: 20px; height: 20px; color: var(--text-tertiary);"></i>
            <div>
              <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Email</div>
              <div style="font-weight: 500;">${user?.email || '-'}</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
            <i data-lucide="calendar" style="width: 20px; height: 20px; color: var(--text-tertiary);"></i>
            <div>
              <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Member Since</div>
              <div style="font-weight: 500;">${user?.joinDate ? Utils.formatDisplayDate(user.joinDate) : '-'}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievements Summary -->
      <div class="card" style="margin-bottom: var(--space-5);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
          <h3>Achievements</h3>
          <a href="achievements.html" class="btn btn-sm btn-ghost">View All</a>
        </div>

        <div id="recentAchievements" style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
          <!-- Recent achievements will be rendered here -->
        </div>
      </div>

      <!-- Export Data -->
      <div class="card">
        <h3 style="margin-bottom: var(--space-4);">Export Your Data</h3>
        <p style="font-size: var(--font-size-sm); color: var(--text-tertiary); margin-bottom: var(--space-4);">
          Download your habit data in various formats
        </p>
        <div class="export-buttons">
          <button class="btn btn-secondary" onclick="Export.exportHabits()">
            <i data-lucide="file-text"></i>
            Export CSV
          </button>
          <button class="btn btn-secondary" onclick="Export.toExcel(Export.getHabitData(), 'habits_export')">
            <i data-lucide="file-spreadsheet"></i>
            Export Excel
          </button>
          <button class="btn btn-secondary" onclick="Export.exportFullReport()">
            <i data-lucide="file"></i>
            Export PDF
          </button>
        </div>
      </div>
    `);
  },

  // Load profile data
  loadData() {
    this.renderRecentAchievements();
    this.renderTargetStats();
  },

  // Render target stats
  renderTargetStats() {
    const allTargets = DailyTargets.getAllUserTargets();

    document.getElementById('profileTargetTotal').textContent = allTargets.length;
    document.getElementById('profileTargetCompleted').textContent = DailyTargets.getTotalCompleted();
    document.getElementById('profileTargetStreak').textContent = DailyTargets.getStreak();
    document.getElementById('profileBestDay').textContent = DailyTargets.getMostProductiveDay() || '-';
  },

  // Render recent achievements
  renderRecentAchievements() {
    const container = document.getElementById('recentAchievements');
    if (!container) return;

    const achievements = Achievements.getAllAchievements();
    const unlocked = achievements.filter(a => a.unlocked).slice(0, 4);

    if (unlocked.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: var(--space-4); color: var(--text-tertiary); width: 100%;">
          <i data-lucide="trophy" style="width: 32px; height: 32px; margin-bottom: var(--space-2);"></i>
          <p style="font-size: var(--font-size-sm);">No achievements unlocked yet</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = unlocked.map(a => `
      <div style="display: flex; flex-direction: column; align-items: center; padding: var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-lg); min-width: 80px;">
        <div style="width: 40px; height: 40px; border-radius: var(--radius-lg); background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-2);">
          <i data-lucide="${a.icon}" style="width: 20px; height: 20px; color: white;"></i>
        </div>
        <span style="font-size: var(--font-size-xs); font-weight: 500; text-align: center;">${a.name}</span>
      </div>
    `).join('');

    lucide.createIcons();
  },

  // Select profile image
  selectImage() {
    document.getElementById('profileImageInput')?.click();
  },

  // Handle image upload
  async handleImageUpload(input) {
    if (!input.files || !input.files[0]) return;

    try {
      const imageUrl = await Auth.uploadProfileImage(input.files[0]);
      Toast.success('Profile Updated', 'Your profile image has been updated');

      // Update avatar display
      const avatar = document.getElementById('profileAvatar');
      if (avatar) {
        avatar.innerHTML = `<img src="${imageUrl}" alt="${App.currentUser?.name}">`;
      }

      // Update navbar avatar
      const navbarAvatar = document.querySelector('.navbar-avatar');
      if (navbarAvatar) {
        navbarAvatar.innerHTML = `<img src="${imageUrl}" alt="${App.currentUser?.name}">`;
      }
    } catch (error) {
      Toast.error('Upload Failed', error.message);
    }
  },

  // Open edit modal
  openEditModal() {
    const user = App.currentUser;

    Modal.open({
      title: 'Edit Profile',
      width: '450px',
      content: `
        <form id="profileForm" onsubmit="return false;">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input
              type="text"
              id="editName"
              class="form-input"
              value="${user?.name || ''}"
              required
              minlength="2"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input
              type="email"
              id="editEmail"
              class="form-input"
              value="${user?.email || ''}"
              disabled
              style="opacity: 0.7; cursor: not-allowed;"
            >
            <div class="form-hint">Email cannot be changed</div>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="Profile.saveEdit()">Save Changes</button>
      `
    });
  },

  // Save profile edit
  saveEdit() {
    const name = document.getElementById('editName')?.value?.trim();

    if (!name || name.length < 2) {
      Toast.error('Error', 'Name must be at least 2 characters');
      return;
    }

    Auth.updateProfile({ name });
    Toast.success('Profile Updated', 'Your profile has been updated');
    Modal.close();

    // Refresh page
    this.init();
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('profile.html')) {
    Profile.init();
  }
});

window.Profile = Profile;

// Helper for export
Export.getHabitData = function() {
  const habits = Storage.getHabits();
  const userHabits = habits.filter(h => h.userId === App.currentUser?.id);
  return userHabits.map(h => ({
    Title: h.title,
    Category: h.category,
    Frequency: h.frequency,
    'Current Streak': h.streak || 0,
    'Longest Streak': h.longestStreak || 0,
    'Created Date': h.createdDate,
    Notes: h.notes || ''
  }));
};
