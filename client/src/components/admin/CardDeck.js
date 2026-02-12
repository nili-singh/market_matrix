import api from '../../utils/api.js';
import socket from '../../utils/socket.js';

/**
 * Individual Card Component
 * Represents a single playing card with flip animation
 */
function Card({ index, total, isStacked, isShuffling, isDrawing, cardData, isFlipped }) {
    const card = document.createElement('div');
    card.className = 'playing-card';

    if (isStacked) {
        // Stacked deck positioning on left side
        const stackOffset = index * 2; // 2px per card to show edges
        card.style.top = `${stackOffset}px`;
        card.style.zIndex = total - index; // Top card has highest z-index

        // Slight random rotation for realism
        const rotation = (Math.random() * 2 - 1); // ±1 degree
        card.style.transform = `rotate(${rotation}deg)`;
    }

    // Add animation classes
    if (isShuffling) {
        card.classList.add('shuffling');
        // Set CSS variables for shuffle animation
        card.style.setProperty('--shuffle-y', `${(Math.random() * 60 - 30)}px`);
        card.style.setProperty('--shuffle-rotation', `${(Math.random() * 10 - 5)}deg`);
    }

    if (isDrawing) {
        card.classList.add('drawing');
    }

    if (isFlipped) {
        card.classList.add('flipped');
    }

    // Card back
    const cardBack = document.createElement('div');
    cardBack.className = 'card-back';

    // Card front (for flip animation)
    const cardFront = document.createElement('div');
    cardFront.className = 'card-front';

    if (cardData) {
        cardFront.innerHTML = `
            <div class="card-category">${formatCategory(cardData.category)}</div>
            <div class="card-title">${cardData.type || cardData.cardId}</div>
            <div class="card-description">${cardData.description || 'No description'}</div>
        `;
    }

    card.appendChild(cardBack);
    card.appendChild(cardFront);

    return card;
}

function formatCategory(category) {
    const categoryMap = {
        'ASSET_INCREASE': 'Asset ↑',
        'ASSET_DECREASE': 'Asset ↓',
        'INTER_TEAM': 'Inter-Team',
        'NEUTRAL': 'Neutral'
    };
    return categoryMap[category] || category;
}

/**
 * CardDeck Component
 * Main deck visualization with shuffle, draw, and flip interactions
 */
