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
        const teams = await Team.find();
        res.json({ success: true, teams });
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/admin/teams
 * Create a new team
 */
router.post('/teams', async (req, res) => {
    try {
        const { teamName, members, registrationType, registrationFee, round1Qualified } = req.body;

        const team = new Team({
            teamName,
            members,
            registrationType,
            registrationFee,
            round1Qualified: round1Qualified || false,
        });

        await team.save();
        res.json({ success: true, team });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ error: 'Server error' });
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
        const gameState = await roundService.nextRound();

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
        const cards = await cardService.shuffleDeck(currentRound || 0);

        res.json({ success: true, message: 'Deck shuffled', cardCount: cards.length });
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
