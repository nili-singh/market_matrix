import dotenv from 'dotenv';
import mongoose from 'mongoose';
import GameState from '../models/GameState.js';
import Asset from '../models/Asset.js';

dotenv.config();

/**
 * Check current state of snapshots and assets
 */
async function checkSnapshots() {
    try {
        console.log('🔍 Checking snapshots and asset data...\\n');

        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\\n');

        // Get game state
        const gameState = await GameState.findById('GAME_STATE');
        if (!gameState) {
            console.log('❌ Game state not found');
            process.exit(1);
        }

        console.log(`Current Round: ${gameState.currentRound}`);
        console.log(`Number of Snapshots: ${gameState.roundSnapshots?.length || 0}\\n`);

        if (gameState.roundSnapshots && gameState.roundSnapshots.length > 0) {
            console.log('Snapshots:');
            gameState.roundSnapshots.forEach(snap => {
                console.log(`\\n  Round ${snap.round}:`);
                console.log(`    Timestamp: ${snap.timestamp}`);
                if (snap.assetPrices) {
                    console.log('    Asset Prices:');
                    Object.entries(snap.assetPrices).forEach(([type, price]) => {
                        console.log(`      ${type}: ${price}`);
                    });
                } else {
                    console.log('    ⚠️  No assetPrices field');
                }
            });
        }

        // Get current asset prices
        console.log('\\n\\nCurrent Asset Prices:');
        const assets = await Asset.find({});
        assets.forEach(asset => {
            console.log(`  ${asset.assetType}: ${asset.currentValue}`);
        });

        await mongoose.disconnect();
        console.log('\\n✅ Check complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkSnapshots();
