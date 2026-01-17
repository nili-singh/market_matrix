import express from 'express';
import assetService from '../services/assetService.js';
import roundService from '../services/roundService.js';

const router = express.Router();

/**
 * GET /api/assets
 * Get all assets with current values and price history
 */
router.get('/assets', async (req, res) => {
    try {
        const assets = await assetService.getAllAssets();

        const formattedAssets = assets.map(asset => ({
            assetType: asset.assetType,
            name: asset.name,
            currentValue: asset.currentValue,
            baseValue: asset.baseValue,
            priceHistory: asset.priceHistory.slice(-50), // Last 50 points
            lastUpdated: asset.lastUpdated,
        }));

        res.json({ success: true, assets: formattedAssets });
    } catch (error) {
        console.error('Get assets error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/game-state
 * Get current game state (round, phase)
 */
router.get('/game-state', async (req, res) => {
    try {
        const gameState = await roundService.getCurrentState();

        if (!gameState) {
            return res.json({
                success: true,
                gameState: {
                    currentRound: 0,
                    currentPhase: 'REGISTRATION',
                },
            });
        }

        res.json({
            success: true,
            gameState: {
                currentRound: gameState.currentRound,
                currentPhase: gameState.currentPhase,
                activeTeam: gameState.activeTeamId?.teamName || null,
            },
        });
    } catch (error) {
        console.error('Get game state error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/leaderboard/public
 * Get sanitized leaderboard (rankings only, no detailed info)
 */
router.get('/leaderboard/public', async (req, res) => {
    try {
        const tradingService = (await import('../services/tradingService.js')).default;
        const leaderboard = await tradingService.getLeaderboard();

        // Sanitize - only show team names and rankings
        const publicLeaderboard = leaderboard.map((team, index) => ({
            rank: index + 1,
            teamName: team.teamName,
            portfolioValue: team.portfolioValue,
        }));

        res.json({ success: true, leaderboard: publicLeaderboard });
    } catch (error) {
        console.error('Get public leaderboard error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
