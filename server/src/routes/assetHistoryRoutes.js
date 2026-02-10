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

        // Fetch game state with immutable round snapshots
        const gameState = await GameState.findById('GAME_STATE');

        if (!gameState) {
            return res.status(404).json({
                success: false,
                error: 'Game state not found'
            });
        }

        // Fetch assets for base values and metadata only
        const assets = await Asset.find({});

        if (!assets || assets.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No assets found'
            });
        }

        // Build graph data structure
        const graphData = {
            assets: {},
            rounds: [],
            currentRound: gameState.currentRound,
            baseValueRound: null // For R0 base values
        };

        // Initialize asset metadata (names, colors, base values)
        assets.forEach(asset => {
            graphData.assets[asset.assetType] = {
                name: asset.name,
                currentValue: asset.currentValue,
                baseValue: asset.baseValue,
                color: getAssetColor(asset.assetType),
                history: [] // Will be populated from IMMUTABLE snapshots
            };
        });

        // CRITICAL: Read historical data from IMMUTABLE snapshots ONLY
        // Filter snapshots to only include rounds <= currentRound (no future rounds)
        const validSnapshots = (gameState.roundSnapshots || [])
            .filter(snap => snap.round <= gameState.currentRound)
            .sort((a, b) => a.round - b.round);

        // Populate history from immutable snapshots
        validSnapshots.forEach(snapshot => {
            // Add round to rounds array
            if (!graphData.rounds.includes(snapshot.round)) {
                graphData.rounds.push(snapshot.round);
            }

            // Populate asset history from snapshot
            if (snapshot.assetPrices) {
                Object.entries(snapshot.assetPrices).forEach(([assetType, price]) => {
                    if (graphData.assets[assetType]) {
                        graphData.assets[assetType].history.push({
                            round: snapshot.round,
                            value: price,
                            timestamp: snapshot.timestamp,
                            event: 'snapshot' // Data from immutable snapshot
                        });
                    }
                });
            }
        });

        // Ensure rounds are sorted
        graphData.rounds.sort((a, b) => a - b);

        // Create base value round (R0) data from base values (constant)
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
