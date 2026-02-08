import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/market_matrix';

const fixGoldValue = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Update Gold asset currentValue to 300
        const result = await mongoose.connection.collection('assets').updateOne(
            { assetType: 'GOLD' },
            {
                $set: {
                    currentValue: 300,
                    baseValue: 300
                }
            }
        );

        console.log(`Gold asset updated: ${result.modifiedCount} document(s) modified`);

        // Also update the latest priceHistory entry
        const goldAsset = await mongoose.connection.collection('assets').findOne({ assetType: 'GOLD' });

        if (goldAsset && goldAsset.priceHistory && goldAsset.priceHistory.length > 0) {
            // Update the latest price history entry
            goldAsset.priceHistory[goldAsset.priceHistory.length - 1].value = 300;

            await mongoose.connection.collection('assets').updateOne(
                { assetType: 'GOLD' },
                { $set: { priceHistory: goldAsset.priceHistory } }
            );

            console.log('✅ Price history updated');
        }

        // Verify
        const updated = await mongoose.connection.collection('assets').findOne({ assetType: 'GOLD' });
        console.log('\nVerification:');
        console.log(`Gold Coin - Base: ${updated.baseValue}, Current: ${updated.currentValue}`);

        await mongoose.disconnect();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixGoldValue();
