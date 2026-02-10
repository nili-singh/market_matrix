// Quick script to check asset data in MongoDB
import mongoose from 'mongoose';
import Asset from './src/models/Asset.js';

mongoose.connect('mongodb://localhost:27017/market_matrix')
    .then(async () => {
        console.log('✅ Connected to MongoDB\n');

        const assets = await Asset.find();
        console.log(`📊 Total Assets: ${assets.length}\n`);

        assets.forEach(asset => {
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`Asset: ${asset.assetType} (${asset.name})`);
            console.log(`Base Value: ${asset.baseValue}`);
            console.log(`Current Value: ${asset.currentValue}`);
            console.log(`Price History Length: ${asset.priceHistory?.length || 0}`);

            if (asset.priceHistory && asset.priceHistory.length > 0) {
                console.log('\nRecent History:');
                asset.priceHistory.slice(-5).forEach(point => {
                    console.log(`  Round ${point.round}: ₹${point.value} (${point.event})`);
                });
            } else {
                console.log('⚠️  NO PRICE HISTORY!');
            }
            console.log('');
        });

        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
