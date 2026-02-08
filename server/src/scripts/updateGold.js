import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/market_matrix';

const updateGold = async () => {
    try {
        console.log('🔄 Updating Gold to 300 points...');
        await mongoose.connect(MONGODB_URI);

        await mongoose.connection.collection('assets').updateOne(
            { assetType: 'GOLD' },
            {
                $set: {
                    baseValue: 300,
                    currentValue: 300,
                    priceHistory: [{
                        value: 300,
                        timestamp: new Date(),
                        round: 0,
                        event: 'value_update'
                    }],
                    lastUpdated: new Date()
                }
            }
        );

        console.log('✅ Gold updated to 300 points!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

updateGold();
