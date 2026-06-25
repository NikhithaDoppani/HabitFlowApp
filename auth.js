/**
 * Habit Tracker - Authentication Module
 * Handles user registration, login, and session management
 */

const Auth = {
  // Validation patterns
  patterns: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /^.{6,}$/
  },

  // Initialize auth state
  init() {
    this.checkSession();
  },

  // Check if user is logged in
  checkSession() {
    const user = Storage.getUser();
    return !!user;
  },

  // Register new user
  register(name, email, password) {
    // Validate inputs
    const errors = this.validateRegistration(name, email, password);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Check if email already exists
    const existingUser = Storage.findUser(email);
    if (existingUser) {
      return {
        success: false,
        errors: ['An account with this email already exists']
      };
    }

    // Create user object
    const user = {
      id: Utils.generateId(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // In production, this would be hashed
      profileImage: null,
      joinDate: Utils.formatDate(new Date()),
      settings: {
        notifications: true,
        emailReminders: false,
        theme: 'light'
      }
    };

    // Save user
    Storage.saveUser(user);
    Storage.saveHabits([]);
    Storage.saveLogs([]);
    Storage.saveAchievements([]);

    // Auto login after registration
    this.setCurrentUser(user);

    return { success: true, user };
  },

  // Login user
  login(email, password, rememberMe = false) {
    // Validate inputs
    if (!email || !password) {
      return {
        success: false,
        errors: ['Please fill in all fields']
      };
    }

    // Find user
    const user = Storage.findUser(email);
    if (!user) {
      return {
        success: false,
        errors: ['No account found with this email']
      };
    }

    // Verify password (in production, this would compare hashed passwords)
    if (user.password !== password) {
      return {
        success: false,
        errors: ['Invalid password']
      };
    }

    // Set current user
    const fullUser = {
      id: user.id || Utils.generateId(),
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      joinDate: user.joinDate || Utils.formatDate(new Date()),
      settings: user.settings || {}
    };

    this.setCurrentUser(fullUser);

    return { success: true, user: fullUser };
  },

  // Set current user session
  setCurrentUser(user) {
    Storage.save(Storage.keys.USER, user);
    App.currentUser = user;
  },

  // Logout user
  logout() {
    Storage.remove(Storage.keys.USER);
    App.currentUser = null;
    window.location.href = 'login.html';
  },

  // Forgot password (mock implementation)
  forgotPassword(email) {
    // Validate email
    if (!email || !this.patterns.email.test(email)) {
      return {
        success: false,
        errors: ['Please enter a valid email address']
      };
    }

    // Check if user exists
    const user = Storage.findUser(email);
    if (!user) {
      // Don't reveal if email exists or not (security)
      return {
        success: true,
        message: 'If an account exists with this email, you will receive reset instructions'
      };
    }

    // In a real app, this would send an email
    // For this mock, we'll just show a success message
    return {
      success: true,
      message: 'Password reset link has been sent to your email'
    };
  },

  // Update password
  updatePassword(currentPassword, newPassword) {
    const user = Storage.getUser();
    if (!user) {
      return { success: false, errors: ['You must be logged in'] };
    }

    // Verify current password
    const fullUser = Storage.findUser(user.email);
    if (fullUser.password !== currentPassword) {
      return { success: false, errors: ['Current password is incorrect'] };
    }

    // Validate new password
    if (!this.patterns.password.test(newPassword)) {
      return { success: false, errors: ['Password must be at least 6 characters'] };
    }

    // Update password
    const users = Storage.getAllUsers();
    const userIndex = users.findIndex(u => u.email === user.email);
    if (userIndex >= 0) {
      users[userIndex].password = newPassword;
      Storage.save(Storage.keys.USERS, users);
    }

    return { success: true, message: 'Password updated successfully' };
  },

  // Update profile
  updateProfile(updates) {
    const user = Storage.getUser();
    if (!user) {
      return { success: false, errors: ['You must be logged in'] };
    }

    const updatedUser = { ...user, ...updates };
    Storage.saveUser(updatedUser);
    App.currentUser = updatedUser;

    return { success: true, user: updatedUser };
  },

  // Delete account
  deleteAccount() {
    const user = Storage.getUser();
    if (!user) {
      return { success: false, errors: ['You must be logged in'] };
    }

    // Remove user from users list
    const users = Storage.getAllUsers();
    const filteredUsers = users.filter(u => u.email !== user.email);
    Storage.save(Storage.keys.USERS, filteredUsers);

    // Clear all user data
    Storage.clearAll();

    // Redirect to login
    window.location.href = 'login.html';

    return { success: true };
  },

  // Validation helpers
  validateRegistration(name, email, password) {
    const errors = [];

    if (!name || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (!email || !this.patterns.email.test(email)) {
      errors.push('Please enter a valid email address');
    }

    if (!password || !this.patterns.password.test(password)) {
      errors.push('Password must be at least 6 characters');
    }

    return errors;
  },

  validateLogin(email, password) {
    const errors = [];

    if (!email) {
      errors.push('Email is required');
    } else if (!this.patterns.email.test(email)) {
      errors.push('Please enter a valid email address');
    }

    if (!password) {
      errors.push('Password is required');
    }

    return errors;
  },

  // Get user stats
  getUserStats() {
    const user = Storage.getUser();
    if (!user) return null;

    const habits = Storage.getHabits();
    const userHabits = habits.filter(h => h.userId === user.id);

    return {
      totalHabits: userHabits.length,
      highestStreak: Math.max(...userHabits.map(h => h.longestStreak || 0), 0),
      joinDate: user.joinDate
    };
  },

  // Upload profile image
  uploadProfileImage(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      if (!file.type.startsWith('image/')) {
        reject(new Error('Please select an image file'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('Image must be less than 5MB'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const user = Storage.getUser();
        if (user) {
          user.profileImage = e.target.result;
          Storage.saveUser(user);
          App.currentUser = user;
          resolve(e.target.result);
        } else {
          reject(new Error('User not logged in'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
};

// Form handlers
const AuthForms = {
  // Handle login form
  handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const rememberMe = document.getElementById('rememberMe')?.checked;

    const result = Auth.login(email, password, rememberMe);

    if (result.success) {
      Toast.success('Welcome back!', `Logged in as ${result.user.name}`);
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      Toast.error('Login Failed', result.errors[0]);
    }
  },

  // Handle registration form
  handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('name')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    // Check password match
    if (password !== confirmPassword) {
      Toast.error('Error', 'Passwords do not match');
      return;
    }

    const result = Auth.register(name, email, password);

    if (result.success) {
      Toast.success('Account Created!', 'Welcome to HabitFlow');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      Toast.error('Registration Failed', result.errors[0]);
    }
  },

  // Handle forgot password form
  handleForgotPassword(event) {
    event.preventDefault();

    const email = document.getElementById('email')?.value;
    const result = Auth.forgotPassword(email);

    if (result.success) {
      Toast.success('Email Sent', result.message);
    } else {
      Toast.error('Error', result.errors[0]);
    }
  },

  // Show/hide password
  togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }
};

// Initialize on auth pages
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons if available
  if (window.lucide) {
    lucide.createIcons();
  }
});

// Export
window.Auth = Auth;
window.AuthForms = AuthForms;
