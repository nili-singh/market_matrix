import api from '../../utils/api.js';
import socket from '../../utils/socket.js';

export default function AssetCards(container) {
    let assets = [];
    let previousValues = {};

    async function render() {
        try {
            const response = await api.getAssets();
            assets = response.assets;

            container.innerHTML = `
        <div class="grid grid-3 gap-md">
          ${assets.map(asset => {
                const prevValue = previousValues[asset.assetType] || asset.baseValue;
                const change = ((asset.currentValue - prevValue) / prevValue) * 100;
                const isPositive = change >= 0;

                // Store current value for next comparison
                previousValues[asset.assetType] = asset.currentValue;

                return `
              <div class="glass-card p-md slide-in">
                <div class="flex-between mb-sm">
                  <h4 style="margin: 0; font-size: 1.125rem;">${getAssetIcon(asset.assetType)} ${asset.name}</h4>
                </div>
                
                <div class="flex-between" style="align-items: flex-end;">
                  <div>
                    <p class="text-muted" style="font-size: 0.75rem; margin: 0;">Current Value</p>
                    <h3 style="margin: 0; font-size: 2rem; font-weight: 700;">
                      ₹${asset.currentValue.toFixed(2)}
                    </h3>
                  </div>
                  
                  <div class="text-right">
                    <span class="badge ${isPositive ? 'badge-success' : 'badge-danger'}">
                      ${isPositive ? '↑' : '↓'} ${Math.abs(change).toFixed(2)}%
                    </span>
                    <p class="text-muted" style="font-size: 0.75rem; margin: 0.25rem 0 0 0;">
                      Base: ₹${asset.baseValue}
                    </p>
                  </div>
                </div>
              </div>
            `;
            }).join('')}
        </div>
      `;

        } catch (error) {
            console.error('Error loading assets:', error);
        }
    }

    function getAssetIcon(assetType) {
        const icons = {
            CRYPTO: '₿',
            STOCK: '📊',
            GOLD: '🪙',
            EURO_BOND: '💶',
            TREASURY_BILL: '📜',
        };
        return icons[assetType] || '💰';
    }

    // Listen for asset updates
    socket.on('asset:update', () => {
        render();
    });

    render();

    // Refresh every 5 seconds as fallback
    setInterval(render, 5000);
}
