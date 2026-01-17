import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
    assetType: {
        type: String,
        enum: ['CRYPTO', 'STOCK', 'GOLD', 'EURO_BOND', 'TREASURY_BILL'],
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    currentValue: {
        type: Number,
        required: true,
    },
    baseValue: {
        type: Number,
        required: true,
    },
    // Volume tracking for price changes
    cumulativeBuyVolume: {
        type: Number,
        default: 0,
    },
    cumulativeSellVolume: {
        type: Number,
        default: 0,
    },
    // Price history for graphs
    priceHistory: [{
        value: Number,
        timestamp: {
            type: Date,
            default: Date.now,
        },
        round: Number,
        event: String, // 'trade', 'card_effect', 'manual_adjustment'
    }],
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Add price to history
assetSchema.methods.addPricePoint = function (value, round, event = 'trade') {
    this.priceHistory.push({
        value,
        timestamp: new Date(),
        round,
        event,
    });

    // Keep only last 100 price points to avoid bloat
    if (this.priceHistory.length > 100) {
        this.priceHistory = this.priceHistory.slice(-100);
    }
};

const Asset = mongoose.model('Asset', assetSchema);

export default Asset;
