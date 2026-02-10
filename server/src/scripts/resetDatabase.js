import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/market_matrix';

// Asset base values
const ASSETS = [
    { assetType: 'TREASURY_BILL', name: 'Treasury Bill', baseValue: 400, currentValue: 400 },
    { assetType: 'CRYPTO', name: 'Crypto Token', baseValue: 200, currentValue: 200 },
    { assetType: 'EURO_BOND', name: 'Euro Bond', baseValue: 350, currentValue: 350 },
    { assetType: 'STOCK', name: 'Stock', baseValue: 250, currentValue: 250 },
    { assetType: 'GOLD', name: 'Gold Coin', baseValue: 300, currentValue: 300 },
];

async function resetDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`\n📊 Found ${collections.length} collections`);

        // Drop all collections
        for (const collection of collections) {
            await mongoose.connection.db.dropCollection(collection.name);
            console.log(`   ❌ Dropped collection: ${collection.name}`);
        }

        // Recreate assets with base values
        const Asset = mongoose.model('Asset', new mongoose.Schema({
            assetType: String,
            name: String,
            currentValue: Number,
            baseValue: Number,
            cumulativeBuyVolume: { type: Number, default: 0 },
            cumulativeSellVolume: { type: Number, default: 0 },
            priceHistory: [{
                value: Number,
                timestamp: Date,
                round: Number,
                event: String
            }],
            lastUpdated: { type: Date, default: Date.now }
        }));

        console.log('\n📦 Creating base assets...');
        for (const assetData of ASSETS) {
            const asset = new Asset({
                ...assetData,
                cumulativeBuyVolume: 0,
                cumulativeSellVolume: 0,
                priceHistory: [],
                lastUpdated: new Date()
            });
            await asset.save();
            console.log(`   ✅ Created: ${assetData.name} (${assetData.baseValue} points)`);
        }

        // Create game state
        const GameState = mongoose.model('GameState', new mongoose.Schema({
            _id: String,
            currentRound: Number,
            currentTeamIndex: Number,
            gameStarted: Boolean,
            totalTeams: Number,
            maxRounds: Number,
            lastUpdated: Date
        }));

        const gameState = new GameState({
            _id: 'GAME_STATE',
            currentRound: 0,
            currentTeamIndex: 0,
            gameStarted: false,
            totalTeams: 0,
            maxRounds: 20,
            lastUpdated: new Date()
        });
        await gameState.save();
        console.log('\n🎮 Game state reset to Round 0');

        console.log('\n✅ Database reset complete!');
        console.log('\n📝 Summary:');
        console.log('   - All data cleared');
        console.log('   - Assets recreated with base values');
        console.log('   - Game state reset to Round 0');
        console.log('   - Ready for fresh game start');

        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error resetting database:', error);
        process.exit(1);
    }
}

resetDatabase();
