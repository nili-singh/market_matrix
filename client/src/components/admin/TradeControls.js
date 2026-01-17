import api from '../../utils/api.js';

export default function TradeControls(container) {
    let teams = [];
    let assets = [];

    async function render() {
        try {
            const [teamsResponse, assetsResponse] = await Promise.all([
                api.getTeams(),
                api.getAssets(),
            ]);

            teams = teamsResponse.teams.filter(t => t.round1Qualified);
            assets = assetsResponse.assets;

            container.innerHTML = `
        <div class="grid grid-2 gap-md">
          <!-- Market Trading -->
          <div class="glass-card p-lg">
            <h3 class="mb-md">Market Trading</h3>
            
            <form id="marketTradeForm">
              <div class="form-group">
                <label class="form-label">Team</label>
                <select class="input" id="tradeTeam" required>
                  <option value="">-- Select Team --</option>
                  ${teams.map(team => `
                    <option value="${team._id}">${team.teamName}</option>
                  `).join('')}
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Asset</label>
                <select class="input" id="tradeAsset" required>
                  <option value="">-- Select Asset --</option>
                  ${assets.map(asset => `
                    <option value="${asset.assetType}">${asset.name} (₹${asset.currentValue.toFixed(2)})</option>
                  `).join('')}
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Action</label>
                <select class="input" id="tradeAction" required>
                  <option value="">-- Select Action --</option>
                  <option value="BUY">Buy</option>
                  <option value="SELL">Sell</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Quantity</label>
                <input type="number" class="input" id="tradeQuantity" min="1" required />
              </div>
              
              <button type="submit" class="btn btn-primary" style="width: 100%;">
                Execute Trade
              </button>
            </form>
          </div>
          
          <!-- Team-to-Team Trading -->
          <div class="glass-card p-lg">
            <h3 class="mb-md">Team-to-Team Trading</h3>
            
            <form id="teamTradeForm">
              <div class="form-group">
                <label class="form-label">From Team (Seller)</label>
                <select class="input" id="fromTeam" required>
                  <option value="">-- Select Team --</option>
                  ${teams.map(team => `
                    <option value="${team._id}">${team.teamName}</option>
                  `).join('')}
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">To Team (Buyer)</label>
                <select class="input" id="toTeam" required>
                  <option value="">-- Select Team --</option>
                  ${teams.map(team => `
                    <option value="${team._id}">${team.teamName}</option>
                  `).join('')}
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Asset</label>
                <select class="input" id="teamTradeAsset" required>
                  <option value="">-- Select Asset --</option>
                  ${assets.map(asset => `
                    <option value="${asset.assetType}">${asset.name}</option>
                  `).join('')}
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Quantity</label>
                <input type="number" class="input" id="teamTradeQuantity" min="1" required />
              </div>
              
              <div class="form-group">
                <label class="form-label">Agreed Price (per unit)</label>
                <input type="number" class="input" id="agreedPrice" min="0" step="0.01" required />
              </div>
              
              <button type="submit" class="btn btn-warning" style="width: 100%;">
                Execute Team Trade
              </button>
            </form>
          </div>
        </div>
      `;

            // Market trade form
            const marketTradeForm = document.getElementById('marketTradeForm');
            marketTradeForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const tradeData = {
                    teamId: document.getElementById('tradeTeam').value,
                    assetType: document.getElementById('tradeAsset').value,
                    action: document.getElementById('tradeAction').value,
                    quantity: parseInt(document.getElementById('tradeQuantity').value),
                };

                try {
                    await api.executeTrade(tradeData);
                    alert('Trade executed successfully!');
                    marketTradeForm.reset();
                } catch (error) {
                    alert(error.message);
                }
            });

            // Team trade form
            const teamTradeForm = document.getElementById('teamTradeForm');
            teamTradeForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const tradeData = {
                    fromTeamId: document.getElementById('fromTeam').value,
                    toTeamId: document.getElementById('toTeam').value,
                    assetType: document.getElementById('teamTradeAsset').value,
                    quantity: parseInt(document.getElementById('teamTradeQuantity').value),
                    agreedPrice: parseFloat(document.getElementById('agreedPrice').value),
                };

                if (tradeData.fromTeamId === tradeData.toTeamId) {
                    alert('Cannot trade with the same team!');
                    return;
                }

                try {
                    await api.executeTeamTrade(tradeData);
                    alert('Team trade executed successfully!');
                    teamTradeForm.reset();
                } catch (error) {
                    alert(error.message);
                }
            });

        } catch (error) {
            console.error('Error loading trade controls:', error);
        }
    }

    render();
}
