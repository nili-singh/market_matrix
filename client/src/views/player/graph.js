import AnimatedBarChart from '../../components/player/AnimatedBarChart.js';
import socket from '../../utils/socket.js';
import api from '../../utils/api.js';
import '../../styles/graphStyles.css';

/**
 * Player Graph View
 * Full-screen animated graph for spectators
 * Only shows when Round 2 starts (showing Round 1 data)
 */
export default function PlayerGraph(container) {
    let chart = null;
    let currentRound = 0;

    async function fetchGameState() {
        try {
            const response = await api.request('/api/game-state');
            currentRound = response.gameState?.currentRound || 0;
        } catch (error) {
            console.error('Error fetching game state:', error);
            currentRound = 0;
        }
    }

    async function render() {
        // Fetch current round
        await fetchGameState();

        // Only show graph if we're in Round 1 or later
        if (currentRound < 1) {
            container.innerHTML = `
                <div class="player-graph-container">
                    <header class="graph-header">
                        <div class="header-left">
                            <button class="back-home-btn" onclick="window.navigateTo('/')">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                                </svg>
                                Back to Home
                            </button>
                        </div>
                    </header>

                    <div style="display: flex; align-items: center; justify-content: center; flex: 1; padding: 2rem;">
                        <div style="text-align: center; max-width: 600px;">
                            <h2 style="font-size: 2rem; color: #fff; margin-bottom: 1rem;">Graph Not Available Yet</h2>
                            <p style="font-size: 1.125rem; color: #9CA3AF; margin-bottom: 2rem;">
                                The asset value graph will be available once <strong>Round 1</strong> begins.
                            </p>
                            <p style="font-size: 1rem; color: #6B7280;">
                                Current Round: <strong style="color: #880d1e; font-size: 1.5rem;">Round ${currentRound === 0 ? '0' : currentRound}</strong>
                            </p>
                            <p style="font-size: 0.875rem; color: #6B7280; margin-top: 1rem;">
                                Please wait for the game to start...
                            </p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        // Show graph (Round 1+)
        container.innerHTML = `
            <div class="player-graph-container">
                <header class="graph-header">
                    <div class="header-left">
                        <button class="back-home-btn" onclick="window.navigateTo('/')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                            Back to Home
                        </button>
                        <h1 class="graph-title">Market Matrix - Asset Values (Round ${currentRound})</h1>
                    </div>
                    <div class="live-indicator">
                        <img src="/assets/logo.jpeg" alt="TYCOONS" style="height: 40px; margin-right: 1rem;" />
                        <span class="pulse-dot"></span>
                        <span>LIVE</span>
                    </div>
                </header>

                <div class="dual-graph-layout">
                    <!-- R0 Graph (Base Values) -->
                    <div class="graph-section base-graph-section">
                        <div class="graph-section-header">
                            <h2>R0 - Base Asset Values</h2>
                            <p class="graph-subtitle">Initial starting values (constant)</p>
                        </div>
                        <div id="baseChartContainer" class="chart-wrapper"></div>
                    </div>

                    <!-- Current Round Graph (Live Values) -->
                    <div class="graph-section live-graph-section">
                        <div class="graph-section-header">
                            <h2>R${currentRound} - Current Round Values</h2>
                            <p class="graph-subtitle">Live trading & card effects</p>
                        </div>
                        <div id="liveChartContainer" class="chart-wrapper"></div>
                    </div>
                </div>
            </div>
        `;

        // Initialize both charts after DOM is fully rendered
        requestAnimationFrame(() => {
            const baseContainer = document.getElementById('baseChartContainer');
            const liveContainer = document.getElementById('liveChartContainer');

            if (baseContainer && liveContainer) {
                // Wait one more frame to ensure layout is complete
                requestAnimationFrame(() => {
                    // Initialize R0 chart (base values)
                    const baseChart = AnimatedBarChart(baseContainer, {
                        width: baseContainer.clientWidth,
                        height: baseContainer.clientHeight,
                        mode: 'base', // new mode for base values
                    });

                    // Initialize R1+ chart (live values)
                    chart = AnimatedBarChart(liveContainer, {
                        width: liveContainer.clientWidth,
                        height: liveContainer.clientHeight,
                        mode: 'live', // existing behavior
                    });
                });
            }
        });

        // Subscribe to graph updates
        socket.emit('graph:subscribe');
    }

    // Listen for round changes
    socket.on('round:change', (data) => {
        console.log('Round changed:', data);
        currentRound = data.currentRound;
        render(); // Re-render when round changes
    });

    // Handle window resize
    function handleResize() {
        if (chart) {
            chart.destroy();
        }
        render();
    }

    window.addEventListener('resize', handleResize);

    // Initial render
    render();

    // Cleanup
    return () => {
        if (chart) {
            chart.destroy();
        }
        socket.off('round:change');
        window.removeEventListener('resize', handleResize);
    };
}
