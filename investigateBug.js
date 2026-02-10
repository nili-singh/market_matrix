// Check if someone bought 100+ units in a single trade
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/market_matrix';

const investigateBug = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        console.log('=== SCENARIO ANALYSIS ===\n');

        console.log('Total Crypto units in teams: 140 units');
        console.log('Current Crypto value: 312.5\n');

        console.log('Possible explanations:\n');
        console.log('1. ❌ Multiple teams bought separately (should be ONE increase)');
        console.log('   - ddfsd: 40 units');
        console.log('   - alpha: 100 units');
        console.log('   - Total: 140 units → threshold hit ONCE');
        console.log('   - Expected: 200 → 250');
        console.log('   - Actual: 312.5');
        console.log('');
        console.log('2. ✅ Someone bought 100+ units IN ONE TRADE');
        console.log('   - If alpha bought 125 units in one go:');
        console.log('   - multiplier = floor(125/100) = 1');
        console.log('   - percentChange = 25 * 1 = 25%');
        console.log('   - 200 * 1.25 = 250');
        console.log('   - cumulative reset to 125 % 100 = 25');
        console.log('   - Then sells 25? No...');
        console.log('');
        console.log('3. ✅ ACTUAL BUG: Multiplier calculation');
        console.log('   - Trade 1: ddfsd buys 40 (cumulative = 40)');
        console.log('   - Trade 2: alpha buys 100 (cumulative = 140)');
        console.log('   - multiplier = floor(140/100) = 1');
        console.log('   - percentChange = 25 * 1 = 25%');
        console.log('   - 200 * 1.25 = 250');
        console.log('   - cumulative reset to 140 % 100 = 40');
        console.log('   - Expected value: 250 ✅');
        console.log('   - Actual value: 312.5 ❌');
        console.log('');
        console.log('4. ✅ DOUBLE TRIGGER: Function called twice?');
        console.log('   - Maybe updateAssetValue was called twice');
        console.log('   - First call: 100 units → 200 to 250');
        console.log('   - Second call: 40 units → 250 to 312.5?');
        console.log('   - But 40 < 100 threshold...');
        console.log('');

        const asset = await mongoose.connection.collection('assets').findOne({ assetType: 'CRYPTO' });
        console.log('=== CURRENT ASSET STATE ===\n');
        console.log('Cumulative Buy Volume:', asset.cumulativeBuyVolume);
        console.log('Cumulative Sell Volume:', asset.cumulativeSellVolume);
        console.log('Current Value:', asset.currentValue);
        console.log('\nIf cumulative is 40, it means:');
        console.log('- 140 total units were bought');
        console.log('- 100 triggered the increase (140 - 40 = 100)'); console.log('- Remaining 40 is stored');
        console.log('-  ONE increase should have happened (200 → 250)');
        console.log('- But actual value is 312.5 (TWO increases!)');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

investigateBug();
