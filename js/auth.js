/*
 * Client-side demo auth. There is no backend/database in this static app,
 * so accounts live in localStorage on the visitor's own browser. This is
 * good enough to demonstrate a real sign-up/sign-in flow and to scope
 * bookmarks per user, but it is NOT secure authentication — never reuse
 * this pattern for an app that handles real user data.
 */

const USERS_KEY = "gnh_users";
const SESSION_KEY = "gnh_current_user";

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Not real password hashing — just avoids storing plaintext directly in the object dump.
function obfuscate(password) {
  return btoa(unescape(encodeURIComponent(password)));
}

function setSession(email, name) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, name }));
}

function ensureDemoUser() {
  const users = readUsers();
  if (!users["demo@globalnewshub.app"]) {
    users["demo@globalnewshub.app"] = {
      name: "Demo Reader",
      password: obfuscate("demo1234"),
    };
    saveUsers(users);
  }
}
ensureDemoUser();

// --- Tab switching ---
const tabButtons = document.querySelectorAll(".tab-btn");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const isLogin = btn.dataset.tab === "login";
    loginForm.classList.toggle("hidden", !isLogin);
    signupForm.classList.toggle("hidden", isLogin);
  });
});

// --- Sign up ---
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim().toLowerCase();
  const password = document.getElementById("signup-password").value;
  const errorEl = document.getElementById("signup-error");

  const users = readUsers();
  if (users[email]) {
    errorEl.textContent = "An account with that email already exists.";
    return;
  }

  users[email] = { name, password: obfuscate(password) };
  saveUsers(users);
  setSession(email, name);
  window.location.href = "index.html";
});

// --- Sign in ---
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");

  const users = readUsers();
  const user = users[email];
  if (!user || user.password !== obfuscate(password)) {
    errorEl.textContent = "Incorrect email or password.";
    return;
  }

  setSession(email, user.name);
  window.location.href = "index.html";
});

// --- Demo login shortcut ---
document.getElementById("demo-login").addEventListener("click", () => {
  const users = readUsers();
  const demo = users["demo@globalnewshub.app"];
  setSession("demo@globalnewshub.app", demo.name);
  window.location.href = "index.html";
});

// If already signed in, skip straight to the dashboard.
if (localStorage.getItem(SESSION_KEY)) {
  window.location.href = "index.html";
}
