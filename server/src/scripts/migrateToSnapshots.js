import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import GameState from '../models/GameState.js';
import Asset from '../models/Asset.js';
import Team from '../models/Team.js';

dotenv.config();

/**
 * Migration script to convert Asset.priceHistory to GameState.roundSnapshots
 * Run this once before deploying the immutable snapshot changes
 */
async function migrateToSnapshots() {
    try {
        console.log('🔄 Starting migration to round snapshots...\\n');

        // Connect to database
        await connectDB();

        // Get game state
        const gameState = await GameState.findById('GAME_STATE');
        if (!gameState) {
            console.log('❌ Game state not found. Run seed first.');
            process.exit(1);
        }

        // Get all assets
        const assets = await Asset.find({});

        // Group price history by round
        const roundMap = new Map();

        assets.forEach(asset => {
            if (asset.priceHistory && asset.priceHistory.length > 0) {
                asset.priceHistory.forEach(point => {
                    if (point.round !== undefined) {
                        if (!roundMap.has(point.round)) {
                            roundMap.set(point.round, {
                                round: point.round,
                                timestamp: point.timestamp,
                                assetPrices: {},
                                assetValues: {},
                                leaderboard: [],
                                drawnCardIds: [],
                            });
                        }
                        roundMap.get(point.round).assetPrices[asset.assetType] = point.value;
                    }
                });
            }
        });

        // Get team data for each round (if available)
        const teams = await Team.find({});

        // Create snapshots array
        const snapshots = Array.from(roundMap.values()).sort((a, b) => a.round - b.round);

        // For each snapshot, try to populate team holdings and leaderboard
        // (This is approximate since we don't have historical team data)
        snapshots.forEach(snapshot => {
            const assetValues = {};

            teams.forEach(team => {
                assetValues[team._id.toString()] = {
                    CRYPTO: team.assets.CRYPTO || 0,
                    STOCK: team.assets.STOCK || 0,
                    GOLD: team.assets.GOLD || 0,
                    EURO_BOND: team.assets.EURO_BOND || 0,
                    TREASURY_BILL: team.assets.TREASURY_BILL || 0,
                };
            });

            snapshot.assetValues = assetValues;

            // Calculate leaderboard based on current holdings and snapshot prices
            const leaderboard = teams.map(team => {
                const totalValue =
                    (team.assets.CRYPTO || 0) * (snapshot.assetPrices.CRYPTO || 0) +
                    (team.assets.STOCK || 0) * (snapshot.assetPrices.STOCK || 0) +
                    (team.assets.GOLD || 0) * (snapshot.assetPrices.GOLD || 0) +
                    (team.assets.EURO_BOND || 0) * (snapshot.assetPrices.EURO_BOND || 0) +
                    (team.assets.TREASURY_BILL || 0) * (snapshot.assetPrices.TREASURY_BILL || 0) +
                    (team.balance || 0);

                return {
                    teamId: team._id,
                    teamName: team.teamName,
                    totalValue,
                };
            }).sort((a, b) => b.totalValue - a.totalValue);

            snapshot.leaderboard = leaderboard;
        });

        // Update game state with snapshots
        gameState.roundSnapshots = snapshots;
        await gameState.save();

        console.log(`✅ Migrated ${snapshots.length} rounds to snapshots`);
        console.log('\\nRound snapshots created:');
        snapshots.forEach(snap => {
            const assetPriceStr = Object.entries(snap.assetPrices)
                .map(([type, price]) => `${type}: ${price}`)
                .join(', ');
            console.log(`  Round ${snap.round}: ${assetPriceStr}`);
        });

        console.log('\\n🎉 Migration completed successfully!\\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

migrateToSnapshots();
