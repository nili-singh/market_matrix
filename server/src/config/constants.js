// Game Configuration Constants

export const GAME_CONFIG = {
    INITIAL_BALANCE: 100000, // ₹1,00,000
    MIN_ROUNDS: 1,
    MAX_ROUNDS: 20,
    MAX_QUALIFIED_TEAMS: 10,
};

// Asset Base Values and Trading Thresholds
export const ASSETS = {
    CRYPTO: {
        name: 'Crypto Token',
        baseValue: 200,  // Updated from 250 to 200 points
        buyThreshold: 100,  // Buy 100 units → +25%
        sellThreshold: 80, // Resell 80 units → -25%
        priceChangePercent: 25,  // Updated from 10% to 25%
    },
    STOCK: {
        name: 'Stock',
        baseValue: 250,  // Updated from 300 to 250 points
        buyThreshold: 100,
        sellThreshold: 80,
        priceChangePercent: 25,
    },
    GOLD: {
        name: 'Gold Coin',
        baseValue: 300,  // Updated from 340 to 300 points
        buyThreshold: 100,
        sellThreshold: 80,
        priceChangePercent: 25,
    },
    EURO_BOND: {
        name: 'Euro Bond',
        baseValue: 350,  // Updated from 750 to 350 points
        buyThreshold: 100,
        sellThreshold: 80,
        priceChangePercent: 25,
    },
    TREASURY_BILL: {
        name: 'Treasury Bill',
        baseValue: 400,  // Updated from 900 to 400 points
        buyThreshold: 100,
        sellThreshold: 80,
        priceChangePercent: 25,
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
    { asset: 'CRYPTO', minPercent: 30, maxPercent: 30, count: 3 },
    { asset: 'STOCK', minPercent: 35, maxPercent: 35, count: 3 },
    { asset: 'GOLD', minPercent: 45, maxPercent: 45, count: 2 },
    { asset: 'EURO_BOND', minPercent: 40, maxPercent: 40, count: 2 },
    { asset: 'TREASURY_BILL', minPercent: 45, maxPercent: 45, count: 2 },
];

// Category 2: Asset Decrease Cards (12 cards)
export const ASSET_DECREASE_CARDS = [
    { asset: 'CRYPTO', minPercent: -45, maxPercent: -45, count: 3 },
    { asset: 'STOCK', minPercent: -30, maxPercent: -30, count: 3 },
    { asset: 'GOLD', minPercent: -35, maxPercent: -35, count: 2 },
    { asset: 'EURO_BOND', minPercent: -30, maxPercent: -30, count: 2 },
    { asset: 'TREASURY_BILL', minPercent: -40, maxPercent: -40, count: 2 },
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
