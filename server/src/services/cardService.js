import Card from '../models/Card.js';
import GameState from '../models/GameState.js';
import Team from '../models/Team.js';
import assetService from './assetService.js';
import {
    ASSET_INCREASE_CARDS,
    ASSET_DECREASE_CARDS,
    INTER_TEAM_CARDS,
    NEUTRAL_CARDS,
} from '../config/constants.js';

class CardService {
    /**
     * Initialize all 40 cards in the database
     */
    async initializeCards() {
        const cards = [];
        let cardCounter = 1;

        // Category 1: Asset Increase Cards (12 cards)
        for (const cardDef of ASSET_INCREASE_CARDS) {
            for (let i = 0; i < cardDef.count; i++) {
                cards.push({
                    cardId: `CARD_${cardCounter++}`,
                    category: 'ASSET_INCREASE',
                    type: `${cardDef.asset}_INCREASE`,
                    description: `${cardDef.asset} value increases by ${cardDef.minPercent}% to ${cardDef.maxPercent}%`,
                    targetAsset: cardDef.asset,
                    percentageChange: {
                        min: cardDef.minPercent,
                        max: cardDef.maxPercent,
                    },
                    isDrawn: false,
                });
            }
        }

        // Category 2: Asset Decrease Cards (12 cards)
        for (const cardDef of ASSET_DECREASE_CARDS) {
            for (let i = 0; i < cardDef.count; i++) {
                cards.push({
                    cardId: `CARD_${cardCounter++}`,
                    category: 'ASSET_DECREASE',
                    type: `${cardDef.asset}_DECREASE`,
                    description: `${cardDef.asset} value decreases by ${Math.abs(cardDef.maxPercent)}%`,
                    targetAsset: cardDef.asset,
                    percentageChange: {
                        min: cardDef.minPercent,
                        max: cardDef.maxPercent,
                    },
                    isDrawn: false,
                });
            }
        }

        // Category 3: Inter-Team Impact Cards (8 cards)
        for (const cardDef of INTER_TEAM_CARDS) {
            for (let i = 0; i < cardDef.count; i++) {
                cards.push({
                    cardId: `CARD_${cardCounter++}`,
                    category: 'INTER_TEAM',
                    type: cardDef.type,
                    description: cardDef.description,
                    specialEffect: cardDef.type,
                    isDrawn: false,
                });
            }
        }

        // Category 4: Neutral Cards (8 cards)
        for (const cardDef of NEUTRAL_CARDS) {
            for (let i = 0; i < cardDef.count; i++) {
                cards.push({
                    cardId: `CARD_${cardCounter++}`,
                    category: 'NEUTRAL',
                    type: cardDef.type,
                    description: cardDef.description,
                    isDrawn: false,
                });
            }
        }

        // Clear existing cards and insert new ones
        await Card.deleteMany({});
        return Card.insertMany(cards);
    }

    /**
     * Shuffle card deck (before even rounds)
     * Only shuffles cards that haven't been drawn yet
     */
    async shuffleDeck(currentRound) {
        let gameState = await GameState.findById('GAME_STATE');

        // Create GameState if it doesn't exist
        if (!gameState) {
            gameState = new GameState({
                _id: 'GAME_STATE',
                currentRound: 0,
                currentPhase: 'REGISTRATION',
                cardDeck: [],
                drawnCards: [],
                nextTeamEffects: {
                    tradeFrozen: false,
                    marketShock: false,
                    reverseImpact: false,
                },
            });
        }

        // Auto-initialize cards if they don't exist
        const cardCount = await Card.countDocuments();
        if (cardCount === 0) {
            console.log('No cards found, initializing deck...');
            await this.initializeCards();
        }

        // Get all cards that haven't been drawn
        const allCards = await Card.find({ isDrawn: false });
        const shuffled = this.shuffleArray([...allCards]);

        // Generate random positions and rotations for shuffle animation
        const deckState = {
            positions: shuffled.map((card, index) => ({
                cardId: card.cardId,
                x: index * 2, // Slight horizontal offset for overlapping
                y: 0,
                rotation: Math.random() * 8 - 4, // Random rotation ±4 degrees
                zIndex: index,
            })),
            isShuffling: false,
            lastShuffleTimestamp: new Date(),
        };

        gameState.cardDeck = shuffled.map(card => card._id);
        gameState.currentCardIndex = 0;
        gameState.lastShuffleRound = currentRound;
        gameState.deckState = deckState;
        await gameState.save();

        console.log(`Deck shuffled: ${shuffled.length} cards`);

        return { shuffled, deckState };
    }

