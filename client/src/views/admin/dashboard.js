import api from '../../utils/api.js';
import socket from '../../utils/socket.js';
import Leaderboard from '../../components/admin/Leaderboard.js';
import CardControls from '../../components/admin/CardControls.js';
import RoundControls from '../../components/admin/RoundControls.js';
import TradeControls from '../../components/admin/TradeControls.js';
import TeamManagement from '../../components/admin/TeamManagement.js';

export default async function adminDashboard(container) {
  // Verify authentication
  try {
    await api.verifyToken();
  } catch (error) {
    window.navigateTo('/admin');
    return;
  }

  container.innerHTML = `
    <div class="admin-dashboard">
      <!-- Header -->
      <header class="glass-card" style="padding: 1.5rem; margin-bottom: 2rem;">
        <div class="container flex-between">
          <div>
            <h1 style="font-size: 2rem; margin-bottom: 0.25rem;">Market Matrix Admin</h1>
            <p class="text-muted" style="margin: 0;">Control Panel</p>
          </div>
          <div style="display: flex; gap: 1rem;">
            <button class="btn btn-outline" id="homeBtn">
              🏠 Back to Home
            </button>
            <button class="btn btn-secondary" id="logoutBtn">
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <div class="container">
        <!-- Round Controls -->
        <div id="roundControls" class="mb-lg"></div>
        
        <!-- Tabs -->
        <div class="glass-card mb-md" style="padding: 0;">
          <div class="flex" style="border-bottom: 1px solid var(--glass-border);">
            <button class="tab-btn active" data-tab="teams">
              👥 Teams
            </button>
            <button class="tab-btn" data-tab="leaderboard">
              📊 Leaderboard
            </button>
            <button class="tab-btn" data-tab="cards">
              🃏 Card System
            </button>
            <button class="tab-btn" data-tab="trading">
              💰 Trading
            </button>
          </div>
        </div>
        
        <!-- Tab Content -->
        <div id="tabContent">
          <div id="teams-tab" class="tab-content active"></div>
          <div id="leaderboard-tab" class="tab-content" style="display: none;"></div>
          <div id="cards-tab" class="tab-content" style="display: none;"></div>
          <div id="trading-tab" class="tab-content" style="display: none;"></div>
        </div>
      </div>
    </div>
  `;

  // Tab switching
  const tabBtns = container.querySelectorAll('.tab-btn');
  const tabContents = container.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;

      // Update active states
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabContents.forEach(content => {
        content.style.display = 'none';
      });

      document.getElementById(`${tabName}-tab`).style.display = 'block';
    });
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    api.logout();
    window.navigateTo('/admin');
  });

  // Back to Home
  document.getElementById('homeBtn').addEventListener('click', () => {
    window.navigateTo('/');
  });

  // Load components
  const roundControlsContainer = document.getElementById('roundControls');
  const teamsContainer = document.getElementById('teams-tab');
  const leaderboardContainer = document.getElementById('leaderboard-tab');
  const cardsContainer = document.getElementById('cards-tab');
  const tradingContainer = document.getElementById('trading-tab');

  RoundControls(roundControlsContainer);
  TeamManagement(teamsContainer);
  Leaderboard(leaderboardContainer);
  CardControls(cardsContainer);
  TradeControls(tradingContainer);

  // Add tab styles
  const style = document.createElement('style');
  style.textContent = `
    .tab-btn {
      flex: 1;
      padding: 1rem 1.5rem;
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-base);
      border-bottom: 2px solid transparent;
    }
    
    .tab-btn:hover {
      color: var(--color-text-primary);
      background: rgba(99, 102, 241, 0.05);
    }
    
    .tab-btn.active {
      color: var(--color-accent-primary);
      border-bottom-color: var(--color-accent-primary);
    }
  `;
  document.head.appendChild(style);
}
