import AnimatedBarChart from '../../components/player/AnimatedBarChart.js';
import socket from '../../utils/socket.js';
import '../../styles/graphStyles.css';

/**
 * Player Graph View
 * Full-screen animated graph for spectators
 */
export default function PlayerGraph(container) {
    let chart = null;

    function render() {
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
                        <h1 class="graph-title">Market Matrix - Asset Values</h1>
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
                    
                    <!-- R1+ Graph (Live Values) -->
                    <div class="graph-section live-graph-section">
                        <div class="graph-section-header">
                            <h2>R1+ - Live Asset Values</h2>
                            <p class="graph-subtitle">Real-time trading & card effects</p>
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
        window.removeEventListener('resize', handleResize);
    };
}