    /**
     * Draw a card for a team
     */
    async drawCard(teamId, currentRound) {
        const team = await Team.findById(teamId);
        if (!team) throw new Error('Team not found');

        // Check if team has insider information (skip card draw)
        if (team.hasInsiderInfo) {
            team.hasInsiderInfo = false;
            await team.save();
            return { skipped: true, reason: 'Insider Information - Card draw skipped' };
        }

        const gameState = await GameState.findById('GAME_STATE');
        if (!gameState || !gameState.cardDeck.length) {
            throw new Error('Card deck not initialized');
        }

        // Get next card from deck
        const cardId = gameState.cardDeck[gameState.currentCardIndex];
        const card = await Card.findById(cardId);

        // Mark card as drawn
        card.isDrawn = true;
        await card.save();

        // Add to drawn cards list
        if (!gameState.drawnCards.includes(cardId)) {
            gameState.drawnCards.push(cardId);
        }

        // Advance card index (loop back if at end)
        gameState.currentCardIndex = (gameState.currentCardIndex + 1) % gameState.cardDeck.length;
        await gameState.save();

        return { card, skipped: false };
    }

    /**
     * Preview 5 random cards from deck WITHOUT drawing them
     * Used for the 5-card selection mechanic
     */
    async previewFiveCards() {
        // Get all undrawn cards
        const availableCards = await Card.find({ isDrawn: false });

        if (availableCards.length < 5) {
            throw new Error(`Not enough cards in deck. Available: ${availableCards.length}, Need: 5`);
        }

        // Shuffle and take first 5
        const shuffled = this.shuffleArray(availableCards);
        const fiveCards = shuffled.slice(0, 5);

        // Return card details (but don't mark as drawn yet)
        return fiveCards.map(card => ({
            _id: card._id,
            cardId: card.cardId,
            category: card.category,
            type: card.type,
            description: card.description,
            targetAsset: card.targetAsset,
            percentageChange: card.percentageChange,
            specialEffect: card.specialEffect
        }));
    }

    /**
     * Draw a SPECIFIC card by ID (used when player selects from 5 previewed)
     */
    async drawSpecificCard(teamId, cardId) {
        const team = await Team.findById(teamId);
        if (!team) throw new Error('Team not found');

        // Check if team has insider information (skip card draw)
        if (team.hasInsiderInfo) {
            team.hasInsiderInfo = false;
            await team.save();
            return { skipped: true, reason: 'Insider Information - Card draw skipped' };
        }

        // Find the specific card
        const card = await Card.findOne({ cardId: cardId, isDrawn: false });

        if (!card) {
            throw new Error(`Card ${cardId} not found or already drawn`);
        }

        // Mark card as drawn
        card.isDrawn = true;
        await card.save();

        // Add to game state drawn cards
        const gameState = await GameState.findById('GAME_STATE');
        if (gameState && !gameState.drawnCards.includes(card._id)) {
            gameState.drawnCards.push(card._id);
            await gameState.save();
        }

        console.log(`Specific card drawn: ${cardId} for team ${teamId}`);

        return { card, skipped: false };
    }

