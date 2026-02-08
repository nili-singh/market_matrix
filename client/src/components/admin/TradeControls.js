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
                    <option value="${asset.assetType}">${asset.name} (${asset.currentValue.toFixed(0)} points)</option>
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
          
          <!-- Multi-Asset Batch Trading -->
          <div class="glass-card p-lg" style="grid-column: 1 / -1;">
            <h3 class="mb-md">Multi-Asset Batch Trading</h3>
            <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 1rem;">Execute multiple asset trades for a team simultaneously</p>
            
            <form id="batchTradeForm">
              <div class="grid grid-2 gap-md mb-md">
                <div class="form-group">
                  <label class="form-label">Team</label>
                  <select class="input" id="batchTradeTeam" required>
                    <option value="">-- Select Team --</option>
                    ${teams.map(team => `
                      <option value="${team._id}">${team.teamName}</option>
                    `).join('')}
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Action</label>
                  <select class="input" id="batchTradeAction" required>
                    <option value="">-- Select Action --</option>
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group mb-md">
                <label class="form-label">Select Assets to Trade</label>
                <div style="background: rgba(0, 0, 0, 0.2); padding: 1rem; border-radius: 8px;">
                  ${assets.map(asset => `
                    <div style="display: flex; align-items: center; padding: 0.75rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                      <input 
                        type="checkbox" 
                        id="asset_${asset.assetType}" 
                        class="asset-checkbox"
                        data-asset-type="${asset.assetType}"
                        style="width: 20px; height: 20px; margin-right: 1rem; cursor: pointer;"
                      />
                      <div style="flex: 1;">
                        <div style="font-weight: 500;">${asset.name}</div>
                        <div style="font-size: 0.875rem; color: #9CA3AF;">
                          Current Price: ${asset.currentValue.toFixed(0)} points
                          <span id="teamHolding_${asset.assetType}" class="team-holding" style="margin-left: 1rem; color: #60A5FA;"></span>
                        </div>
                      </div>
                      <input 
                        type="number" 
                        id="quantity_${asset.assetType}" 
                        class="input asset-quantity"
                        placeholder="Quantity"
                        min="1"
                        disabled
                        style="width: 150px; margin-left: 1rem;"
                      />
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <button type="submit" class="btn btn-success" style="width: 100%;">
                🔄 Execute Batch Trade
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

      // Batch trade form
      const batchTradeForm = document.getElementById('batchTradeForm');
      const batchTradeTeam = document.getElementById('batchTradeTeam');
      const checkboxes = document.querySelectorAll('.asset-checkbox');

      // Enable/disable quantity inputs based on checkbox state
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const assetType = e.target.dataset.assetType;
          const quantityInput = document.getElementById(`quantity_${assetType}`);
          quantityInput.disabled = !e.target.checked;
          if (!e.target.checked) {
            quantityInput.value = '';
          }
        });
      });

      // Load team holdings when team is selected
      batchTradeTeam.addEventListener('change', async (e) => {
        const teamId = e.target.value;

        // Clear all holdings
        document.querySelectorAll('.team-holding').forEach(span => {
          span.textContent = '';
        });

        if (!teamId) return;

        try {
          // Find the selected team
          const selectedTeam = teams.find(t => t._id === teamId);
          if (selectedTeam && selectedTeam.assets) {
            // Display current holdings for each asset
            Object.keys(selectedTeam.assets).forEach(assetType => {
              const holdingSpan = document.getElementById(`teamHolding_${assetType}`);
              if (holdingSpan) {
                const quantity = selectedTeam.assets[assetType] || 0;
                holdingSpan.textContent = `(Team owns: ${quantity})`;
              }
            });
          }
        } catch (error) {
          console.error('Error loading team holdings:', error);
        }
      });

      // Submit batch trade
      batchTradeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const teamId = document.getElementById('batchTradeTeam').value;
        const action = document.getElementById('batchTradeAction').value;

        // Collect selected assets
        const trades = [];
        checkboxes.forEach(checkbox => {
          if (checkbox.checked) {
            const assetType = checkbox.dataset.assetType;
            const quantity = parseInt(document.getElementById(`quantity_${assetType}`).value);

            if (quantity && quantity > 0) {
              trades.push({ assetType, quantity });
            }
          }
        });

        // Validate at least one asset selected
        if (trades.length === 0) {
          alert('Please select at least one asset and enter a quantity');
          return;
        }

        try {
          const submitBtn = batchTradeForm.querySelector('button[type="submit"]');
          submitBtn.disabled = true;
          submitBtn.textContent = 'Executing...';

          const result = await api.executeBatchTrade({
            teamId,
            action,
            trades
          });

          // Show results
          const successCount = result.successCount || 0;
          const failureCount = result.failureCount || 0;

          let message = `Batch Trade Complete!\n\n`;
          message += `✅ Successful: ${successCount}\n`;
          if (failureCount > 0) {
            message += `❌ Failed: ${failureCount}\n\n`;
            message += 'Details:\n';
            result.results.forEach(r => {
              const icon = r.success ? '✅' : '❌';
              message += `${icon} ${r.assetType}: ${r.message}\n`;
            });
          }

          alert(message);

          // Reset form
          batchTradeForm.reset();
          checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            const assetType = checkbox.dataset.assetType;
            const quantityInput = document.getElementById(`quantity_${assetType}`);
            quantityInput.disabled = true;
            quantityInput.value = '';
          });

          // Clear holdings
          document.querySelectorAll('.team-holding').forEach(span => {
            span.textContent = '';
          });

          // Refresh teams data to update holdings
          render();

        } catch (error) {
          alert(error.message || 'Failed to execute batch trade');
        } finally {
          const submitBtn = batchTradeForm.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '🔄 Execute Batch Trade';
          }
        }
      });

    } catch (error) {
      console.error('Error loading trade controls:', error);
    }
  }

  render();
}
