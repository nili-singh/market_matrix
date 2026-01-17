import api from '../../utils/api.js';
import socket from '../../utils/socket.js';
import AssetGraph from '../../components/player/AssetGraph.js';
import AssetCards from '../../components/player/AssetCards.js';

export default async function playerView(container) {
    container.innerHTML = `
    <div class="player-view">
      <!-- Header -->
      <header class="glass-card" style="padding: 1.5rem; margin-bottom: 2rem;">
        <div class="container text-center">
          <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem; background: var(--color-accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            Market Matrix
          </h1>
          <p class="text-muted" style="margin: 0;">Live Asset Prices</p>
        </div>
      </header>
      
      <div class="container">
        <!-- Asset Cards -->
        <div id="assetCards" class="mb-lg"></div>
        
        <!-- Live Graph -->
        <div class="glass-card p-lg">
          <h3 class="mb-md">📈 Real-Time Price Movement</h3>
          <div id="assetGraph"></div>
        </div>
        
        <!-- Back Button -->
        <div class="text-center mt-lg">
          <button class="btn btn-secondary" onclick="window.navigateTo('/')">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  `;

    // Load components
    const assetCardsContainer = document.getElementById('assetCards');
    const assetGraphContainer = document.getElementById('assetGraph');

    AssetCards(assetCardsContainer);
    AssetGraph(assetGraphContainer);
}
