// src/services/auth.js

// -------------------- LocalStorage Utilities --------------------
const LS = {
  get(key, fallback = null) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};

// -------------------- User Management --------------------

// Seed demo users if none exist
if (!LS.get("users")) {
  LS.set("users", [
    { id: "u_you", name: "You", username: "you", email: "you@example.com", password: "123456", avatarColor: "#0ea5a4" },
    { id: "u_alice", name: "Alice Johnson", username: "alice", email: "alice@example.com", password: "alice123", avatarColor: "#fb7185" },
    { id: "u_bob", name: "Bob Kamau", username: "bob", email: "bob@example.com", password: "bob123", avatarColor: "#60a5fa" },
    { id: "u_carol", name: "Carol Ngo", username: "carol", email: "carol@example.com", password: "carol123", avatarColor: "#f59e0b" }
  ]);
}

// -------------------- Helper Functions --------------------
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
export const getAllUsers = () => LS.get("users", []);
export const saveAllUsers = (users) => LS.set("users", users);

export const getCurrentUser = () => {
  const user = LS.get("currentUser");
  if (!user) return null;

  // Check idle timeout
  const lastActive = LS.get("lastActive");
  const now = Date.now();
  if (lastActive && now - lastActive > 10 * 60 * 1000) { // 10 minutes
    logoutUser();
    return null;
  }

  // Update last active timestamp
  LS.set("lastActive", now);
  return user;
};

// Alias for compatibility
export const getLoggedUser = getCurrentUser;

export const isAuthenticated = () => !!getCurrentUser();

// -------------------- Auth Functions --------------------

/**
 * Register a new user
 * @param {Object} user - {name, username, email, password}
 * @returns {Object} user
 */
export function registerUser(user) {
  const users = getAllUsers();

  // Check for duplicate email or username
  if (users.find(u => u.email === user.email)) throw new Error("Email already registered");
  if (users.find(u => u.username === user.username)) throw new Error("Username already taken");

  const newUser = {
    ...user,
    id: generateId(),
    avatarColor: user.avatarColor || "#10b981"
  };

  users.push(newUser);
  saveAllUsers(users);

  // Auto-login
  LS.set("currentUser", newUser);
  LS.set("lastActive", Date.now());

  return newUser;
}

/**
 * Login user
 * @param {string} email
 * @param {string} password
 * @returns {Object} user
 */
export function loginUser(email, password) {
  const user = getAllUsers().find(u => u.email === email && u.password === password);
  if (!user) throw new Error("Invalid email or password");

  LS.set("currentUser", user);
  LS.set("lastActive", Date.now());
  return user;
}

/**
 * Logout current user
 */
export function logoutUser() {
  LS.remove("currentUser");
  LS.remove("lastActive");
}

/**
 * Update current user profile
 * @param {Object} updates - {name, username, email, password, avatarColor}
 */
export function updateUser(updates) {
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error("Not logged in");

  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === currentUser.id);
  if (idx === -1) throw new Error("User not found");

  const updatedUser = { ...users[idx], ...updates };
  users[idx] = updatedUser;
  saveAllUsers(users);
  LS.set("currentUser", updatedUser);
  LS.set("lastActive", Date.now());

  return updatedUser;
}

/**
 * Change password
 * @param {string} oldPassword
 * @param {string} newPassword
 */
export function changePassword(oldPassword, newPassword) {
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error("Not logged in");
  if (currentUser.password !== oldPassword) throw new Error("Old password incorrect");

  return updateUser({ password: newPassword });
}

/**
 * Get user by ID
 * @param {string} id
 * @returns {Object|null}
 */
export function getUserById(id) {
  return getAllUsers().find(u => u.id === id) || null;
}
