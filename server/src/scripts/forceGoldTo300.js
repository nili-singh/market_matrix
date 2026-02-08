import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/market_matrix';

const updateGoldTo300 = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Update Gold asset - both baseValue and currentValue
        const result = await mongoose.connection.collection('assets').updateOne(
            { assetType: 'GOLD' },
            {
                $set: {
                    baseValue: 300,
                    currentValue: 300
                }
            }
        );

        console.log(`Updated: ${result.modifiedCount} document(s)`);

        // Also update ALL entries in priceHistory to 300
        const goldAsset = await mongoose.connection.collection('assets').findOne({ assetType: 'GOLD' });

        if (goldAsset && goldAsset.priceHistory) {
            console.log(`\nUpdating ${goldAsset.priceHistory.length} price history entries...`);

            // Update all priceHistory values to 300
            goldAsset.priceHistory.forEach(entry => {
                entry.value = 300;
            });

            await mongoose.connection.collection('assets').updateOne(
                { assetType: 'GOLD' },
                { $set: { priceHistory: goldAsset.priceHistory } }
            );

            console.log('✅ All price history updated to 300');
        }

        // Verify final state
        const verified = await mongoose.connection.collection('assets').findOne({ assetType: 'GOLD' });
        console.log('\n✅ VERIFICATION:');
        console.log(`Gold Coin:`);
        console.log(`  Base Value: ${verified.baseValue}`);
        console.log(`  Current Value: ${verified.currentValue}`);
        console.log(`  Latest History Entry: Round ${verified.priceHistory[verified.priceHistory.length - 1].round}, Value ${verified.priceHistory[verified.priceHistory.length - 1].value}`);

        await mongoose.disconnect();
        console.log('\n✅ Done! Gold is now 300 everywhere.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

updateGoldTo300();
