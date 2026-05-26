const ADMIN_LOGIN_KEY = 'siputra_admin_logged_in';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');

function showLoginMessage(message, type = 'error') {
  if (!loginMessage) return;
  loginMessage.hidden = false;
  loginMessage.textContent = message;
  loginMessage.className = `login-message ${type}`;
}

if (localStorage.getItem(ADMIN_LOGIN_KEY) === 'true') {
  window.location.replace('admin.html');
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_LOGIN_KEY, 'true');
    window.location.replace('admin.html');
    return;
  }

  showLoginMessage('Username atau password salah.');
});
