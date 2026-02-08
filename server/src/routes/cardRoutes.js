import express from 'express';
import cardService from '../services/cardService.js';
import GameState from '../models/GameState.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/cards/shuffle
 * Manually trigger deck shuffle
 */
router.post('/shuffle', authMiddleware, async (req, res) => {
    try {
        const gameState = await GameState.findById('GAME_STATE');
        const currentRound = gameState?.currentRound || 0;

        // Set shuffling status
        await cardService.setShuffleStatus(true);

        // Perform shuffle
        const { shuffled, deckState } = await cardService.shuffleDeck(currentRound);

        // Reset shuffling status after animation duration
        setTimeout(async () => {
            await cardService.setShuffleStatus(false);
        }, 2000);

        res.json({
            success: true,
            message: 'Deck shuffled successfully',
            remainingCards: shuffled.length,
            deckState,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/cards/deck-state
 * Get current deck state for visualization
 */
router.get('/deck-state', authMiddleware, async (req, res) => {
    try {
        const deckState = await cardService.getDeckState();
        res.json({
            success: true,
            deckState,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/cards/preview-five
 * Preview 5 random cards from deck WITHOUT drawing
 */
router.post('/preview-five', authMiddleware, async (req, res) => {
    try {
        const cards = await cardService.previewFiveCards();
        res.json({
            success: true,
            cards,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/cards/draw/:teamId
 * Draw a card for a specific team
 * If cardId is provided in body, draw that specific card
 * Otherwise, draw random card from deck
 */
router.post('/draw/:teamId', authMiddleware, async (req, res) => {
    try {
        const { teamId } = req.params;
        const { cardId } = req.body || {};  // Optional specific card ID
        const gameState = await GameState.findById('GAME_STATE');
        const currentRound = gameState?.currentRound || 0;

        // Draw card (specific or random)
        let result;
        if (cardId) {
            console.log(`Drawing specific card ${cardId} for team ${teamId}`);
            result = await cardService.drawSpecificCard(teamId, cardId);
        } else {
            console.log(`Drawing random card for team ${teamId}`);
            result = await cardService.drawCard(teamId, currentRound);
        }

        if (result.skipped) {
            return res.json({
                success: true,
                skipped: true,
                reason: result.reason,
            });
        }

        // Apply card effect
        const nextTeamIndex = (gameState.currentTeamIndex + 1) % gameState.teamOrder.length;
        const nextTeamId = gameState.teamOrder[nextTeamIndex];

        const effects = await cardService.applyCardEffect(
            result.card,
            teamId,
            currentRound,
            nextTeamId
        );

        // Calculate updated leaderboard
        const Team = (await import('../models/Team.js')).default;
        const teams = await Team.find({});

        const leaderboard = teams.map(team => {
            const totalValue =
                (team.assets.CRYPTO || 0) * (team.assetPrices?.CRYPTO || 0) +
                (team.assets.STOCK || 0) * (team.assetPrices?.STOCK || 0) +
                (team.assets.GOLD || 0) * (team.assetPrices?.GOLD || 0) +
                (team.assets.EURO_BOND || 0) * (team.assetPrices?.EURO_BOND || 0) +
                (team.assets.TREASURY_BILL || 0) * (team.assetPrices?.TREASURY_BILL || 0) +
                (team.balance || 0);

            return {
                teamId: team._id,
                teamName: team.teamName,
                totalValue,
            };
        }).sort((a, b) => b.totalValue - a.totalValue);

        // Emit synchronized socket events
        if (req.app.get('io')) {
            req.app.get('io').emit('card:drawn', {
                card: result.card,
                effects,
                teamId,
            });

            req.app.get('io').emit('leaderboard:updated', {
                leaderboard,
                source: 'card_draw',
            });

            req.app.get('io').emit('graph:update', {
                round: currentRound,
                source: 'card_draw',
            });
        }

        res.json({
            success: true,
            card: result.card,
            effects,
            leaderboard,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/cards/drawn-history
 * Get history of drawn cards
 */
router.get('/drawn-history', authMiddleware, async (req, res) => {
    try {
        const gameState = await GameState.findById('GAME_STATE')
            .populate('drawnCards');

        res.json({
            success: true,
            drawnCards: gameState?.drawnCards || [],
            count: gameState?.drawnCards?.length || 0,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