    /**
     * Apply card effect
     */
    async applyCardEffect(card, teamId, currentRound, nextTeamId = null) {
        const results = {
            assetChanges: [],
            teamEffects: [],
            nextTeamEffects: [],
        };

        const gameState = await GameState.findById('GAME_STATE');

        // Check if reverse impact is active
        const shouldReverse = gameState?.nextTeamEffects?.reverseImpact || false;
        if (shouldReverse) {
            gameState.nextTeamEffects.reverseImpact = false;
            await gameState.save();
        }

        switch (card.category) {
            case 'ASSET_INCREASE':
            case 'ASSET_DECREASE': {
                // Random percentage within range
                const { min, max } = card.percentageChange;
                let percentChange = Math.random() * (max - min) + min;

                // Reverse if reverse impact is active
                if (shouldReverse) {
                    percentChange = -percentChange;
                }

                const asset = await assetService.applyCardEffect(
                    card.targetAsset,
                    percentChange,
                    currentRound
                );

                results.assetChanges.push({
                    asset: card.targetAsset,
                    oldValue: asset.currentValue / (1 + percentChange / 100),
                    newValue: asset.currentValue,
                    percentChange,
                });
                break;
            }

            case 'INTER_TEAM': {
                switch (card.specialEffect) {
                    case 'TRADE_FREEZE':
                        if (gameState && nextTeamId) {
                            gameState.nextTeamEffects.tradeFrozen = true;
                            await gameState.save();
                            results.nextTeamEffects.push('Next team can trade only ONE asset');
                        }
                        break;

                    case 'MARKET_SHOCK':
                        if (gameState && nextTeamId) {
                            gameState.nextTeamEffects.marketShock = true;
                            await gameState.save();
                            results.nextTeamEffects.push('Next team\'s highest asset will decrease by 10%');
                        }
                        break;

                    case 'INSIDER_INFORMATION': {
                        const team = await Team.findById(teamId);
                        if (team) {
                            team.hasInsiderInfo = true;
                            await team.save();
                            results.teamEffects.push('This team will skip card draw next round');
                        }
                        break;
                    }

                    case 'REVERSE_IMPACT':
                        if (gameState) {
                            gameState.nextTeamEffects.reverseImpact = true;
                            await gameState.save();
                            results.nextTeamEffects.push('Next team\'s card effect will be REVERSED');
                        }
                        break;
                }
                break;
            }

            case 'NEUTRAL':
                results.teamEffects.push('No effect');
                break;
        }

        return results;
    }

    /**
     * Apply market shock to next team (decrease highest asset by 10%)
     */
    async applyMarketShock(teamId, currentRound) {
        const team = await Team.findById(teamId);
        if (!team) return null;

        // Find highest value asset
        let highestAsset = null;
        let highestValue = 0;

        for (const [assetType, quantity] of Object.entries(team.assets)) {
            if (quantity > 0) {
                const asset = await assetService.getAllAssets();
                const assetData = asset.find(a => a.assetType === assetType);
                const value = assetData.currentValue * quantity;

                if (value > highestValue) {
                    highestValue = value;
                    highestAsset = assetType;
                }
            }
        }

        if (highestAsset) {
            await assetService.applyCardEffect(highestAsset, -10, currentRound);
            return { asset: highestAsset, percentChange: -10 };
        }

        return null;
    }

    /**
     * Get current deck state for visualization
     */
    async getDeckState() {
        const gameState = await GameState.findById('GAME_STATE');
        if (!gameState) return null;

        const cards = await Card.find({ isDrawn: false }).select('cardId category type');

        return {
            totalCards: cards.length,
            drawnCards: gameState.drawnCards.length,
            remainingCards: cards.length,
            deckState: gameState.deckState,
            cards: cards,
        };
    }

    /**
     * Set shuffle status (for animation sync)
     */
    async setShuffleStatus(isShuffling) {
        const gameState = await GameState.findById('GAME_STATE');
        if (gameState) {
            gameState.deckState.isShuffling = isShuffling;
            await gameState.save();
        }
    }

    /**
     * Shuffle array (Fisher-Yates algorithm)
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

export default new CardService();
