import api from '../../utils/api.js';
import socket from '../../utils/socket.js';
import CardDeck from './CardDeck.js';

export default function CardControls(container) {
  let teams = [];
  let lastDrawnCard = null;
  let cardDeckInstance = null; // Store CardDeck instance
  let selectedTeamId = null; // Track selected team

  // Function to update ONLY the Last Drawn Card UI without recreating CardDeck
  function updateLastDrawnCardUI() {
    const lastDrawnCardContainer = document.getElementById('lastDrawnCardPanel');
    if (!lastDrawnCardContainer) return;

    if (lastDrawnCard) {
      lastDrawnCardContainer.innerHTML = `
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
      `;
    } else {
      lastDrawnCardContainer.innerHTML = '';
    }
  }

  async function render() {
    try {
      const teamsResponse = await api.getTeams();
      teams = teamsResponse.teams.filter(t => t.round1Qualified);

      container.innerHTML = `
        <div class="glass-card p-lg">
          <h3 class="mb-md">Card System</h3>
          
          <!-- Card Deck Visualization -->
          <div id="cardDeckContainer" class="mb-lg"></div>
          
          <div class="grid grid-2 gap-md mb-lg">
            <div>
              <label class="form-label">Select Team</label>
              <select class="input" id="teamSelect">
                <option value="">-- Select Team --</option>
                ${teams.map(team => `
                  <option value="${team._id}" ${team._id === selectedTeamId ? 'selected' : ''}>${team.teamName}</option>
                `).join('')}
              </select>
            </div>
          </div>
          
          <!-- Last Drawn Card Panel - Updated separately -->
          <div id="lastDrawnCardPanel"></div>
        </div>
      `;

      // Event listeners
      const teamSelect = document.getElementById('teamSelect');

      teamSelect.addEventListener('change', () => {
        const newTeamId = teamSelect.value;
        selectedTeamId = newTeamId;

        // Notify CardDeck of team change
        if (cardDeckInstance && cardDeckInstance.updateTeam) {
          cardDeckInstance.updateTeam(newTeamId);
        }
      });

      // Initialize CardDeck component with team selection AND callback
      const cardDeckContainer = document.getElementById('cardDeckContainer');
      if (cardDeckContainer) {
        cardDeckInstance = CardDeck(cardDeckContainer, {
          selectedTeamId,
          onCardDrawn: (response) => {
            // CRITICAL FIX: Update Last Drawn Card WITHOUT recreating CardDeck
            // This preserves the drawnFiveCards state in CardDeck
            if (response.skipped) {
              lastDrawnCard = null;
            } else {
              lastDrawnCard = {
                ...response.card,
                effects: response.effects,
              };
            }
            // Only update the Last Drawn Card UI, NOT the entire component
            updateLastDrawnCardUI();
          }
        });
      }

      // Initial render of Last Drawn Card panel
      updateLastDrawnCardUI();

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
    // Only update Last Drawn Card UI, NOT the entire component
    updateLastDrawnCardUI();
  });

  render();
}
