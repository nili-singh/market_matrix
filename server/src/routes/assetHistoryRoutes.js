import express from 'express';
import Asset from '../models/Asset.js';

const router = express.Router();

/**
 * GET /api/assets/history
 * Get historical asset data for graph visualization
 * Public endpoint - no authentication required for player view
 */
/**
 * GET /api/assets/history
 * Get historical asset data for graph visualization from immutable round snapshots
 * Public endpoint - no authentication required for player view
 */
router.get('/history', async (req, res) => {
    try {
        const GameState = (await import('../models/GameState.js')).default;

        // Fetch all assets with their price history
        const assets = await Asset.find({});

        if (!assets || assets.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No assets found'
            });
        }

        // Fetch game state to get current round
        const gameState = await GameState.findById('GAME_STATE');
        const currentRound = gameState ? gameState.currentRound : 0;

        // Build graph data structure
        const graphData = {
            assets: {},
            rounds: [],
            currentRound: currentRound,
            baseValueRound: null // For R0 base values
        };

        // Collect all unique rounds from all assets
        const roundsSet = new Set();

        // Process each asset
        assets.forEach(asset => {
            const assetType = asset.assetType;

            // Initialize asset in graph data
            graphData.assets[assetType] = {
                name: asset.name,
                currentValue: asset.currentValue,
                baseValue: asset.baseValue,
                color: getAssetColor(assetType),
                history: []
            };

            // Add price history
            if (asset.priceHistory && asset.priceHistory.length > 0) {
                asset.priceHistory.forEach(point => {
                    graphData.assets[assetType].history.push({
                        round: point.round,
                        value: point.value,
                        timestamp: point.timestamp,
                        event: point.event
                    });

                    // Collect unique rounds
                    roundsSet.add(point.round);
                });
            }
        });

        // Sort rounds
        graphData.rounds = Array.from(roundsSet).sort((a, b) => a - b);

        // Create base value round (R0) data
        graphData.baseValueRound = {
            round: 0,
            timestamp: new Date(),
            values: {}
        };

        assets.forEach(asset => {
            graphData.baseValueRound.values[asset.assetType] = asset.baseValue;
        });

        res.json({
            success: true,
            data: graphData,
        });
    } catch (error) {
        console.error('Get asset history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch asset history',
            details: error.message
        });
    }
});

/**
 * Helper function to get consistent colors for each asset type
 */
function getAssetColor(assetType) {
    const colors = {
        'GOLD': '#FFD700',           // Gold
        'STOCK': '#10B981',          // Green
        'CRYPTO': '#6366F1',         // Indigo/Purple
        'EURO_BOND': '#F59E0B',      // Amber/Orange
        'TREASURY_BILL': '#EC4899',  // Pink
    };
    return colors[assetType] || '#94A3B8'; // Default gray
}

export default router;
