import express from 'express';
import superadminAuthMiddleware from '../middleware/superadminAuth.js';
import resetService from '../services/resetService.js';

const router = express.Router();

// Apply super admin auth middleware to all routes
router.use(superadminAuthMiddleware);

/**
 * GET /api/superadmin/status
 * Get current game state summary
 */
router.get('/status', async (req, res) => {
    try {
        const summary = await resetService.getGameStateSummary();
        res.json({ success: true, summary });
    } catch (error) {
        console.error('Get game status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/superadmin/reset
 * Perform global game reset
 */
router.post('/reset', async (req, res) => {
    try {
        console.log(`🔄 Super admin ${req.superAdmin.username} initiated global reset`);

        const result = await resetService.performGlobalReset();

        // Emit socket event to all connected clients
        const io = req.app.get('io');
        if (io) {
            io.emit('game:reset', {
                message: 'Game has been reset by admin',
                timestamp: new Date(),
            });
            console.log('📡 Broadcasted game:reset event to all clients');
        }

        res.json(result);
    } catch (error) {
        console.error('Global reset error:', error);
        res.status(500).json({ error: 'Failed to reset game', details: error.message });
    }
});

export default router;
