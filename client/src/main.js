import socket from './utils/socket.js';
import './styles/index.css';
import './styles/superadmin.css';
import adminLogin from './views/admin/login.js';
import adminDashboard from './views/admin/dashboard.js';
import playerView from './views/player/index.js';
import playerGraph from './views/player/graph.js';
import superAdminLogin from './views/superadmin/login.js';
import superAdminResetPanel from './views/superadmin/resetPanel.js';
import TeamLogin from './views/player/TeamLogin.js';
import PlayerDashboard from './views/player/PlayerDashboard.js';
import {
  getMarketVolatilityIcon,
  getStrategicTradingIcon,
  getRiskManagementIcon,
  getRegisterIcon,
  getTradeIcon,
  getCardsInfluenceIcon,
  getMarketReactsIcon,
  getWinnersIcon
} from './utils/icons.js';

// Router
const routes = {
  '/': () => renderLanding(),
  '/admin': () => renderAdminLogin(),
  '/admin/dashboard': () => renderAdminDashboard(),
  '/player': () => renderPlayerView(),
  '/player/graph': () => renderPlayerGraph(),
  '/superadmin': () => renderSuperAdminLogin(),
  '/superadmin/panel': () => renderSuperAdminResetPanel(),
  '/team-login': () => renderTeamLogin(),
  '/player-dashboard': () => renderPlayerDashboard(),
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
    <!-- Hero Section -->
    <section class="hero-section">
      <!-- Premium Financial Background Elements -->
      <div class="hero-bg-elements">
        <!-- Left Edge: Line Graph Pattern -->
        <svg class="hero-bg-left" viewBox="0 0 400 800" xmlns="http://www.w3.org/2000/svg">
          <!-- Subtle line graph -->
          <path d="M 50 400 Q 80 350, 110 380 T 170 340 T 230 360 T 290 320 T 350 350" 
                stroke="#4a7c9e" stroke-width="1.5" fill="none" opacity="0.15"/>
          <path d="M 30 500 Q 60 480, 90 510 T 150 470 T 210 490 T 270 450 T 330 480" 
                stroke="#5b7a9f" stroke-width="1.5" fill="none" opacity="0.12"/>
          
          <!-- Minimal candlestick silhouettes -->
          <g opacity="0.14">
            <line x1="100" y1="200" x2="100" y2="280" stroke="#4a7c9e" stroke-width="1"/>
            <rect x="95" y="220" width="10" height="40" stroke="#4a7c9e" stroke-width="1" fill="none"/>
            
            <line x1="140" y1="180" x2="140" y2="250" stroke="#4a7c9e" stroke-width="1"/>
            <rect x="135" y="195" width="10" height="35" stroke="#4a7c9e" stroke-width="1" fill="none"/>
            
            <line x1="180" y1="210" x2="180" y2="290" stroke="#4a7c9e" stroke-width="1"/>
            <rect x="175" y="230" width="10" height="45" stroke="#4a7c9e" stroke-width="1" fill="none"/>
          </g>
          
          <!-- Wave curves -->
          <path d="M 20 600 Q 80 580, 140 600 T 260 600 T 380 600" 
                stroke="#5b7a9f" stroke-width="1" fill="none" opacity="0.12"/>
          <path d="M 40 650 Q 100 630, 160 650 T 280 650 T 400 650" 
                stroke="#4a7c9e" stroke-width="1" fill="none" opacity="0.13"/>
        </svg>
        
        <!-- Right Edge: Line Graph Pattern -->
        <svg class="hero-bg-right" viewBox="0 0 400 800" xmlns="http://www.w3.org/2000/svg">
          <!-- Subtle line graph -->
          <path d="M 50 300 Q 80 280, 110 310 T 170 270 T 230 290 T 290 250 T 350 280" 
                stroke="#4a7c9e" stroke-width="1.5" fill="none" opacity="0.15"/>
          <path d="M 70 420 Q 100 400, 130 430 T 190 390 T 250 410 T 310 370 T 370 400" 
                stroke="#5b7a9f" stroke-width="1.5" fill="none" opacity="0.12"/>
          
          <!-- Minimal candlestick silhouettes -->
          <g opacity="0.15">
            <line x1="260" y1="150" x2="260" y2="220" stroke="#4a7c9e" stroke-width="1"/>
            <rect x="255" y="170" width="10" height="35" stroke="#4a7c9e" stroke-width="1" fill="none"/>
            
            <line x1="300" y1="130" x2="300" y2="200" stroke="#4a7c9e" stroke-width="1"/>
            <rect x="295" y="145" width="10" height="40" stroke="#4a7c9e" stroke-width="1" fill="none"/>
            
            <line x1="340" y1="160" x2="340" y2="240" stroke="#4a7c9e" stroke-width="1"/>
            <rect x="335" y="180" width="10" height="45" stroke="#4a7c9e" stroke-width="1" fill="none"/>
          </g>
          
          <!-- Wave curves -->
          <path d="M 20 550 Q 80 530, 140 550 T 260 550 T 380 550" 
                stroke="#5b7a9f" stroke-width="1" fill="none" opacity="0.12"/>
          <path d="M 0 700 Q 60 680, 120 700 T 240 700 T 360 700" 
                stroke="#4a7c9e" stroke-width="1" fill="none" opacity="0.13"/>
        </svg>
      </div>
      
      <!-- Floating Abstract Finance Icons -->
      <div class="floating-icons">
        <!-- Sparse network nodes and connections -->
        <svg class="float-icon float-1" width="60" height="60" viewBox="0 0 60 60">
          <circle cx="15" cy="15" r="2" fill="#4a7c9e" opacity="0.5"/>
          <circle cx="45" cy="40" r="2" fill="#5b7a9f" opacity="0.5"/>
          <line x1="15" y1="15" x2="45" y2="40" stroke="#4a7c9e" stroke-width="0.5" opacity="0.3"/>
        </svg>
        
        <svg class="float-icon float-2" width="50" height="50" viewBox="0 0 50 50">
          <path d="M 25 10 L 30 20 M 25 10 L 20 20" stroke="#5b7a9f" stroke-width="0.8" fill="none"/>
          <circle cx="25" cy="10" r="1.5" fill="#5b7a9f"/>
        </svg>
        
        <svg class="float-icon float-3" width="70" height="70" viewBox="0 0 70 70">
          <circle cx="20" cy="20" r="2" fill="#4a7c9e" opacity="0.5"/>
          <circle cx="50" cy="30" r="2" fill="#4a7c9e" opacity="0.5"/>
          <circle cx="35" cy="50" r="2" fill="#5b7a9f" opacity="0.5"/>
          <line x1="20" y1="20" x2="50" y2="30" stroke="#4a7c9e" stroke-width="0.5" opacity="0.3"/>
          <line x1="50" y1="30" x2="35" y2="50" stroke="#5b7a9f" stroke-width="0.5" opacity="0.3"/>
        </svg>
        
        <svg class="float-icon float-4" width="40" height="40" viewBox="0 0 40 40">
          <path d="M 20 30 L 20 10" stroke="#4a7c9e" stroke-width="0.8" fill="none"/>
          <path d="M 15 15 L 20 10 L 25 15" stroke="#4a7c9e" stroke-width="0.8" fill="none"/>
        </svg>
        
        <svg class="float-icon float-5" width="55" height="55" viewBox="0 0 55 55">
          <circle cx="15" cy="25" r="1.5" fill="#5b7a9f" opacity="0.5"/>
          <circle cx="40" cy="25" r="1.5" fill="#5b7a9f" opacity="0.5"/>
          <line x1="15" y1="25" x2="40" y2="25" stroke="#5b7a9f" stroke-width="0.5" opacity="0.3"/>
          <circle cx="27.5" cy="25" r="2" fill="none" stroke="#5b7a9f" stroke-width="0.5" opacity="0.4"/>
        </svg>
        
        <svg class="float-icon float-6" width="45" height="45" viewBox="0 0 45 45">
          <path d="M 22 10 L 22 30" stroke="#4a7c9e" stroke-width="0.8" fill="none"/>
          <path d="M 17 25 L 22 30 L 27 25" stroke="#4a7c9e" stroke-width="0.8" fill="none"/>
        </svg>
        
        <svg class="float-icon float-7" width="65" height="65" viewBox="0 0 65 65">
          <circle cx="25" cy="25" r="2" fill="#5b7a9f" opacity="0.5"/>
          <circle cx="40" cy="45" r="2" fill="#4a7c9e" opacity="0.5"/>
          <line x1="25" y1="25" x2="40" y2="45" stroke="#5b7a9f" stroke-width="0.5" opacity="0.3"/>
        </svg>
        
        <svg class="float-icon float-8" width="50" height="50" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="1.5" fill="#4a7c9e" opacity="0.5"/>
          <circle cx="25" cy="25" r="8" fill="none" stroke="#4a7c9e" stroke-width="0.5" opacity="0.3"/>
        </svg>
      </div>

      <div class="hero-content" style="padding-top: 4rem;">
        <img src="/assets/logo.jpeg" alt="TYCOONS - Rule the Floor" style="max-width: 500px; width: 90%; height: auto; margin: 0 auto 2.5rem auto; display: block;" />
        
        <h1 style="font-size: 4rem; margin-bottom: 1rem; background: linear-gradient(135deg, #e8eef5 0%, #b8c5d6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800;">
          Market Matrix
        </h1>
        
        <p style="font-size: 1.5rem; color: var(--color-text-secondary); margin-bottom: 3rem; max-width: 700px; margin-left: auto; margin-right: auto;">
          Navigate the depths of strategic trading. Where analytical precision meets high-stakes decision-making in a real-time financial simulation.
        </p>
        
        <div class="flex-center gap-md" style="flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="window.navigateTo('/player/graph')" style="font-size: 1.125rem; padding: 1rem 2.5rem;">
            View Live Graph
          </button>
          <button class="btn btn-secondary" onclick="window.navigateTo('/team-login')" style="font-size: 1.125rem; padding: 1rem 2.5rem;">
            Team Login
          </button>
        </div>
      </div>
    </section>

    <!-- Event Concept Cards -->
    <section style="background: var(--color-bg-secondary); padding: 4rem 0;">
      <div class="info-cards">
        <div class="info-card" data-animate>
          <div class="info-card-icon">${getMarketVolatilityIcon()}</div>
          <h3>Market Volatility</h3>
          <p>Experience dynamic asset prices that shift with every card drawn. Markets react in real-time, creating opportunities and risks at every turn.</p>
        </div>
        
        <div class="info-card" data-animate>
          <div class="info-card-icon">${getStrategicTradingIcon()}</div>
          <h3>Strategic Trading</h3>
          <p>Every trade matters. Balance your portfolio, manage risk, and outmaneuver competitors in this high-stakes financial simulation.</p>
        </div>
        
        <div class="info-card" data-animate>
          <div class="info-card-icon">${getRiskManagementIcon()}</div>
          <h3>Risk Management</h3>
          <p>Navigate card effects that can multiply your wealth or freeze your trades. Adapt your strategy to survive and thrive.</p>
        </div>
      </div>
    </section>

    <!-- Experience Flow -->
    <section class="experience-flow">
      <h2 class="flow-title">Your Journey</h2>
      
      <div class="flow-steps">
        <div class="flow-step" data-animate>
          <div class="flow-step-icon">${getRegisterIcon()}</div>
          <div class="flow-step-label">Register</div>
        </div>
        
        <div class="flow-step" data-animate>
          <div class="flow-step-icon">${getTradeIcon()}</div>
          <div class="flow-step-label">Trade</div>
        </div>
        
        <div class="flow-step" data-animate>
          <div class="flow-step-icon">${getCardsInfluenceIcon()}</div>
          <div class="flow-step-label">Cards Influence</div>
        </div>
        
        <div class="flow-step" data-animate>
          <div class="flow-step-icon">${getMarketReactsIcon()}</div>
          <div class="flow-step-label">Market Reacts</div>
        </div>
        
        <div class="flow-step" data-animate>
          <div class="flow-step-icon">${getWinnersIcon()}</div>
          <div class="flow-step-label">Winners</div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer style="text-align: center; padding: 3rem 2rem; background: var(--color-bg-primary); border-top: 1px solid var(--glass-border);">
      <p style="color: var(--color-text-muted); font-size: 0.875rem;">
        Market Matrix © 2026
      </p>
    </footer>
  `;

  // Scroll-based animations using Intersection Observer
  const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // Observe all elements with data-animate attribute
  document.querySelectorAll('[data-animate]').forEach(el => {
    observer.observe(el);
  });
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

function renderPlayerGraph() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  playerGraph(app);
}

function renderSuperAdminLogin() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  superAdminLogin(app);
}

function renderSuperAdminResetPanel() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  superAdminResetPanel(app);
}

function renderTeamLogin() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  TeamLogin(app);
}

function renderPlayerDashboard() {
  PlayerDashboard();
}

// Global navigation function
window.navigateTo = navigate;

// Handle browser back/forward
window.addEventListener('popstate', router);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Connect to WebSocket
  socket.connect();

  // Setup global socket listeners for app-wide events
  socket.on('game:reset', () => {
    console.log('Game reset event received - reloading application');
    // Show notification to user before reload
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.95);
      color: white;
      padding: 2rem 3rem;
      border-radius: 12px;
      font-size: 1.25rem;
      z-index: 99999;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;
    notification.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 0.5rem;">Game Reset</div>
      <div style="font-size: 1rem; color: #cbd5e1;">Reloading application...</div>
    `;
    document.body.appendChild(notification);

    // Reload after short delay for user to see message
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  });

  // Route to current path
  router();
});
