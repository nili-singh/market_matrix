import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true,
    },
    round: {
        type: Number,
        required: true,
    },
    // Trade details
    assetType: {
        type: String,
        enum: ['CRYPTO', 'STOCK', 'GOLD', 'EURO_BOND', 'TREASURY_BILL'],
    },
    action: {
        type: String,
        enum: ['BUY', 'SELL', 'TEAM_TRADE'],
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    pricePerUnit: {
        type: Number,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    // Team-to-team trading
    counterpartyTeamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
    },
    // Card drawn this turn
    cardDrawn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card',
    },
    cardEffect: {
        type: String,
    },
    // Balance after transaction
    balanceAfter: {
        type: Number,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
