// Check detailed game state
import mongoose from 'mongoose';
import GameState from './src/models/GameState.js';
import Asset from './src/models/Asset.js';

const checkState = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/market-matrix');
        console.log('✅ Connected\n');

        const gameState = await GameState.findById('GAME_STATE');

        if (gameState) {
            console.log('📊 GAME STATE:');
            console.log(`Current Round: ${gameState.currentRound}`);
            console.log(`Phase: ${gameState.currentPhase}`);
            console.log(`Team Order: ${gameState.teamOrder?.length || 0} teams`);
        } else {
            console.log('❌ No game state found!');
        }

        console.log('\n📈 ASSET PRICE HISTORY:');
        const assets = await Asset.find({});

        for (const asset of assets) {
            const rounds = asset.priceHistory.map(h => h.round).sort((a, b) => a - b);
            console.log(`${asset.assetType}: Rounds [${rounds.join(', ')}]`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkState();
