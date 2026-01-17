import Asset from '../models/Asset.js';
import { ASSETS } from '../config/constants.js';

class AssetService {
    /**
     * Initialize all assets with base values
     */
    async initializeAssets() {
        const assetPromises = Object.entries(ASSETS).map(async ([key, config]) => {
            const existing = await Asset.findOne({ assetType: key });

            if (!existing) {
                const asset = new Asset({
                    assetType: key,
                    name: config.name,
                    currentValue: config.baseValue,
                    baseValue: config.baseValue,
                    priceHistory: [{
                        value: config.baseValue,
                        timestamp: new Date(),
                        round: 0,
                        event: 'initialization',
                    }],
                });

                return asset.save();
            }

            return existing;
        });

        return Promise.all(assetPromises);
    }

    /**
     * Get all assets with current values
     */
    async getAllAssets() {
        return Asset.find().sort({ assetType: 1 });
    }

    /**
     * Update asset value based on volume traded
     */
    async updateAssetValue(assetType, action, quantity, currentRound) {
        const asset = await Asset.findOne({ assetType });
        if (!asset) throw new Error(`Asset ${assetType} not found`);

        const config = ASSETS[assetType];
        let priceChanged = false;

        if (action === 'BUY') {
            asset.cumulativeBuyVolume += quantity;

            // Check if threshold reached
            if (asset.cumulativeBuyVolume >= config.buyThreshold) {
                const multiplier = Math.floor(asset.cumulativeBuyVolume / config.buyThreshold);
                const percentChange = config.priceChangePercent * multiplier;

                asset.currentValue = asset.currentValue * (1 + percentChange / 100);
                asset.cumulativeBuyVolume = asset.cumulativeBuyVolume % config.buyThreshold;
                priceChanged = true;
            }
        } else if (action === 'SELL') {
            asset.cumulativeSellVolume += quantity;

            // Check if threshold reached
            if (asset.cumulativeSellVolume >= config.sellThreshold) {
                const multiplier = Math.floor(asset.cumulativeSellVolume / config.sellThreshold);
                const percentChange = config.priceChangePercent * multiplier;

                asset.currentValue = asset.currentValue * (1 - percentChange / 100);
                asset.cumulativeSellVolume = asset.cumulativeSellVolume % config.sellThreshold;
                priceChanged = true;
            }
        }

        if (priceChanged) {
            asset.addPricePoint(asset.currentValue, currentRound, 'trade');
            asset.lastUpdated = new Date();
            await asset.save();
        }

        return { asset, priceChanged };
    }

    /**
     * Apply card effect to asset (percentage-based)
     */
    async applyCardEffect(assetType, percentageChange, currentRound) {
        const asset = await Asset.findOne({ assetType });
        if (!asset) throw new Error(`Asset ${assetType} not found`);

        // Apply percentage change to current value
        const changeAmount = asset.currentValue * (percentageChange / 100);
        asset.currentValue += changeAmount;

        // Ensure value doesn't go below 1
        if (asset.currentValue < 1) {
            asset.currentValue = 1;
        }

        asset.addPricePoint(asset.currentValue, currentRound, 'card_effect');
        asset.lastUpdated = new Date();
        await asset.save();

        return asset;
    }

    /**
     * Manually adjust asset value (admin only)
     */
    async manualAdjustment(assetType, newValue, currentRound) {
        const asset = await Asset.findOne({ assetType });
        if (!asset) throw new Error(`Asset ${assetType} not found`);

        asset.currentValue = newValue;
        asset.addPricePoint(newValue, currentRound, 'manual_adjustment');
        asset.lastUpdated = new Date();
        await asset.save();

        return asset;
    }

    /**
     * Get price history for graphs
     */
    async getPriceHistory(assetType) {
        const asset = await Asset.findOne({ assetType });
        if (!asset) throw new Error(`Asset ${assetType} not found`);

        return asset.priceHistory;
    }

    /**
     * Reset all assets to base values
     */
    async resetAllAssets() {
        const assets = await Asset.find();

        for (const asset of assets) {
            const config = ASSETS[asset.assetType];
            asset.currentValue = config.baseValue;
            asset.cumulativeBuyVolume = 0;
            asset.cumulativeSellVolume = 0;
            asset.priceHistory = [{
                value: config.baseValue,
                timestamp: new Date(),
                round: 0,
                event: 'reset',
            }];
            await asset.save();
        }

        return assets;
    }
}

export default new AssetService();
