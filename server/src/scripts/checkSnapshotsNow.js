import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/market_matrix';

async function checkSnapshots() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected\n');

        const GameStateSchema = new mongoose.Schema({
            _id: String,
            currentRound: Number,
            roundSnapshots: [mongoose.Schema.Types.Mixed]
        }, { strict: false });

        const GameState = mongoose.models.GameState || mongoose.model('GameState', GameStateSchema, 'gamestates');

        const gameState = await GameState.findById('GAME_STATE');

        if (!gameState) {
            console.log('❌ No game state found');
            process.exit(1);
        }

        console.log(`📊 Current Round: ${gameState.currentRound}`);
        console.log(`📸 Number of Snapshots: ${gameState.roundSnapshots?.length || 0}\n`);

        if (gameState.roundSnapshots && gameState.roundSnapshots.length > 0) {
            console.log('Snapshots:');
            gameState.roundSnapshots.forEach(snap => {
                console.log(`\n  Round ${snap.round}:`);
                console.log(`    Timestamp: ${snap.timestamp}`);
                console.log(`    Asset Prices:`);
                if (snap.assetPrices) {
                    Object.entries(snap.assetPrices).forEach(([asset, price]) => {
                        console.log(`      ${asset}: ${price}`);
                    });
                } else {
                    console.log('      ❌ No asset prices!');
                }
            });
        } else {
            console.log('❌ No snapshots found!');
            console.log('\nThis means:');
            console.log('- Rounds were advanced without creating snapshots');
            console.log('- OR snapshots creation is failing silently');
        }

        await mongoose.connection.close();
        console.log('\n✅ Check complete');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

checkSnapshots();
