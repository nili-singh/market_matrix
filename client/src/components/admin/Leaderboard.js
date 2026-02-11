import api from '../../utils/api.js';
import socket from '../../utils/socket.js';

export default function Leaderboard(container) {
  let leaderboard = [];
  let assets = [];

  async function render() {
    try {
      const [leaderboardResponse, assetsResponse] = await Promise.all([
        api.getLeaderboard(),
        api.getAssets(),
      ]);

      leaderboard = leaderboardResponse.leaderboard;
      assets = assetsResponse.assets;

      container.innerHTML = `
        <div class="glass-card p-lg">
          <h3 class="mb-md">Team Leaderboard</h3>
          
          <div style="overflow-x: auto;">
            <table class="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Team Name</th>
                  <th>Balance</th>
                  <th>Crypto</th>
                  <th>Stock</th>
                  <th>Gold</th>
                  <th>Euro Bond</th>
                  <th>T-Bill</th>
                  <th>Portfolio Value</th>
                </tr>
              </thead>
              <tbody>
                ${leaderboard.length === 0 ? `
                  <tr>
                    <td colspan="9" class="text-center text-muted">No teams yet</td>
                  </tr>
                ` : leaderboard.map((team, index) => `
                  <tr>
                    <td>
                      <span class="badge ${index === 0 ? 'badge-warning' : index === 1 ? 'badge-info' : 'badge-success'}">
                        ${index + 1}
                      </span>
                    </td>
                    <td style="font-weight: 600;">${team.teamName}</td>
                    <td>${team.balance.toLocaleString()} points</td>
                    <td>${team.assets.CRYPTO || 0}</td>
                    <td>${team.assets.STOCK || 0}</td>
                    <td>${team.assets.GOLD || 0}</td>
                    <td>${team.assets.EURO_BOND || 0}</td>
                    <td>${team.assets.TREASURY_BILL || 0}</td>
                    <td style="font-weight: 700; color: var(--color-accent-primary);">
                      ${team.portfolioValue.toLocaleString()} points
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

    } catch (error) {
      console.error('Error loading leaderboard:', error);
      container.innerHTML = `
        <div class="glass-card p-lg">
          <p class="text-danger">Error loading leaderboard</p>
        </div>
      `;
    }
  }

  // Listen for updates
  socket.on('leaderboard:update', () => {
    render();
  });

  socket.on('leaderboard:updated', () => {
    render();
  });

  socket.on('trade:executed', () => {
    render();
  });

  socket.on('team:deleted', (data) => {
    console.log('Team deleted - refreshing leaderboard', data);
    render();
  });

  socket.on('card:drawn', (data) => {
    console.log('Card drawn - refreshing leaderboard', data);
    render();
  });

  render();
}
