import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Asset from '../models/Asset.js';
import { ASSETS } from '../config/constants.js';

dotenv.config();

/**
 * Update all assets in database to new base values
 */
const updateAssetValues = async () => {
    try {
        console.log('🔄 Updating asset values to new base values...\n');

        await connectDB();

        // Update each asset to new base value
        for (const [assetType, config] of Object.entries(ASSETS)) {
            const asset = await Asset.findOne({ assetType });

            if (asset) {
                console.log(`Updating ${assetType}:`);
                console.log(`  Old value: ${asset.currentValue}`);
                console.log(`  New value: ${config.baseValue}`);

                asset.currentValue = config.baseValue;
                asset.baseValue = config.baseValue;
                asset.cumulativeBuyVolume = 0;
                asset.cumulativeSellVolume = 0;
                asset.priceHistory = [{
                    value: config.baseValue,
                    timestamp: new Date(),
                    round: 0,
                    event: 'value_update'
                }];

                await asset.save();
                console.log(`  ✅ Updated\n`);
            } else {
                console.log(`Creating new asset: ${assetType} with value ${config.baseValue}`);
                const newAsset = new Asset({
                    assetType,
                    name: config.name,
                    currentValue: config.baseValue,
                    baseValue: config.baseValue,
                    priceHistory: [{
                        value: config.baseValue,
                        timestamp: new Date(),
                        round: 0,
                        event: 'initialization'
                    }]
                });
                await newAsset.save();
                console.log(`  ✅ Created\n`);
            }
        }

        console.log('✅ All assets updated to new base values!');
        console.log('\nNew values:');
        console.log('  Crypto Token: 200 points');
        console.log('  Stock: 250 points');
        console.log('  Gold Coin: 300 points');
        console.log('  Euro Bond: 350 points');
        console.log('  Treasury Bill: 400 points\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating assets:', error);
        process.exit(1);
    }
};

updateAssetValues();
