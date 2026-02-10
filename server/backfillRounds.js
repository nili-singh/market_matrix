// Backfill missing price history for Rounds 4 and 5
import mongoose from 'mongoose';
import Asset from './src/models/Asset.js';
import GameState from './src/models/GameState.js';

const backfillPriceHistory = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/market-matrix');
        console.log('✅ Connected to MongoDB');

        const gameState = await GameState.findById('GAME_STATE');
        const currentRound = gameState?.currentRound || 0;

        console.log(`Current game round: ${currentRound}`);

        const assets = await Asset.find({});

        for (const asset of assets) {
            console.log(`\n📊 ${asset.assetType}:`);
            console.log(`Current Value: ₹${asset.currentValue}`);
            console.log(`Existing history: ${asset.priceHistory.length} rounds`);

            const existingRounds = asset.priceHistory.map(h => h.round);
            console.log(`Existing rounds: [${existingRounds.join(', ')}]`);

            // Add missing rounds (4 and 5 if they don't exist)
            for (let round = 4; round <= currentRound; round++) {
                if (!existingRounds.includes(round)) {
                    console.log(`  Adding Round ${round} with value: ₹${asset.currentValue}`);
                    asset.addPricePoint(asset.currentValue, round, 'backfill');
                }
            }

            await asset.save();
            console.log(`✅ Saved ${asset.assetType}`);
        }

        console.log('\n✅ Backfill complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

backfillPriceHistory();
