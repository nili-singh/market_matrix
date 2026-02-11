// Quick API test script
import fetch from 'node-fetch';

const API_URL = 'https://market-matrix-t2nc.onrender.com/api/assets/history';

console.log('Fetching asset history from:', API_URL);

fetch(API_URL)
    .then(res => res.json())
    .then(data => {
        console.log('\n✅ SUCCESS\n');
        console.log('Response structure:');
        console.log('- success:', data.success);
        console.log('- data.rounds:', data.data?.rounds);
        console.log('- data.assets:', Object.keys(data.data?.assets || {}));

        if (data.data?.assets) {
            console.log('\nAsset History Samples:');
            Object.keys(data.data.assets).forEach(assetType => {
                const asset = data.data.assets[assetType];
                console.log(`\n${assetType}:`);
                console.log(`  Current Value: ${asset.currentValue}`);
                console.log(`  Base Value: ${asset.baseValue}`);
                console.log(`  History Length: ${asset.history?.length || 0}`);
                if (asset.history && asset.history.length > 0) {
                    console.log(`  Last 3 entries:`);
                    asset.history.slice(-3).forEach(h => {
                        console.log(`    R${h.round}: ₹${h.value} (${h.event})`);
                    });
                }
            });
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ ERROR:', err.message);
        process.exit(1);
    });
