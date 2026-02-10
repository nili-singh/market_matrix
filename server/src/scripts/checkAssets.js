import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/market_matrix';

const checkAssets = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const assets = await mongoose.connection.collection('assets').find({}).toArray();

        console.log(`Found ${assets.length} assets:\n`);

        assets.forEach(asset => {
            console.log(`${asset.assetType}:`);
            console.log(`  Name: ${asset.name}`);
            console.log(`  Base Value: ${asset.baseValue}`);
            console.log(`  Current Value: ${asset.currentValue}`);
            console.log(`  Cumulative Buy Volume: ${asset.cumulativeBuyVolume || 0}`);
            console.log(`  Cumulative Sell Volume: ${asset.cumulativeSellVolume || 0}`);
            console.log(`  Price History:`);
            if (asset.priceHistory && asset.priceHistory.length > 0) {
                asset.priceHistory.forEach((point, index) => {
                    console.log(`    ${index + 1}. Round ${point.round} - ${point.event}: ${point.value}`);
                });
            } else {
                console.log(`    (no history)`);
            }
            console.log('');
        });

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkAssets();
