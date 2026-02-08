import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/market_matrix';

const updateAssets = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected!\n');

        const updates = [
            { assetType: 'CRYPTO', baseValue: 200, name: 'Crypto Token' },
            { assetType: 'STOCK', baseValue: 250, name: 'Stock' },
            { assetType: 'GOLD', baseValue: 300, name: 'Gold Coin' },
            { assetType: 'EURO_BOND', baseValue: 350, name: 'Euro Bond' },
            { assetType: 'TREASURY_BILL', baseValue: 400, name: 'Treasury Bill' },
        ];

        for (const update of updates) {
            console.log(`Updating ${update.name}...`);
            await mongoose.connection.collection('assets').updateOne(
                { assetType: update.assetType },
                {
                    $set: {
                        baseValue: update.baseValue,
                        currentValue: update.baseValue,
                        cumulativeBuyVolume: 0,
                        cumulativeSellVolume: 0,
                        priceHistory: [{
                            value: update.baseValue,
                            timestamp: new Date(),
                            round: 0,
                            event: 'value_update'
                        }],
                        lastUpdated: new Date()
                    }
                }
            );
            console.log(`  ✅ ${update.name}: ${update.baseValue} points\n`);
        }

        console.log('✅ All assets updated to new point values!');
        console.log('\nRefresh your browser to see the changes.');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

updateAssets();
