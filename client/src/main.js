import socket from './utils/socket.js';
import adminLogin from './views/admin/login.js';
import adminDashboard from './views/admin/dashboard.js';
import playerView from './views/player/index.js';

// Router
const routes = {
    '/': () => renderLanding(),
    '/admin': () => renderAdminLogin(),
    '/admin/dashboard': () => renderAdminDashboard(),
    '/player': () => renderPlayerView(),
};

function getRoute() {
    return window.location.pathname || '/';
}

function navigate(path) {
    window.history.pushState({}, '', path);
    router();
}

function router() {
    const path = getRoute();
    const route = routes[path] || routes['/'];
    route();
}

function renderLanding() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="flex-center" style="min-height: 100vh;">
      <div class="container text-center slide-in">
        <h1 style="font-size: 3.5rem; margin-bottom: 1rem; background: var(--color-accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          Market Matrix
        </h1>
        <p style="font-size: 1.25rem; color: var(--color-text-secondary); margin-bottom: 3rem;">
          Multi-Round Trading Simulation Event
        </p>
        
        <div class="flex-center gap-md" style="flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="window.navigateTo('/player')" style="font-size: 1.125rem; padding: 1rem 2rem;">
            📊 View Live Graphs
          </button>
          <button class="btn btn-secondary" onclick="window.navigateTo('/admin')" style="font-size: 1.125rem; padding: 1rem 2rem;">
            🔐 Admin Login
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderAdminLogin() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    adminLogin(app);
}

function renderAdminDashboard() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    adminDashboard(app);
}

function renderPlayerView() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    playerView(app);
}

// Global navigation function
window.navigateTo = navigate;

// Handle browser back/forward
window.addEventListener('popstate', router);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Connect to WebSocket
    socket.connect();

    // Route to current path
    router();
});
