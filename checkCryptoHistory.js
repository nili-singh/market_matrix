const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/market_matrix')
    .then(async () => {
        console.log('✅ Connected to MongoDB\n');

        const Asset = require('./server/src/models/Asset');

        const crypto = await Asset.findOne({ assetType: 'CRYPTO' });

        if (crypto) {
            console.log('🔍 CRYPTO ASSET DETAILED HISTORY:\n');
            console.log(`Base Value: ${crypto.baseValue}`);
            console.log(`Current Value: ${crypto.currentValue}`);
            console.log(`Cumulative Buy Volume: ${crypto.cumulativeBuyVolume}`);
            console.log(`Cumulative Sell Volume: ${crypto.cumulativeSellVolume}\n`);

            console.log('📊 Price History:');
            crypto.priceHistory.forEach((point, index) => {
                console.log(`${index + 1}. Round ${point.round} - ${point.event}`);
                console.log(`   Value: ${point.value}`);
                console.log(`   Time: ${point.timestamp}`);
                console.log('');
            });

            // Calculate what happened
            console.log('\n💡 CALCULATION BREAKDOWN:');
            console.log('Base: 200');
            if (crypto.priceHistory.length > 1) {
                crypto.priceHistory.slice(1).forEach((point, index) => {
                    const prevValue = index === 0 ? crypto.baseValue : crypto.priceHistory[index].value;
                    const change = ((point.value - prevValue) / prevValue * 100).toFixed(2);
                    console.log(`Step ${index + 1}: ${prevValue} → ${point.value} (${change > 0 ? '+' : ''}${change}%) [${point.event}]`);
                });
            }
        }

        await mongoose.connection.close();
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
