import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Team from '../models/Team.js';
import tradingService from '../services/tradingService.js';
import cardService from '../services/cardService.js';
import roundService from '../services/roundService.js';
import assetService from '../services/assetService.js';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authMiddleware);

/**
 * GET /api/admin/leaderboard
 * Get full leaderboard with team details
 */
router.get('/leaderboard', async (req, res) => {
    try {
        const leaderboard = await tradingService.getLeaderboard();
        res.json({ success: true, leaderboard });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/admin/teams
 * Get all teams
 */
router.get('/teams', async (req, res) => {
    try {
        // Exclude password field to prevent hashed password from being sent to frontend
        const teams = await Team.find().select('-password');
        res.json({ success: true, teams });
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/admin/teams
 * Create a new team with auto-generated teamId and password
 */
router.post('/teams', async (req, res) => {
    try {
        const { teamName, members, registrationType, registrationFee, round1Qualified } = req.body;

        // Generate random password (8 characters: letters + numbers)
        function generatePassword() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let password = '';
            for (let i = 0; i < 8; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
        }

        const plainPassword = generatePassword();

        const team = new Team({
            teamName,
            password: plainPassword, // Will be hashed by pre-save hook
            members,
            registrationType,
            registrationFee,
            round1Qualified: round1Qualified || false,
        });

        await team.save();

        // Return team data WITH credentials (only time we return password)
        res.json({
            success: true,
            team,
            credentials: {
                teamId: team.teamId,
                password: plainPassword, // Plain password for admin to share
            },
        });
    } catch (error) {
        console.error('Create team error:', error);
        console.error('Error name:', error.name);
        console.error('Error code:', error.code);
        console.error('Error details:', error.errors);

        // Handle duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0];
            if (field === 'teamName') {
                return res.status(400).json({
                    error: 'Team name already exists',
                    details: 'A team with this name has already been registered. Please choose a different name.'
                });
            } else if (field === 'teamId') {
                return res.status(500).json({
                    error: 'Team ID generation error',
                    details: 'An error occurred while generating the team ID. Please try again.'
                });
            }
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message).join(', ');
            return res.status(400).json({
                error: 'Validation error',
                details: messages
            });
        }

        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

/**
 * PUT /api/admin/teams/:id
 * Update team data
 */
router.put('/teams/:id', async (req, res) => {
    try {
        const team = await Team.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json({ success: true, team });
    } catch (error) {
        console.error('Update team error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * DELETE /api/admin/teams/:id
 * Delete a team
 */
router.delete('/teams/:id', async (req, res) => {
    try {
        const team = await Team.findByIdAndDelete(req.params.id);

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('team:deleted', { teamId: req.params.id });
        }

        res.json({ success: true, message: 'Team deleted successfully' });
    } catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/admin/round/start
 * Start Round 2
 */
router.post('/round/start', async (req, res) => {
    try {
        const gameState = await roundService.startRound2();
        res.json({ success: true, gameState });
    } catch (error) {
        console.error('Start round error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/admin/round/next
 * Advance to next round
 */
router.post('/round/next', async (req, res) => {
    try {
        const result = await roundService.nextRound();
        const gameState = result.gameState;

        // Emit socket event
        req.app.get('io').emit('round:change', {
            currentRound: gameState.currentRound,
            shuffled: gameState.currentRound % 2 === 0,
        });

        res.json({ success: true, gameState });
    } catch (error) {
        console.error('Next round error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/admin/team/next
 * Advance to next team's turn
 */
router.post('/team/next', async (req, res) => {
    try {
        const gameState = await roundService.nextTeam();

        req.app.get('io').emit('team:change', {
            activeTeamId: gameState.activeTeamId,
        });

        res.json({ success: true, gameState });
    } catch (error) {
        console.error('Next team error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/admin/card/shuffle
 * Manually shuffle deck
 */
router.post('/card/shuffle', async (req, res) => {
    try {
        const { currentRound } = req.body;
        const result = await cardService.shuffleDeck(currentRound || 0);

        res.json({
            success: true,
            message: 'Deck shuffled',
            cardCount: result.shuffled.length,
            deckState: result.deckState
        });
    } catch (error) {
        console.error('Shuffle deck error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/admin/card/draw/:teamId
 * Draw card for team
 */
router.post('/card/draw/:teamId', async (req, res) => {
    try {
        const gameState = await roundService.getCurrentState();
        const result = await cardService.drawCard(req.params.teamId, gameState.currentRound);

        if (result.skipped) {
            return res.json({ success: true, skipped: true, reason: result.reason });
        }

        // Get next team ID for inter-team effects
        const currentIndex = gameState.teamOrder.findIndex(id => id.toString() === req.params.teamId);
        const nextIndex = (currentIndex + 1) % gameState.teamOrder.length;
        const nextTeamId = gameState.teamOrder[nextIndex];

        // Apply card effect
        const effects = await cardService.applyCardEffect(
            result.card,
            req.params.teamId,
            gameState.currentRound,
            nextTeamId
        );

        // Emit socket event
        req.app.get('io').emit('card:drawn', {
            teamId: req.params.teamId,
            card: result.card,
            effects,
        });

        // If asset changed, emit update
        if (effects.assetChanges.length > 0) {
            const assets = await assetService.getAllAssets();
            req.app.get('io').emit('asset:update', { assets });
        }

        res.json({ success: true, card: result.card, effects });
    } catch (error) {
        console.error('Draw card error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/admin/trade
 * Execute trade on behalf of team
 */
router.post('/trade', async (req, res) => {
    try {
        const { teamId, assetType, action, quantity } = req.body;
        const gameState = await roundService.getCurrentState();

        let result;

        if (action === 'BUY') {
            result = await tradingService.executeBuy(teamId, assetType, quantity, gameState.currentRound);
        } else if (action === 'SELL') {
            result = await tradingService.executeSell(teamId, assetType, quantity, gameState.currentRound);
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

        // Emit socket events
        if (result.priceChanged) {
            const assets = await assetService.getAllAssets();
            req.app.get('io').emit('asset:update', { assets });
        }

        req.app.get('io').emit('trade:executed', {
            teamId,
            assetType,
            action,
            quantity,
        });

        const leaderboard = await tradingService.getLeaderboard();
        req.app.get('io').emit('leaderboard:update', { leaderboard });

        res.json({ success: true, result });
    } catch (error) {
        console.error('Trade error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/admin/trade/batch
 * Execute multiple trades for a team at once
 */
router.post('/trade/batch', async (req, res) => {
    try {
        const { teamId, action, trades } = req.body;

        if (!teamId || !action || !trades || !Array.isArray(trades) || trades.length === 0) {
            return res.status(400).json({ error: 'Invalid batch trade data' });
        }

        const gameState = await roundService.getCurrentState();
        const results = [];
        let anyPriceChanged = false;

        // Execute each trade sequentially
        for (const trade of trades) {
            try {
                const { assetType, quantity } = trade;

                if (!assetType || !quantity || quantity <= 0) {
                    results.push({
                        assetType,
                        success: false,
                        message: 'Invalid quantity'
                    });
                    continue;
                }

                let result;
                if (action === 'BUY') {
                    result = await tradingService.executeBuy(teamId, assetType, quantity, gameState.currentRound);
                } else if (action === 'SELL') {
                    result = await tradingService.executeSell(teamId, assetType, quantity, gameState.currentRound);
                } else {
                    results.push({
                        assetType,
                        success: false,
                        message: 'Invalid action'
                    });
                    continue;
                }

                if (result.priceChanged) {
                    anyPriceChanged = true;
                }

                results.push({
                    assetType,
                    success: true,
                    message: `${action} successful`,
                    newBalance: result.team.virtualBalance
                });

            } catch (error) {
                results.push({
                    assetType: trade.assetType,
                    success: false,
                    message: error.message
                });
            }
        }

        // Emit socket events after all trades
        if (anyPriceChanged) {
            const assets = await assetService.getAllAssets();
            req.app.get('io').emit('asset:update', { assets });
        }

        req.app.get('io').emit('trade:executed', {
            teamId,
            action,
            batch: true,
        });

        const leaderboard = await tradingService.getLeaderboard();
        req.app.get('io').emit('leaderboard:update', { leaderboard });

        res.json({
            success: true,
            results,
            successCount: results.filter(r => r.success).length,
            failureCount: results.filter(r => !r.success).length
        });
    } catch (error) {
        console.error('Batch trade error:', error);
        res.status(500).json({ error: error.message });
    }
});


/**
 * POST /api/admin/trade/team-to-team
 * Execute team-to-team trade
 */
router.post('/trade/team-to-team', async (req, res) => {
    try {
        const { fromTeamId, toTeamId, assetType, quantity, agreedPrice } = req.body;
        const gameState = await roundService.getCurrentState();

        const result = await tradingService.executeTeamTrade(
            fromTeamId,
            toTeamId,
            assetType,
            quantity,
            agreedPrice,
            gameState.currentRound
        );

        // Emit socket events
        req.app.get('io').emit('trade:executed', {
            fromTeamId,
            toTeamId,
            assetType,
            quantity,
            agreedPrice,
        });

        const leaderboard = await tradingService.getLeaderboard();
        req.app.get('io').emit('leaderboard:update', { leaderboard });

        res.json({ success: true, result });
    } catch (error) {
        console.error('Team trade error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/admin/assets/:assetType
 * Manually adjust asset value
 */
router.put('/assets/:assetType', async (req, res) => {
    try {
        const { newValue } = req.body;
        const gameState = await roundService.getCurrentState();

        const asset = await assetService.manualAdjustment(
            req.params.assetType,
            newValue,
            gameState.currentRound
        );

        // Emit socket event
        const assets = await assetService.getAllAssets();
        req.app.get('io').emit('asset:update', { assets });

        res.json({ success: true, asset });
    } catch (error) {
        console.error('Manual adjustment error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
