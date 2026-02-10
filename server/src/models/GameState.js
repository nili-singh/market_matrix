import mongoose from 'mongoose';

const gameStateSchema = new mongoose.Schema({
    // Singleton pattern - only one game state document
    _id: {
        type: String,
        default: 'GAME_STATE',
    },
    currentRound: {
        type: Number,
        default: 0,
    },
    currentPhase: {
        type: String,
        enum: ['REGISTRATION', 'ROUND1', 'ROUND2', 'COMPLETED'],
        default: 'REGISTRATION',
    },
    activeTeamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
    },
    teamOrder: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
    }],
    currentTeamIndex: {
        type: Number,
        default: 0,
    },
    // Card Deck (shuffled before even rounds)
    cardDeck: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card',
    }],
    currentCardIndex: {
        type: Number,
        default: 0,
    },
    lastShuffleRound: {
        type: Number,
        default: 0,
    },
    // Deck visual state for animations
    deckState: {
        positions: [{
            cardId: String,
            x: Number,
            y: Number,
            rotation: Number,
            zIndex: Number,
        }],
        isShuffling: {
            type: Boolean,
            default: false,
        },
        lastShuffleTimestamp: Date,
    },
    // Track drawn cards (cannot be reused)
    drawnCards: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card',
    }],
    // Round Snapshots (for one-step rollback)
    roundSnapshots: [{
        round: Number,
        timestamp: Date,
        // Asset market prices at this round (immutable historical data)
        assetPrices: {
            CRYPTO: Number,
            STOCK: Number,
            GOLD: Number,
            EURO_BOND: Number,
            TREASURY_BILL: Number,
        },
        // Team asset holdings at this round (for rollback)
        assetValues: {
            type: Map,
            of: {
                CRYPTO: Number,
                STOCK: Number,
                GOLD: Number,
                EURO_BOND: Number,
                TREASURY_BILL: Number,
            },
        },
        leaderboard: [{
            teamId: mongoose.Schema.Types.ObjectId,
            teamName: String,
            totalValue: Number,
        }],
        drawnCardIds: [mongoose.Schema.Types.ObjectId],
    }],
    // Round History
    roundHistory: [{
        round: Number,
        teamId: mongoose.Schema.Types.ObjectId,
        cardDrawn: mongoose.Schema.Types.ObjectId,
        trades: [{
            asset: String,
            action: String,
            quantity: Number,
            price: Number,
        }],
        timestamp: Date,
    }],
    // Next team effects (from inter-team cards)
    nextTeamEffects: {
        tradeFrozen: {
            type: Boolean,
            default: false,
        },
        marketShock: {
            type: Boolean,
            default: false,
        },
        reverseImpact: {
            type: Boolean,
            default: false,
        },
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const GameState = mongoose.model('GameState', gameStateSchema);

export default GameState;
