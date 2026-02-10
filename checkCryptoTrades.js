import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/market_matrix';

const checkCryptoTrades = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const teams = await mongoose.connection.collection('teams').find({}).toArray();

        console.log('=== ALL TEAMS CRYPTO HOLDINGS ===\n');

        let totalCrypto = 0;
        teams.forEach(team => {
            const crypto = team.assets?.CRYPTO || 0;
            totalCrypto += crypto;
            console.log(`${team.teamName.padEnd(15)}: ${crypto} units`);
        });

        console.log(`\n${'TOTAL'.padEnd(15)}: ${totalCrypto} units`);
        console.log('\n=== EXPECTED BEHAVIOR ===\n');
        console.log('Threshold: 100 units = +25% increase');
        console.log('');
        console.log('0-99 units    → No increase (200 remains 200)');
        console.log('100-199 units → One +25% (200 → 250)');
        console.log('200-299 units → Two +25% (200 → 250 → 312.5)');
        console.log('300-399 units → Three +25% (200 → 250 → 312.5 → 390.625)');

        console.log('\n=== CURRENT STATE ===\n');
        console.log(`Crypto units bought: ${totalCrypto}`);
        console.log(`Current Crypto value: 312.5`);

        if (totalCrypto >= 200) {
            console.log(`✅ CORRECT: ${totalCrypto} units = TWO increases (200 → 250 → 312.5)`);
        } else if (totalCrypto >= 100) {
            console.log(`❌ MISMATCH: ${totalCrypto} units should = ONE increase (200 → 250), not 312.5`);
        } else {
            console.log(`❌ MISMATCH: ${totalCrypto} units should = NO increase (stay at 200), not 312.5`);
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkCryptoTrades();