export default function CardDeck(container, { selectedTeamId = null, onCardDrawn = null } = {}) {
    let deckState = null;
    let isShuffling = false;
    let isDrawing = false;
    let drawnFiveCards = []; // Array of 5 previewed cards from backend (NEVER modified after draw)
    let allCards = [];
    let selectedCard = null; // The one card that was selected by user click
    let isLocked = false; // Locked after card is chosen
    let currentTeamId = selectedTeamId; // Track current team
    let cardDrawCallback = onCardDrawn; // Callback when card is drawn

    async function render() {
        try {
            // Fetch current deck state
            const response = await api.getDeckState();
            const deckData = response.deckState;
            deckState = deckData.deckState;
            allCards = deckData.cards || []; // Fix: Get cards from deckData (which contains cards array)

            const remainingCards = allCards.length;
            const hasTeamSelected = Boolean(currentTeamId);
            const canDraw = !isShuffling && !isDrawing && drawnFiveCards.length === 0 && remainingCards >= 5 && hasTeamSelected && !isLocked;
            const canShuffle = !isShuffling && !isDrawing && !isLocked;

            container.innerHTML = `
                <div class="card-deck-container">
                    <div class="card-deck ${isShuffling ? 'shuffling' : ''} ${isDrawing ? 'drawing' : ''}" id="cardDeckArea">
                        <!-- Cards will be rendered here -->
                    </div>
                    
                    <div class="deck-controls">
                        <div class="deck-info">
                            <div class="deck-stat">
                                <span class="deck-stat-label">Total Cards</span>
                                <span class="deck-stat-value">40</span>
                            </div>
                            <div class="deck-stat">
                                <span class="deck-stat-label">Remaining</span>
                                <span class="deck-stat-value" id="remainingCount">${remainingCards}</span>
                            </div>
                            <div class="deck-stat">
                                <span class="deck-stat-label">Drawn</span>
                                <span class="deck-stat-value" id="drawnCount">${drawnFiveCards.length}</span>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            ${isShuffling ? `
                                <div class="shuffle-indicator">
                                    <div class="spinner"></div>
                                    <span>Shuffling...</span>
                                </div>
                            ` : `
                                <button class="btn-shuffle" id="shuffleBtn" ${!canShuffle ? 'disabled' : ''}>
                                    🔀 Shuffle Deck
                                </button>
                            `}
                            
                            <button 
                                class="btn-shuffle" 
                                id="drawBtn" 
                                ${!canDraw ? 'disabled' : ''}
                                style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);"
                                title="${!hasTeamSelected ? 'Please select a team first' : (isLocked ? 'Locked: Card already chosen' : 'Draw 5 cards from deck')}"
                            >
                                🃏 Draw 5 Cards
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Render cards
            renderCards();

            // Event listeners
            const shuffleBtn = document.getElementById('shuffleBtn');
            if (shuffleBtn) {
                shuffleBtn.addEventListener('click', handleShuffle);
            }

            const drawBtn = document.getElementById('drawBtn');
            if (drawBtn) {
                drawBtn.addEventListener('click', handleDraw5Cards);
            }

        } catch (error) {
            console.error('Error rendering card deck:', error);
            container.innerHTML = `
                <div class="glass-card p-lg">
                    <p class="text-danger">Error loading card deck: ${error.message}</p>
                </div>
            `;
        }
    }

    // Public method to update team selection from parent
    function updateTeam(newTeamId) {
        if (newTeamId !== currentTeamId) {
            console.log(`Team changed from ${currentTeamId} to ${newTeamId} - resetting card state`);
            currentTeamId = newTeamId;
            // Reset state when team changes
            drawnFiveCards = [];
            selectedCard = null;
            isLocked = false;
            render();
        }
    }

    // Public method to update callback
    function setCardDrawCallback(callback) {
        cardDrawCallback = callback;
    }

    function renderCards() {
        const deckArea = document.getElementById('cardDeckArea');
        if (!deckArea) return;

        deckArea.innerHTML = '';

        // Render stacked deck (all remaining cards in the database that aren't drawn)
        const remainingDeckCards = allCards.filter(card => {
            // Don't show cards that are in the 5 previewed cards
            const isInDrawnFive = drawnFiveCards.some(d => d.cardId === card.cardId);
            return !isInDrawnFive;
        });

        remainingDeckCards.forEach((cardData, i) => {
            const cardElement = Card({
                index: i,
                total: remainingDeckCards.length,
                isStacked: true,
                isShuffling: isShuffling,
                isDrawing: false,
                cardData: null, // Face down
                isFlipped: false,
            });
            deckArea.appendChild(cardElement);
        });

        // Render drawn 5 cards (spread horizontally on the right, vertically centered)
        // CRITICAL: drawnFiveCards array NEVER changes after draw - only isFlipped status changes
        if (drawnFiveCards.length > 0) {
            const drawnContainer = document.createElement('div');
            drawnContainer.style.position = 'absolute';
            drawnContainer.style.left = '200px'; // Position to the right of deck
            drawnContainer.style.top = '50%';
            drawnContainer.style.transform = 'translateY(-50%)';
            drawnContainer.style.display = 'flex';
            drawnContainer.style.gap = '20px';
            drawnContainer.style.justifyContent = 'flex-start';

            drawnFiveCards.forEach((cardData, i) => {
                const cardId = cardData.cardId;

                // Check if THIS card is the selected one
                const isThisCardSelected = selectedCard && selectedCard.cardId === cardId;

                // Check if ANY card is selected (to lock others)
                const isAnyCardSelected = selectedCard !== null;
                const isThisCardLocked = isAnyCardSelected && !isThisCardSelected;

                const cardElement = Card({
                    index: i,
                    total: drawnFiveCards.length,
                    isStacked: false,
                    isShuffling: false,
                    isDrawing: isDrawing,
                    cardData: cardData,
                    isFlipped: isThisCardSelected, // Only flip if THIS card is selected
                });

                cardElement.classList.add('drawn');
                cardElement.style.position = 'relative';
                cardElement.style.left = 'auto';
                cardElement.style.transform = 'none';

                // Apply chosen/locked states
                if (isThisCardSelected) {
                    cardElement.classList.add('chosen');
                }
                if (isThisCardLocked) {
                    cardElement.classList.add('locked');
                }

                // Add click handler for flip (only if not locked)
                if (!isThisCardLocked) {
                    cardElement.addEventListener('click', () => handleCardFlip(cardData));
                    cardElement.style.cursor = 'pointer';
                } else {
                    cardElement.style.cursor = 'not-allowed';
                }

                // Animation delay for draw (staggered left to right)
                if (isDrawing) {
                    cardElement.style.animationDelay = `${i * 0.15}s`; // 150ms stagger
                    // Direct animation from deck (0,0) to final position
                    const finalX = i * 130; // 130px spacing between cards
                    cardElement.style.setProperty('--start-x', '0px');
                    cardElement.style.setProperty('--start-y', '0px');
                    cardElement.style.setProperty('--end-x', `${finalX}px`);
                    cardElement.style.setProperty('--end-y', '0px');
                }

                drawnContainer.appendChild(cardElement);
            });

            deckArea.appendChild(drawnContainer);
        }
    }

    async function handleShuffle() {
        if (isShuffling) return;

        try {
            isShuffling = true;

            // Reset drawn cards and ALL state
            drawnFiveCards = [];
            selectedCard = null;
            isLocked = false;

            // Emit shuffle event to sync with other admins
            socket.emit('deck:shuffle', {
                timestamp: new Date(),
            });

            // Re-render with shuffle animation
            await render();

            // Call shuffle API
            await api.shuffleDeck();

            // Wait for animation to complete
            setTimeout(async () => {
                isShuffling = false;
                await render();
            }, 2000);

        } catch (error) {
            console.error('Error shuffling deck:', error);
            isShuffling = false;
            alert('Failed to shuffle deck: ' + error.message);
            render();
        }
    }

    async function handleDraw5Cards() {
        if (isDrawing || drawnFiveCards.length > 0 || !currentTeamId) return;

        try {
            isDrawing = true;

            // CRITICAL: Call backend to get 5 preview cards
            console.log('Fetching 5 preview cards from backend...');
            const response = await api.previewFiveCards();
            drawnFiveCards = response.cards;
            console.log('Previewed 5 cards:', drawnFiveCards.map(c => c.cardId));

            // Re-render with drawing animation
            await render();

            // Wait for animation to complete
            setTimeout(() => {
                isDrawing = false;
                render();
            }, 1500);

        } catch (error) {
            console.error('Error drawing cards:', error);
            isDrawing = false;
            alert('Failed to draw cards: ' + error.message);
            render();
        }
    }

    async function handleCardFlip(cardData) {
        // If a card has already been chosen, don't allow any flips
        if (selectedCard || !currentTeamId) {
            console.log('Card already chosen or no team selected');
            return;
        }

        try {
            // CRITICAL: Set selectedCard to the clicked card
            // This is the ONLY place where selectedCard gets set
            selectedCard = cardData;
            isLocked = true;

            console.log(`Card ${cardData.cardId} selected, applying effect for team ${currentTeamId}...`);

            // Re-render to show flip and lock other cards immediately
            // This provides instant visual feedback before the API call
            renderCards();

            // CRITICAL: Call backend to ACTUALLY draw this specific card and apply effect
            // This is the unified action - flipping the card = drawing it
            const response = await api.drawSpecificCard(currentTeamId, cardData.cardId);

            if (response.skipped) {
                alert(response.reason);
                // Reset state if skipped
                selectedCard = null;
                isLocked = false;
                renderCards();
                return;
            }

            // Card effect applied successfully
            console.log(`✅ Card ${cardData.cardId} effect applied:`, response);

            // Notify parent component to update "Last Drawn Card"
            // This ensures the Last Drawn Card panel shows the SAME card that was flipped
            if (cardDrawCallback) {
                cardDrawCallback(response);
            }

            // CRITICAL: Only update card visuals, DON'T refetch deck state
            // Using renderCards() instead of render() preserves drawnFiveCards array
            // This ensures all 5 cards stay visible in their positions
            renderCards();

        } catch (error) {
            console.error('❌ Error applying card effect:', error);
            alert(`Failed to apply card: ${error.message}`);

            // Reset state on error
            selectedCard = null;
            isLocked = false;
            renderCards();
        }
    }

    // Listen for shuffle events from other admins
    socket.on('deck:shuffle-start', (data) => {
        if (!isShuffling) {
            isShuffling = true;
            drawnFiveCards = [];
            selectedCard = null;
            render();

            setTimeout(() => {
                isShuffling = false;
                render();
            }, 2000);
        }
    });

    // Listen for deck state updates
    socket.on('deck:state', (data) => {
        deckState = data;
        render();
    });

    // Listen for game reset
    socket.on('game:reset', () => {
        console.log('Game reset - clearing deck state');
        drawnFiveCards = [];
        selectedCard = null;
        isLocked = false;
        render();
    });

    // Initial render
    render();

    // Return cleanup function and public methods
    return {
        cleanup: () => {
            socket.off('deck:shuffle-start');
            socket.off('deck:state');
            socket.off('game:reset');
        },
        updateTeam: updateTeam
    };
}
