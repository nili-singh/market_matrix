import express from 'express';
import roundService from '../services/roundService.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/rounds/next
 * Progress to the next round (admin only)
 */
router.post('/next', authMiddleware, async (req, res) => {
    try {
        const result = await roundService.nextRound();

        // Emit socket events for real-time updates
        if (req.app.get('io')) {
            const io = req.app.get('io');

            // Notify about round progression
            io.emit('round:next', {
                currentRound: result.currentRound,
                isEvenRound: result.isEvenRound,
                message: result.message,
            });

            // Trigger leaderboard update
            io.emit('leaderboard:updated', {
                source: 'round_progression',
            });

            // Trigger graph update
            io.emit('graph:update', {
                round: result.currentRound,
                source: 'round_progression',
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Error advancing round:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/rounds/previous
 * Rollback to the previous round (admin only)
 */
router.post('/previous', authMiddleware, async (req, res) => {
    try {
        const result = await roundService.previousRound();

        // Emit socket events for real-time updates
        if (req.app.get('io')) {
            const io = req.app.get('io');

            // Notify about round rollback
            io.emit('round:previous', {
                currentRound: result.currentRound,
                restoredCards: result.restoredCards,
                message: result.message,
            });

            // Trigger leaderboard update (restored state)
            io.emit('leaderboard:updated', {
                source: 'round_rollback',
            });

            // Trigger graph update (restored state)
            io.emit('graph:update', {
                round: result.currentRound,
                source: 'round_rollback',
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Error rolling back round:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/rounds/state
 * Get current round state
 */
router.get('/state', async (req, res) => {
    try {
        const state = await roundService.getRoundState();
        res.json(state);
    } catch (error) {
        console.error('Error getting round state:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
