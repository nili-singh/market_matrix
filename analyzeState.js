import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/market_matrix';

async function analyzeFullState() {
    await mongoose.connect(MONGODB_URI);
    console.log('=== COMPLETE SYSTEM STATE ANALYSIS ===\n');

    const gameState = await mongoose.connection.collection('gamestates').findOne({});
    const teams = await mongoose.connection.collection('teams').find({}).toArray();
    const crypto = await mongoose.connection.collection('assets').findOne({ assetType: 'CRYPTO' });

    console.log(`Current Round: ${gameState?.currentRound || 0}`);
    console.log(`\n--- CRYPTO ASSET ---`);
    console.log(`Base: ${crypto.baseValue}`);
    console.log(`Current: ${crypto.currentValue}`);
    console.log(`Cumulative Buy: ${crypto.cumulativeBuyVolume}`);
    console.log(`Cumulative Sell: ${crypto.cumulativeSellVolume}`);

    console.log(`\n--- TEAMS ---`);
    let total = 0;
    teams.forEach(t => {
        const amt = t.assets?.CRYPTO || 0;
        total += amt;
        console.log(`${t.teamName}: ${amt} units`);
    });
    console.log(`Total bought: ${total}`);

    console.log(`\n--- PRICE HISTORY ---`);
    crypto.priceHistory.forEach((p, i) => {
        console.log(`${i}. R${p.round} ${p.event}: ${p.value}`);
    });

    console.log(`\n--- ANALYSIS ---`);
    console.log(`Expected with 140 units: 250 (one +25% increase)`);
    console.log(`Actual value: ${crypto.currentValue}`);

    if (crypto.currentValue === 250) {
        console.log(`✅ CORRECT!`);
    } else {
        console.log(`❌ BUG CONFIRMED!`);
        console.log(`\nPossible causes:`);
        console.log(`1. Value wasn't reset properly from previous game`);
        console.log(`2. UpdateAssetValue was called multiple times`);
        console.log(`3. Card effect added +25% more (check card history)`);
    }

    await mongoose.disconnect();
    process.exit(0);
}

analyzeFullState().catch(console.error);
