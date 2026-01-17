import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
    teamName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    members: [{
        name: {
            type: String,
            required: true,
        },
        email: String,
    }],
    registrationType: {
        type: String,
        enum: ['SOLO', 'DUO', 'SQUAD'],
        required: true,
    },
    registrationFee: {
        type: Number,
        required: true,
    },
    round1Qualified: {
        type: Boolean,
        default: false,
    },
    round1Participant: {
        type: String, // Name of the member who attempted Round 1
    },
    // Round 2 Trading Data
    virtualBalance: {
        type: Number,
        default: 100000, // ₹1,00,000
    },
    assets: {
        CRYPTO: {
            type: Number,
            default: 0,
        },
        STOCK: {
            type: Number,
            default: 0,
        },
        GOLD: {
            type: Number,
            default: 0,
        },
        EURO_BOND: {
            type: Number,
            default: 0,
        },
        TREASURY_BILL: {
            type: Number,
            default: 0,
        },
    },
    // Active Card Effects
    activeCardEffects: [{
        cardType: String,
        effect: String,
        expiresAtRound: Number,
    }],
    // Special Flags
    hasInsiderInfo: {
        type: Boolean,
        default: false, // Skip card draw next round
    },
    tradeFrozen: {
        type: Boolean,
        default: false, // Can only trade one asset
    },
    reverseImpact: {
        type: Boolean,
        default: false, // Next card effect is reversed
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Virtual field for portfolio value
teamSchema.virtual('portfolioValue').get(function () {
    // This will be calculated with current asset prices
    return 0; // Placeholder
});

const Team = mongoose.model('Team', teamSchema);

export default Team;
