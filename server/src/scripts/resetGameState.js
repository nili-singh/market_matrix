import mongoose from 'mongoose';
import GameState from '../models/GameState.js';
import Card from '../models/Card.js';
import dotenv from 'dotenv';

dotenv.config();

const resetGameState = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/market_matrix');
        console.log('✅ Connected to MongoDB');

        // Reset game state to round 1
        const result = await GameState.updateOne(
            {},
            {
                $set: {
                    currentRound: 1,
                    phase: 'ROUND1',
                    roundSnapshots: [],
                    drawnCards: []
                }
            }
        );

        console.log(`✅ Game state reset: ${result.modifiedCount} document(s) modified`);

        // Reset all cards to not drawn
        const cardResult = await Card.updateMany(
            {},
            {
                $set: { isDrawn: false }
            }
        );

        console.log(`✅ Cards reset: ${cardResult.modifiedCount} card(s) reset`);

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting game state:', error);
        process.exit(1);
    }
};

resetGameState();
