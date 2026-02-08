import express from 'express';
import Asset from '../models/Asset.js';

const router = express.Router();

/**
 * GET /api/assets/history
 * Get historical asset data for graph visualization
 * Public endpoint - no authentication required for player view
 */
router.get('/history', async (req, res) => {
    try {
        const { rounds } = req.query;
        const limit = rounds ? parseInt(rounds) : 50; // Default to last 50 rounds

        // Fetch all assets with their price history
        const assets = await Asset.find({}).select('assetType name currentValue baseValue priceHistory');

        // Transform data for graph consumption
        const graphData = {
            assets: {},
            rounds: [],
        };

        // Initialize asset data structure
        assets.forEach(asset => {
            graphData.assets[asset.assetType] = {
                name: asset.name,
                currentValue: asset.currentValue,
                baseValue: asset.baseValue,
                color: getAssetColor(asset.assetType),
                history: [],
            };
        });

        // Get unique rounds from all assets
        const roundSet = new Set();
        assets.forEach(asset => {
            asset.priceHistory.forEach(point => {
                if (point.round !== undefined) {
                    roundSet.add(point.round);
                }
            });
        });

        const sortedRounds = Array.from(roundSet).sort((a, b) => a - b).slice(-limit);
        graphData.rounds = sortedRounds;

        // Populate history for each asset by round
        assets.forEach(asset => {
            const assetHistory = graphData.assets[asset.assetType].history;

            sortedRounds.forEach(round => {
                // Find the price point for this round
                const pricePoint = asset.priceHistory.find(p => p.round === round);

                if (pricePoint) {
                    assetHistory.push({
                        round,
                        value: pricePoint.value,
                        timestamp: pricePoint.timestamp,
                        event: pricePoint.event,
                    });
                } else {
                    // If no data for this round, use previous value or base value
                    const previousValue = assetHistory.length > 0
                        ? assetHistory[assetHistory.length - 1].value
                        : asset.baseValue;

                    assetHistory.push({
                        round,
                        value: previousValue,
                        timestamp: null,
                        event: 'no_change',
                    });
                }
            });
        });

        res.json({
            success: true,
            data: {
                ...graphData,
                // Add R0 (base values) data
                baseValueRound: {
                    round: 0,
                    values: assets.reduce((acc, asset) => {
                        acc[asset.assetType] = asset.baseValue;
                        return acc;
                    }, {}),
                },
            },
        });
    } catch (error) {
        console.error('Get asset history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch asset history'
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
