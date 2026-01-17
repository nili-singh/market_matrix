// Game Configuration Constants

export const GAME_CONFIG = {
    INITIAL_BALANCE: 100000, // ₹1,00,000
    MIN_ROUNDS: 6,
    MAX_ROUNDS: 8,
    MAX_QUALIFIED_TEAMS: 10,
};

// Asset Base Values and Trading Thresholds
export const ASSETS = {
    CRYPTO: {
        name: 'Crypto Token',
        baseValue: 250,
        buyThreshold: 500,  // Buy 500 units → +10%
        sellThreshold: 400, // Sell 400 units → -10%
        priceChangePercent: 10,
    },
    STOCK: {
        name: 'Stock',
        baseValue: 300,
        buyThreshold: 400,
        sellThreshold: 300,
        priceChangePercent: 10,
    },
    GOLD: {
        name: 'Gold Coin',
        baseValue: 500,
        buyThreshold: 250,
        sellThreshold: 200,
        priceChangePercent: 10,
    },
    EURO_BOND: {
        name: 'Euro Bond',
        baseValue: 750,
        buyThreshold: 150,
        sellThreshold: 130,
        priceChangePercent: 10,
    },
    TREASURY_BILL: {
        name: 'Treasury Bill',
        baseValue: 900,
        buyThreshold: 120,
        sellThreshold: 110,
        priceChangePercent: 10,
    },
};

// Virtual Card System (40 cards total)
export const CARD_CATEGORIES = {
    ASSET_INCREASE: 'ASSET_INCREASE',
    ASSET_DECREASE: 'ASSET_DECREASE',
    INTER_TEAM: 'INTER_TEAM',
    NEUTRAL: 'NEUTRAL',
};

// Category 1: Asset Increase Cards (12 cards)
export const ASSET_INCREASE_CARDS = [
    { asset: 'CRYPTO', minPercent: 10, maxPercent: 20, count: 3 },
    { asset: 'STOCK', minPercent: 8, maxPercent: 15, count: 3 },
    { asset: 'GOLD', minPercent: 6, maxPercent: 10, count: 2 },
    { asset: 'EURO_BOND', minPercent: 5, maxPercent: 8, count: 2 },
    { asset: 'TREASURY_BILL', minPercent: 3, maxPercent: 5, count: 2 }, // FIXED: Should increase
];

// Category 2: Asset Decrease Cards (12 cards)
export const ASSET_DECREASE_CARDS = [
    { asset: 'CRYPTO', minPercent: -20, maxPercent: -10, count: 3 },
    { asset: 'STOCK', minPercent: -15, maxPercent: -8, count: 3 },
    { asset: 'GOLD', minPercent: -10, maxPercent: -6, count: 2 },
    { asset: 'EURO_BOND', minPercent: -8, maxPercent: -5, count: 2 },
    { asset: 'TREASURY_BILL', minPercent: -5, maxPercent: -3, count: 2 },
];

// Category 3: Inter-Team Impact Cards (8 cards)
export const INTER_TEAM_CARDS = [
    {
        type: 'TRADE_FREEZE',
        description: 'Next team may trade only ONE asset during their turn',
        count: 2,
    },
    {
        type: 'MARKET_SHOCK',
        description: 'Next team\'s highest-value asset decreases by 10%',
        count: 2,
    },
    {
        type: 'INSIDER_INFORMATION',
        description: 'Current team is exempted from drawing a card in the next round',
        count: 2,
    },
    {
        type: 'REVERSE_IMPACT',
        description: 'The effect of the next team\'s drawn card is reversed',
        count: 2,
    },
];

// Category 4: Neutral Cards (8 cards)
export const NEUTRAL_CARDS = [
    {
        type: 'BETTER_LUCK',
        description: 'Better Luck Next Time - No impact on assets or trading conditions',
        count: 8,
    },
];

// Registration Fees
export const REGISTRATION_FEES = {
    SOLO: 30,
    DUO: 49,
    SQUAD: 75,
};

// Team Size Limits
export const TEAM_SIZE = {
    MIN: 1,
    MAX: 4,
    ROUND2_MIN: 3,
    ROUND2_MAX: 4,
};
