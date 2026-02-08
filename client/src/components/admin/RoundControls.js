import api from '../../utils/api.js';
import socket from '../../utils/socket.js';

export default function RoundControls(container) {
  let gameState = null;
  let roundState = null;

  async function render() {
    try {
      const response = await api.getGameState();
      gameState = response.gameState;

      // Get round state
      try {
        const roundResponse = await fetch('/api/rounds/state');
        roundState = await roundResponse.json();
      } catch (error) {
        console.error('Error fetching round state:', error);
        roundState = {
          currentRound: gameState.currentRound,
          maxRounds: 10,
          canAdvance: gameState.currentRound < 10,
          canRollback: false,
        };
      }

      container.innerHTML = `
        <div class="glass-card p-lg">
          <div class="grid grid-2 gap-md">
            <div class="text-center">
              <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Current Round</p>
              <h2 style="font-size: 3rem; margin: 0; background: var(--color-accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                ${roundState.currentRound} / ${roundState.maxRounds}
              </h2>
            </div>
            
            <div class="text-center">
              <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Game Phase</p>
              <span class="badge ${getBadgeClass(gameState.currentPhase)}" style="font-size: 1rem; padding: 0.5rem 1rem;">
                ${gameState.currentPhase}
              </span>
            </div>
          </div>
          
          <div class="flex-center gap-md mt-lg" style="flex-wrap: wrap;">
            ${gameState.currentPhase === 'REGISTRATION' ? `
              <button class="btn btn-success" id="startRound2Btn">
                🚀 Start Round 2
              </button>
            ` : ''}
            
            ${gameState.currentPhase === 'ROUND2' ? `
              <button 
                class="btn btn-primary" 
                id="nextRoundBtn"
                ${!roundState.canAdvance ? 'disabled' : ''}
                title="${!roundState.canAdvance ? 'Maximum rounds reached' : 'Progress to next round'}"
              >
                ⏭️ Next Round
              </button>
              <button 
                class="btn btn-warning" 
                id="previousRoundBtn"
                ${!roundState.canRollback ? 'disabled' : ''}
                title="${!roundState.canRollback ? 'No snapshot available' : 'Undo last round'}"
              >
                ⏮️ Previous Round (Undo)
              </button>
            ` : ''}
          </div>
        </div>
      `;

      // Event listeners
      const startRound2Btn = document.getElementById('startRound2Btn');
      const nextRoundBtn = document.getElementById('nextRoundBtn');
      const previousRoundBtn = document.getElementById('previousRoundBtn');

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
            nextRoundBtn.disabled = true;
            nextRoundBtn.textContent = 'Advancing...';

            const response = await fetch('/api/rounds/next', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
              },
            });

            const result = await response.json();

            if (result.success) {
              alert(result.message);
              render();
            } else {
              alert(result.message || 'Failed to advance round');
            }
          } catch (error) {
            alert(error.message);
          } finally {
            if (nextRoundBtn) {
              nextRoundBtn.disabled = false;
              nextRoundBtn.textContent = '⏭️ Next Round';
            }
          }
        });
      }

      if (previousRoundBtn) {
        previousRoundBtn.addEventListener('click', async () => {
          const confirmed = confirm(
            'Are you sure you want to rollback to the previous round? This will:\n\n' +
            '• Restore asset values\n' +
            '• Restore leaderboard state\n' +
            '• Return drawn cards to deck\n\n' +
            'This action cannot be undone.'
          );

          if (!confirmed) return;

          try {
            previousRoundBtn.disabled = true;
            previousRoundBtn.textContent = 'Rolling back...';

            const response = await fetch('/api/rounds/previous', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
              },
            });

            const result = await response.json();

            if (result.success) {
              alert(result.message);
              render();
            } else {
              alert(result.message || 'Failed to rollback round');
            }
          } catch (error) {
            alert(error.message);
          } finally {
            if (previousRoundBtn) {
              previousRoundBtn.disabled = false;
              previousRoundBtn.textContent = '⏮️ Previous Round (Undo)';
            }
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
  socket.on('round:next', () => {
    render();
  });

  socket.on('round:previous', () => {
    render();
  });

  socket.on('round:change', () => {
    render();
  });

  socket.on('team:change', () => {
    render();
  });

  render();
}
