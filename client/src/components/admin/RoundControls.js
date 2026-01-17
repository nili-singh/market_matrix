import api from '../../utils/api.js';
import socket from '../../utils/socket.js';

export default function RoundControls(container) {
    let gameState = null;

    async function render() {
        try {
            const response = await api.getGameState();
            gameState = response.gameState;

            container.innerHTML = `
        <div class="glass-card p-lg">
          <div class="grid grid-3 gap-md">
            <div class="text-center">
              <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Current Round</p>
              <h2 style="font-size: 3rem; margin: 0; background: var(--color-accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                ${gameState.currentRound}
              </h2>
            </div>
            
            <div class="text-center">
              <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Game Phase</p>
              <span class="badge ${getBadgeClass(gameState.currentPhase)}" style="font-size: 1rem; padding: 0.5rem 1rem;">
                ${gameState.currentPhase}
              </span>
            </div>
            
            <div class="text-center">
              <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Active Team</p>
              <p style="font-size: 1.25rem; font-weight: 600; margin: 0;">
                ${gameState.activeTeam || 'None'}
              </p>
            </div>
          </div>
          
          <div class="flex-center gap-md mt-lg" style="flex-wrap: wrap;">
            ${gameState.currentPhase === 'REGISTRATION' ? `
              <button class="btn btn-success" id="startRound2Btn">
                🚀 Start Round 2
              </button>
            ` : ''}
            
            ${gameState.currentPhase === 'ROUND2' ? `
              <button class="btn btn-primary" id="nextRoundBtn">
                ⏭️ Next Round
              </button>
              <button class="btn btn-secondary" id="nextTeamBtn">
                👥 Next Team
              </button>
              <button class="btn btn-warning" id="shuffleDeckBtn">
                🔀 Shuffle Deck
              </button>
            ` : ''}
          </div>
        </div>
      `;

            // Event listeners
            const startRound2Btn = document.getElementById('startRound2Btn');
            const nextRoundBtn = document.getElementById('nextRoundBtn');
            const nextTeamBtn = document.getElementById('nextTeamBtn');
            const shuffleDeckBtn = document.getElementById('shuffleDeckBtn');

            if (startRound2Btn) {
                startRound2Btn.addEventListener('click', async () => {
                    try {
                        await api.startRound2();
                        render();
                    } catch (error) {
                        alert(error.message);
                    }
                });
            }

            if (nextRoundBtn) {
                nextRoundBtn.addEventListener('click', async () => {
                    try {
                        await api.nextRound();
                        render();
                    } catch (error) {
                        alert(error.message);
                    }
                });
            }

            if (nextTeamBtn) {
                nextTeamBtn.addEventListener('click', async () => {
                    try {
                        await api.nextTeam();
                        render();
                    } catch (error) {
                        alert(error.message);
                    }
                });
            }

            if (shuffleDeckBtn) {
                shuffleDeckBtn.addEventListener('click', async () => {
                    try {
                        await api.shuffleDeck(gameState.currentRound);
                        alert('Deck shuffled successfully!');
                    } catch (error) {
                        alert(error.message);
                    }
                });
            }

        } catch (error) {
            console.error('Error loading game state:', error);
        }
    }

    function getBadgeClass(phase) {
        switch (phase) {
            case 'REGISTRATION': return 'badge-info';
            case 'ROUND1': return 'badge-warning';
            case 'ROUND2': return 'badge-success';
            case 'COMPLETED': return 'badge-danger';
            default: return 'badge-info';
        }
    }

    // Listen for round changes
    socket.on('round:change', () => {
        render();
    });

    socket.on('team:change', () => {
        render();
    });

    render();
}
