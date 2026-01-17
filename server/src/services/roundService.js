import GameState from '../models/GameState.js';
import Team from '../models/Team.js';
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
     * Advance to next round
     */
    async nextRound() {
        const gameState = await GameState.findById('GAME_STATE');
        if (!gameState) throw new Error('Game state not initialized');

        gameState.currentRound += 1;

        // Shuffle deck before even rounds
        if (gameState.currentRound % 2 === 0) {
            await cardService.shuffleDeck(gameState.currentRound);
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

        return gameState;
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
