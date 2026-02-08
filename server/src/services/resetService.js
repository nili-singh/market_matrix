import mongoose from 'mongoose';
import GameState from '../models/GameState.js';
import Team from '../models/Team.js';
import Asset from '../models/Asset.js';
import Card from '../models/Card.js';
import { ASSETS } from '../config/constants.js';

/**
 * Perform a complete global game reset
 * This affects all teams, assets, cards, and game state
 */
const performGlobalReset = async () => {
    try {
        console.log('🔄 Starting global game reset...');

        // 1. Reset all assets to their base values FROM CONSTANTS (new values)
        const assets = await Asset.find();
        console.log(`Found ${assets.length} assets to reset`);

        for (const asset of assets) {
            const config = ASSETS[asset.assetType];
            if (config) {
                asset.baseValue = config.baseValue; // Update to new base value
                asset.currentValue = config.baseValue; // Reset current to new base
                asset.cumulativeBuyVolume = 0;
                asset.cumulativeSellVolume = 0;
                asset.priceHistory = [{
                    value: config.baseValue,
                    timestamp: new Date(),
                    round: 1,
                    event: 'reset'
                }];
                await asset.save();
                console.log(`  ✅ ${asset.assetType} reset to ${config.baseValue} points`);
            }
        }
        console.log('✅ Assets reset complete');

        // 2. Reset all cards to not drawn
        const cardResult = await Card.updateMany(
            {},
            { $set: { isDrawn: false } }
        );
        console.log(`✅ Cards reset complete: ${cardResult.modifiedCount} cards`);

        // 3. Reset all teams to initial state
        const teamResult = await Team.updateMany(
            {},
            {
                $set: {
                    virtualBalance: 100000,
                    'assets.CRYPTO': 0,
                    'assets.STOCK': 0,
                    'assets.GOLD': 0,
                    'assets.EURO_BOND': 0,
                    'assets.TREASURY_BILL': 0,
                    activeCardEffects: [],
                    hasInsiderInfo: false,
                    tradeFrozen: false,
                    reverseImpact: false,
                }
            }
        );
        console.log(`✅ Teams reset complete: ${teamResult.modifiedCount} teams`);

        // 4. Reset game state
        const gameStateResult = await GameState.updateOne(
            {},
            {
                $set: {
                    currentRound: 1,
                    currentPhase: 'ROUND2',
                    activeTeamId: null,
                    currentTeamIndex: 0,
                    currentCardIndex: 0,
                    lastShuffleRound: 0,
                    drawnCards: [],
                    roundSnapshots: [],
                    roundHistory: [],
                    'nextTeamEffects.tradeFrozen': false,
                    'nextTeamEffects.marketShock': false,
                    'nextTeamEffects.reverseImpact': false,
                    lastUpdated: new Date(),
                }
            },
            { upsert: true }
        );
        console.log('✅ Game state reset complete');

        console.log('✅ Global game reset completed successfully');

        return {
            success: true,
            message: 'Game reset successfully',
            resetData: {
                assetsReset: assets.length,
                cardsReset: await Card.countDocuments(),
                teamsReset: await Team.countDocuments(),
                timestamp: new Date(),
            }
        };
    } catch (error) {
        console.error('❌ Error during global reset:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        throw error;
    }
};

/**
 * Get current game state summary for display
 */
const getGameStateSummary = async () => {
    try {
        const gameState = await GameState.findOne();
        const teamCount = await Team.countDocuments();
        const drawnCardCount = await Card.countDocuments({ isDrawn: true });

        return {
            currentRound: gameState?.currentRound || 0,
            currentPhase: gameState?.currentPhase || 'REGISTRATION',
            teamCount,
            drawnCardCount,
            lastUpdated: gameState?.lastUpdated,
        };
    } catch (error) {
        console.error('Error getting game state summary:', error);
        throw error;
    }
};

export default {
    performGlobalReset,
    getGameStateSummary,
};
