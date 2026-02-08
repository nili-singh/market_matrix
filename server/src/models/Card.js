import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
    cardId: {
        type: String,
        required: true,
        unique: true,
    },
    category: {
        type: String,
        enum: ['ASSET_INCREASE', 'ASSET_DECREASE', 'INTER_TEAM', 'NEUTRAL'],
        required: true,
    },
    type: {
        type: String, // e.g., 'CRYPTO_INCREASE', 'TRADE_FREEZE', 'BETTER_LUCK'
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    // For asset-specific cards
    targetAsset: {
        type: String,
        enum: ['CRYPTO', 'STOCK', 'GOLD', 'EURO_BOND', 'TREASURY_BILL', null],
    },
    percentageChange: {
        min: Number,
        max: Number,
    },
    // For inter-team cards
    specialEffect: {
        type: String, // 'TRADE_FREEZE', 'MARKET_SHOCK', 'INSIDER_INFO', 'REVERSE_IMPACT'
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Visual properties for deck animation
    position: {
        x: {
            type: Number,
            default: 0,
        },
        y: {
            type: Number,
            default: 0,
        },
        rotation: {
            type: Number,
            default: 0,
        },
        zIndex: {
            type: Number,
            default: 0,
        },
    },
    isDrawn: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const Card = mongoose.model('Card', cardSchema);

export default Card;
