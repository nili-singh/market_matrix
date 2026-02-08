import fetch from 'node-fetch';

async function testGraphAPI() {
    try {
        const response = await fetch('http://localhost:3000/api/assets/history');
        const data = await response.json();

        console.log('\n=== API Response ===');
        console.log('Success:', data.success);
        console.log('Rounds array:', data.data.rounds);
        console.log('Number of assets:', Object.keys(data.data.assets).length);

        console.log('\n=== Asset Details ===');
        Object.entries(data.data.assets).forEach(([assetType, assetData]) => {
            console.log(`\n${assetType}:`);
            console.log(`  History length: ${assetData.history.length}`);
            console.log(`  History:`, assetData.history);
        });

        console.log('\n=== Rounds >= 1 ===');
        const r1PlusRounds = data.data.rounds.filter(r => r >= 1);
        console.log('Filtered rounds:', r1PlusRounds);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testGraphAPI();
