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
