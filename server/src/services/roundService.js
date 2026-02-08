import GameState from '../models/GameState.js';
import Team from '../models/Team.js';
import Card from '../models/Card.js';
import { GAME_CONFIG } from '../config/constants.js';
import cardService from './cardService.js';

class RoundService {
    /**
     * Initialize game state
     */
    async initializeGame() {
        let gameState = await GameState.findById('GAME_STATE');

        if (!gameState) {
            gameState = new GameState({
                _id: 'GAME_STATE',
                currentRound: 0,
                currentPhase: 'REGISTRATION',
            });
            await gameState.save();
        }

        return gameState;
    }

    /**
     * Start Round 2 with qualified teams
     */
    async startRound2() {
        const qualifiedTeams = await Team.find({ round1Qualified: true }).limit(10);

        if (qualifiedTeams.length === 0) {
            throw new Error('No qualified teams found');
        }

        // Initialize card deck first
        await cardService.initializeCards();
        await cardService.shuffleDeck(1);

        // Update game state using findOneAndUpdate to avoid version conflicts
        const gameState = await GameState.findOneAndUpdate(
            { _id: 'GAME_STATE' },
            {
                $set: {
                    teamOrder: qualifiedTeams.map(team => team._id),
                    currentTeamIndex: 0,
                    activeTeamId: qualifiedTeams[0]._id,
                    currentRound: 1,
                    currentPhase: 'ROUND2',
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        return gameState;
    }

    /**
     * Create a snapshot of the current game state for rollback
     */
    async createSnapshot(gameStateId = 'GAME_STATE') {
        try {
            const gameState = await GameState.findById(gameStateId);
            if (!gameState) {
                throw new Error('Game state not found');
            }

            // Get all teams with their current asset values
            const teams = await Team.find({});
            const assetValues = {};

            teams.forEach(team => {
                assetValues[team._id.toString()] = {
                    CRYPTO: team.assets.CRYPTO || 0,
                    STOCK: team.assets.STOCK || 0,
                    GOLD: team.assets.GOLD || 0,
                    EURO_BOND: team.assets.EURO_BOND || 0,
                    TREASURY_BILL: team.assets.TREASURY_BILL || 0,
                };
            });

            // Calculate current leaderboard
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

            // Create snapshot
            const snapshot = {
                round: gameState.currentRound,
                timestamp: new Date(),
                assetValues,
                leaderboard,
                drawnCardIds: [...(gameState.drawnCards || [])],
            };

            // Keep only the last snapshot (one-step rollback)
            gameState.roundSnapshots = [snapshot];
            await gameState.save();

            return snapshot;
        } catch (error) {
            console.error('Error creating snapshot:', error);
            throw error;
        }
    }

    /**
     * Advance to next round with snapshot support
     */
    async nextRound() {
        const gameState = await GameState.findById('GAME_STATE');
        if (!gameState) throw new Error('Game state not initialized');

        // Validate round limit
        if (gameState.currentRound >= GAME_CONFIG.MAX_ROUNDS) {
            throw new Error(`Maximum rounds (${GAME_CONFIG.MAX_ROUNDS}) reached`);
        }

        // Create snapshot before progressing
        await this.createSnapshot('GAME_STATE');

        // Increment round
        gameState.currentRound += 1;

        // Shuffle deck before even rounds
        if (gameState.currentRound % 2 === 0) {
            await cardService.shuffleDeck(gameState.currentRound);
            gameState.lastShuffleRound = gameState.currentRound;
        }

        // Reset team index to start
        gameState.currentTeamIndex = 0;
        if (gameState.teamOrder.length > 0) {
            gameState.activeTeamId = gameState.teamOrder[0];
        }

        // Clear next team effects
        gameState.nextTeamEffects = {
            tradeFrozen: false,
            marketShock: false,
            reverseImpact: false,
        };

        await gameState.save();

        return {
            success: true,
            gameState,
            currentRound: gameState.currentRound,
            isEvenRound: gameState.currentRound % 2 === 0,
            message: `Advanced to round ${gameState.currentRound}${gameState.currentRound % 2 === 0 ? ' (deck shuffled)' : ''}`,
        };
    }

    /**
     * Rollback to the previous round (one-step only)
     */
    async previousRound() {
        const gameState = await GameState.findById('GAME_STATE');
        if (!gameState) throw new Error('Game state not initialized');

        // Validate we can rollback
        if (gameState.currentRound <= GAME_CONFIG.MIN_ROUNDS) {
            throw new Error('Cannot rollback from round 1');
        }

        // Check if snapshot exists
        if (!gameState.roundSnapshots || gameState.roundSnapshots.length === 0) {
            throw new Error('No snapshot available for rollback');
        }

        const snapshot = gameState.roundSnapshots[0];

        // Restore asset values for all teams
        const teams = await Team.find({});

        for (const team of teams) {
            const savedAssets = snapshot.assetValues[team._id.toString()];
            if (savedAssets) {
                team.assets = {
                    CRYPTO: savedAssets.CRYPTO,
                    STOCK: savedAssets.STOCK,
                    GOLD: savedAssets.GOLD,
                    EURO_BOND: savedAssets.EURO_BOND,
                    TREASURY_BILL: savedAssets.TREASURY_BILL,
                };
                await team.save();
            }
        }

        // Restore drawn cards (return cards drawn in current round back to deck)
        const currentDrawnCards = gameState.drawnCards || [];
        const snapshotDrawnCards = snapshot.drawnCardIds || [];

        // Find cards that were drawn in the current round
        const cardsToRestore = currentDrawnCards.filter(
            cardId => !snapshotDrawnCards.some(snapId => snapId.toString() === cardId.toString())
        );

        // Mark those cards as not drawn
        if (cardsToRestore.length > 0) {
            await Card.updateMany(
                { _id: { $in: cardsToRestore } },
                { $set: { isDrawn: false } }
            );
        }

        // Decrement round
        gameState.currentRound = snapshot.round;
        gameState.drawnCards = snapshotDrawnCards;

        // Clear the snapshot after using it
        gameState.roundSnapshots = [];

        await gameState.save();

        return {
            success: true,
            gameState,
            currentRound: gameState.currentRound,
            restoredCards: cardsToRestore.length,
            message: `Rolled back to round ${gameState.currentRound}`,
        };
    }

    /**
     * Get current round state
     */
    async getRoundState() {
        const gameState = await GameState.findById('GAME_STATE');
        if (!gameState) throw new Error('Game state not initialized');

        return {
            currentRound: gameState.currentRound,
            maxRounds: GAME_CONFIG.MAX_ROUNDS,
            canAdvance: gameState.currentRound < GAME_CONFIG.MAX_ROUNDS,
            canRollback: gameState.currentRound > GAME_CONFIG.MIN_ROUNDS &&
                gameState.roundSnapshots &&
                gameState.roundSnapshots.length > 0,
            isEvenRound: gameState.currentRound % 2 === 0,
        };
    }

    /**
     * Advance to next team's turn
     */
    async nextTeam() {
        const gameState = await GameState.findById('GAME_STATE');
        if (!gameState) throw new Error('Game state not initialized');

        if (gameState.teamOrder.length === 0) {
            throw new Error('No teams in rotation');
        }

        // Move to next team
        gameState.currentTeamIndex = (gameState.currentTeamIndex + 1) % gameState.teamOrder.length;
        gameState.activeTeamId = gameState.teamOrder[gameState.currentTeamIndex];

        // Apply next team effects if any
        const currentTeam = await Team.findById(gameState.activeTeamId);

        if (gameState.nextTeamEffects.tradeFrozen) {
            currentTeam.tradeFrozen = true;
            gameState.nextTeamEffects.tradeFrozen = false;
        }

        if (gameState.nextTeamEffects.marketShock) {
            await cardService.applyMarketShock(gameState.activeTeamId, gameState.currentRound);
            gameState.nextTeamEffects.marketShock = false;
        }

        await currentTeam.save();
        await gameState.save();

        return gameState;
    }

    /**
     * Get current game state
     */
    async getCurrentState() {
        const gameState = await GameState.findById('GAME_STATE')
            .populate('activeTeamId')
            .populate('teamOrder');

        return gameState;
    }

    /**
     * End game
     */
    async endGame() {
        const gameState = await GameState.findById('GAME_STATE');
        if (!gameState) throw new Error('Game state not initialized');

        gameState.currentPhase = 'COMPLETED';
        await gameState.save();

        return gameState;
    }
}

export default new RoundService();
