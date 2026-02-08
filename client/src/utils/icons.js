/**
 * Premium SVG Icon System for Market Matrix
 * Finance-focused, outline-style icons with consistent design language
 * Deep Sea theme compatible
 */

/**
 * Market Volatility Icon - Candlestick Chart
 * Represents price fluctuations and market dynamics
 */
export function getMarketVolatilityIcon(size = 48, color = '#4a7c9e') {
    return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg">
      <!-- Candlestick 1 (Bullish) -->
      <line x1="5" y1="3" x2="5" y2="21" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="3" y="8" width="4" height="8" stroke="${color}" stroke-width="1.5" fill="none" rx="0.5"/>
      
      <!-- Candlestick 2 (Bearish) -->
      <line x1="12" y1="5" x2="12" y2="19" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="10" y="7" width="4" height="6" stroke="${color}" stroke-width="1.5" fill="none" rx="0.5"/>
      
      <!-- Candlestick 3 (Bullish) -->
      <line x1="19" y1="2" x2="19" y2="18" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="17" y="6" width="4" height="9" stroke="${color}" stroke-width="1.5" fill="none" rx="0.5"/>
    </svg>
  `;
}

/**
 * Strategic Trading Icon - Chess Knight
 * Symbolizes planning, timing, and calculated moves
 */
export function getStrategicTradingIcon(size = 48, color = '#4a7c9e') {
    return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg">
      <!-- Knight piece outline -->
      <path d="M6 20h12M8 20v-2c0-1 0.5-2 1.5-3L11 13l-1-1.5c-0.5-0.5-1-1.5-1-2.5V7c0-1.5 1-3 2.5-3.5L13 3l1 1 0.5 2c0.5 0.5 1 1 1 2v1l1.5 2L19 13l1.5 2c1 1 1.5 2 1.5 3v2" 
            stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Knight ear -->
      <circle cx="14" cy="6" r="0.8" fill="${color}"/>
      <!-- Base -->
      <line x1="6" y1="20" x2="18" y2="20" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
}

/**
 * Risk Management Icon - Shield with Graph
 * Represents protection, control, and risk balancing
 */
export function getRiskManagementIcon(size = 48, color = '#4a7c9e') {
    return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg">
      <!-- Shield outline -->
      <path d="M12 3L4 6v6c0 5.5 3.5 9.5 8 11 4.5-1.5 8-5.5 8-11V6l-8-3z" 
            stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Graph line inside shield -->
      <polyline points="8,14 10,12 12,13 14,10 16,11" 
                stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <!-- Check mark accent -->
      <polyline points="9,11 10.5,12.5 13,9.5" 
                stroke="${color}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
    </svg>
  `;
}

/**
 * Register Icon - User Plus
 * Represents entry and onboarding
 */
export function getRegisterIcon(size = 32, color = '#4a7c9e') {
    return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg">
      <!-- User silhouette -->
      <circle cx="9" cy="7" r="3.5" stroke="${color}" stroke-width="1.5"/>
      <path d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6" 
            stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Plus sign -->
      <line x1="18" y1="7" x2="18" y2="13" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="15" y1="10" x2="21" y2="10" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `;
}

/**
 * Trade Icon - Exchange Arrows
 * Represents buying and selling actions
 */
export function getTradeIcon(size = 32, color = '#4a7c9e') {
    return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg">
      <!-- Up arrow (Buy) -->
      <path d="M7 16L3 12L7 8" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="3" y1="12" x2="15" y2="12" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      
      <!-- Down arrow (Sell) -->
      <path d="M17 8L21 12L17 16" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="21" y1="12" x2="9" y2="12" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `;
}

/**
 * Cards Influence Icon - Card with Lightning
 * Suggests unpredictability and impact
 */
export function getCardsInfluenceIcon(size = 32, color = '#4a7c9e') {
    return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg">
      <!-- Playing card -->
      <rect x="4" y="3" width="10" height="14" rx="1.5" 
            stroke="${color}" stroke-width="1.5"/>
      <!-- Card corner pip -->
      <circle cx="7" cy="6" r="0.8" fill="${color}"/>
      <circle cx="11" cy="14" r="0.8" fill="${color}"/>
      
      <!-- Lightning bolt -->
      <path d="M17 3L13 11h4l-4 8" 
            stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

/**
 * Market Reacts Icon - Pulse Graph
 * Represents real-time market response
 */
export function getMarketReactsIcon(size = 32, color = '#4a7c9e') {
    return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg">
      <!-- Pulse/heartbeat line -->
      <path d="M3 12h4l2-6 4 12 2-6 2 3h4" 
            stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <!-- Waveform accent circles -->
      <circle cx="9" cy="6" r="1" fill="${color}" opacity="0.6"/>
      <circle cx="13" cy="18" r="1" fill="${color}" opacity="0.6"/>
      <circle cx="17" cy="9" r="1" fill="${color}" opacity="0.6"/>
    </svg>
  `;
}

/**
 * Winners Icon - Trophy
 * Represents achievement and success
 */
export function getWinnersIcon(size = 32, color = '#4a7c9e') {
    return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg">
      <!-- Trophy cup -->
      <path d="M8 6h8v5c0 2.2-1.8 4-4 4s-4-1.8-4-4V6z" 
            stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Trophy handles -->
      <path d="M8 8H6c-1.1 0-2 0.9-2 2s0.9 2 2 2h2" 
            stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16 8h2c1.1 0 2 0.9 2 2s-0.9 2-2 2h-2" 
            stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Trophy base -->
      <line x1="12" y1="15" x2="12" y2="18" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="9" y1="18" x2="15" y2="18" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="8" y1="21" x2="16" y2="21" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      
      <!-- Laurel accent -->
      <path d="M10 6c-0.5-1-1-1.5-2-2" stroke="${color}" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
      <path d="M14 6c0.5-1 1-1.5 2-2" stroke="${color}" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
    </svg>
  `;
}
