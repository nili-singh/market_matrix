import api from '../../utils/api.js';
import socket from '../../utils/socket.js';

export default function CardControls(container) {
    let teams = [];
    let lastDrawnCard = null;

    async function render() {
        try {
            const teamsResponse = await api.getTeams();
            teams = teamsResponse.teams.filter(t => t.round1Qualified);

            container.innerHTML = `
        <div class="glass-card p-lg">
          <h3 class="mb-md">Card System</h3>
          
          <div class="grid grid-2 gap-md mb-lg">
            <div>
              <label class="form-label">Select Team</label>
              <select class="input" id="teamSelect">
                <option value="">-- Select Team --</option>
                ${teams.map(team => `
                  <option value="${team._id}">${team.teamName}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="flex-center">
              <button class="btn btn-primary" id="drawCardBtn" disabled>
                🃏 Draw Card
              </button>
            </div>
          </div>
          
          ${lastDrawnCard ? `
            <div class="glass-card p-md mb-md" style="background: rgba(99, 102, 241, 0.1); border-color: var(--color-accent-primary);">
              <h4 class="mb-sm">Last Drawn Card</h4>
              <div class="flex-between mb-sm">
                <span class="badge ${getCategoryBadge(lastDrawnCard.category)}">
                  ${lastDrawnCard.category}
                </span>
                <span class="text-muted">${lastDrawnCard.cardId}</span>
              </div>
              <p style="margin: 0;">${lastDrawnCard.description}</p>
              
              ${lastDrawnCard.effects ? `
                <div class="mt-sm">
                  ${lastDrawnCard.effects.assetChanges?.map(change => `
                    <p class="text-sm ${change.percentChange > 0 ? 'text-success' : 'text-danger'}">
                      ${change.asset}: ${change.percentChange > 0 ? '+' : ''}${change.percentChange.toFixed(2)}%
                    </p>
                  `).join('') || ''}
                  
                  ${lastDrawnCard.effects.teamEffects?.map(effect => `
                    <p class="text-sm text-info">${effect}</p>
                  `).join('') || ''}
                  
                  ${lastDrawnCard.effects.nextTeamEffects?.map(effect => `
                    <p class="text-sm text-warning">⚠️ ${effect}</p>
                  `).join('') || ''}
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          <div class="glass-card p-md" style="background: rgba(100, 116, 139, 0.1);">
            <h4 class="mb-sm">Card Distribution</h4>
            <div class="grid grid-2 gap-sm">
              <div>
                <p class="text-muted" style="font-size: 0.875rem; margin: 0;">Asset Increase</p>
                <p style="font-weight: 600; margin: 0;">12 cards</p>
              </div>
              <div>
                <p class="text-muted" style="font-size: 0.875rem; margin: 0;">Asset Decrease</p>
                <p style="font-weight: 600; margin: 0;">12 cards</p>
              </div>
              <div>
                <p class="text-muted" style="font-size: 0.875rem; margin: 0;">Inter-Team Impact</p>
                <p style="font-weight: 600; margin: 0;">8 cards</p>
              </div>
              <div>
                <p class="text-muted" style="font-size: 0.875rem; margin: 0;">Neutral</p>
                <p style="font-weight: 600; margin: 0;">8 cards</p>
              </div>
            </div>
          </div>
        </div>
      `;

            // Event listeners
            const teamSelect = document.getElementById('teamSelect');
            const drawCardBtn = document.getElementById('drawCardBtn');

            teamSelect.addEventListener('change', () => {
                drawCardBtn.disabled = !teamSelect.value;
            });

            drawCardBtn.addEventListener('click', async () => {
                const teamId = teamSelect.value;
                if (!teamId) return;

                drawCardBtn.disabled = true;
                drawCardBtn.textContent = 'Drawing...';

                try {
                    const response = await api.drawCard(teamId);

                    if (response.skipped) {
                        alert(response.reason);
                        lastDrawnCard = null;
                    } else {
                        lastDrawnCard = {
                            ...response.card,
                            effects: response.effects,
                        };
                    }

                    render();
                } catch (error) {
                    alert(error.message);
                } finally {
                    drawCardBtn.disabled = false;
                    drawCardBtn.textContent = '🃏 Draw Card';
                }
            });

        } catch (error) {
            console.error('Error loading card controls:', error);
        }
    }

    function getCategoryBadge(category) {
        switch (category) {
            case 'ASSET_INCREASE': return 'badge-success';
            case 'ASSET_DECREASE': return 'badge-danger';
            case 'INTER_TEAM': return 'badge-warning';
            case 'NEUTRAL': return 'badge-info';
            default: return 'badge-info';
        }
    }

    // Listen for card events
    socket.on('card:drawn', (data) => {
        lastDrawnCard = {
            ...data.card,
            effects: data.effects,
        };
        render();
    });

    render();
}
