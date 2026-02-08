import AnimatedBarChart from '../../components/player/AnimatedBarChart.js';
import socket from '../../utils/socket.js';

// Import graph styles
const graphStyles = document.createElement('link');
graphStyles.rel = 'stylesheet';
graphStyles.href = '/src/styles/graphStyles.css';
document.head.appendChild(graphStyles);

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
                        <h1 class="graph-title">Market Matrix - Live Asset Values</h1>
                    </div>
                    <div class="live-indicator">
                        <span class="pulse-dot"></span>
                        <span>LIVE</span>
                    </div>
                </header>
                
                <div id="chartContainer" class="chart-wrapper"></div>
                
                <footer class="graph-footer">
                    <p>Real-time asset value tracking</p>
                </footer>
            </div>
        `;

        // Initialize chart after DOM is fully rendered
        requestAnimationFrame(() => {
            const chartContainer = document.getElementById('chartContainer');
            if (chartContainer) {
                // Wait one more frame to ensure layout is complete
                requestAnimationFrame(() => {
                    chart = AnimatedBarChart(chartContainer, {
                        width: chartContainer.clientWidth,
                        height: chartContainer.clientHeight,
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
