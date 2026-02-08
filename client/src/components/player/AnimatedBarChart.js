import api from '../../utils/api.js';
import socket from '../../utils/socket.js';

/**
 * AnimatedBarChart Component
 * Canvas-based animated vertical bar chart for asset visualization
 */
export default function AnimatedBarChart(container, options = {}) {
    const {
        width = container.clientWidth || 1200,
        height = container.clientHeight || 600,
        padding = { top: 60, right: 40, bottom: 80, left: 80 },
        animationDuration = 800, // ms
        barSpacing = 0.3, // 30% spacing between bars
        mode = 'live', // 'base' for R0, 'live' for R1+
    } = options;

    let canvas, ctx;
    let actualWidth, actualHeight; // Track actual canvas dimensions
    let graphData = {
        rounds: [],
        assets: {},
    };
    let animationFrameId = null;
    let currentAnimations = {};

    // Asset colors - vibrant palette for dark theme
    const assetColors = {
        'GOLD': '#FFD700',           // Bright Gold/Yellow
        'STOCK': '#8B9556',          // Olive Green
        'CRYPTO': '#3B82F6',         // Electric Blue
        'EURO_BOND': '#B85450',      // Brick Red
        'TREASURY_BILL': '#FFB6D9',  // Baby Pink
    };

    // Bar spacing for better separation
    const barGap = 20; // pixels between bars

    // Initialize canvas
    function init() {
        // Get actual container dimensions
        const containerWidth = container.clientWidth || width;
        const containerHeight = container.clientHeight || height;

        // Generate unique IDs for this chart instance to prevent conflicts
        const uniqueId = `graphCanvas_${Math.random().toString(36).substr(2, 9)}`;
        const tooltipId = `tooltip_${Math.random().toString(36).substr(2, 9)}`;

        container.innerHTML = `
            <div style="position: relative; width: 100%; height: 100%;">
                <canvas id="${uniqueId}" style="display: block; width: 100%; height: 100%;"></canvas>
                <div id="${tooltipId}" style="
                    position: absolute;
                    display: none;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    pointer-events: none;
                    z-index: 1000;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                "></div>
            </div>
        `;

        canvas = document.getElementById(uniqueId);
        ctx = canvas.getContext('2d');

        // Store tooltip ID for later use
        canvas.tooltipId = tooltipId;

        // Set canvas size with device pixel ratio for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        actualWidth = containerWidth;
        actualHeight = containerHeight;

        canvas.width = actualWidth * dpr;
        canvas.height = actualHeight * dpr;
        canvas.style.width = `${actualWidth}px`;
        canvas.style.height = `${actualHeight}px`;
        ctx.scale(dpr, dpr);

        // Add mouse move listener for tooltips
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', hideTooltip);

        // Fetch initial data
        fetchGraphData();

        // Subscribe to real-time updates only for live mode
        if (mode === 'live') {
            socket.on('asset:update', handleAssetUpdate);
            socket.on('graph:update', () => {
                fetchGraphData();
            });
        }
    }

    async function fetchGraphData() {
        try {
            console.log(`Fetching graph data for mode: ${mode}...`);
            const response = await api.getAssetHistory();
            console.log('API Response:', response);
            console.log('Graph Data:', response.data);

            if (!response || !response.data) {
                throw new Error('Invalid response format');
            }

            // Handle base mode (R0 only)
            if (mode === 'base') {
                const baseRound = response.data.baseValueRound;
                if (!baseRound) {
                    throw new Error('Base value round data not found');
                }

                // Create graph data with only R0
                graphData = {
                    rounds: [0],
                    assets: {},
                };

                // Build assets structure from base values
                Object.keys(baseRound.values).forEach(assetType => {
                    const assetInfo = response.data.assets[assetType];
                    graphData.assets[assetType] = {
                        name: assetInfo.name,
                        currentValue: baseRound.values[assetType],
                        baseValue: baseRound.values[assetType],
                        color: assetInfo.color,
                        history: [{
                            round: 0,
                            value: baseRound.values[assetType],
                            timestamp: new Date(),
                            event: 'base'
                        }]
                    };
                });
            } else {
                // Handle live mode (R1+)
                console.log('===== R1+ GRAPH DEBUG =====');
                console.log('Raw API Response:', JSON.stringify(response.data, null, 2));

                graphData = response.data;

                console.log('graphData.rounds BEFORE filtering:', graphData.rounds);
                console.log('graphData.assets BEFORE filtering:', Object.keys(graphData.assets));

                // Filter: R1+ should only show rounds >= 1
                // Keep all rounds from 1 onwards
                if (graphData.rounds && graphData.rounds.length > 0) {
                    // Filter to only include rounds >= 1
                    graphData.rounds = graphData.rounds.filter(r => r >= 1);

                    // Also filter asset histories to only include rounds >= 1
                    Object.keys(graphData.assets).forEach(assetType => {
                        if (graphData.assets[assetType].history) {
                            console.log(`${assetType} history BEFORE filter:`, graphData.assets[assetType].history);
                            graphData.assets[assetType].history =
                                graphData.assets[assetType].history.filter(h => h.round >= 1);
                            console.log(`${assetType} history AFTER filter:`, graphData.assets[assetType].history);
                        }
                    });
                }

                // If no rounds >= 1, show placeholder
                if (!graphData.rounds || graphData.rounds.length === 0) {
                    console.log('No rounds >= 1 found. Game might not have started yet.');
                    console.log('Full API response:', response.data);
                    console.log('Available rounds in response:', response.data.rounds);
                }

                console.log('Live mode - Filtered rounds:', graphData.rounds);
                console.log('Live mode - Assets:', Object.keys(graphData.assets));
                console.log('===== END R1+ DEBUG =====');
            }

            console.log(`Graph data set successfully for ${mode} mode`);
            console.log(`Final rounds to display:`, graphData.rounds);
            console.log(`Final assets:`, Object.keys(graphData.assets || {}));
            render();
        } catch (error) {
            console.error('Error fetching graph data:', error);
            console.error('Error details:', error.message, error.stack);
            renderError('Failed to load graph data');
        }
    }

    function handleAssetUpdate(data) {
        // Update graph data with new values
        if (data.assets) {
            data.assets.forEach(asset => {
                if (graphData.assets[asset.assetType]) {
                    const currentRound = graphData.rounds[graphData.rounds.length - 1] || 0;

                    // Animate to new value
                    animateValue(
                        asset.assetType,
                        graphData.assets[asset.assetType].currentValue,
                        asset.currentValue
                    );

                    // Update current value
                    graphData.assets[asset.assetType].currentValue = asset.currentValue;

                    // Add to history
                    graphData.assets[asset.assetType].history.push({
                        round: currentRound + 1,
                        value: asset.currentValue,
                        timestamp: new Date(),
                    });
                }
            });

            // Add new round if needed
            const newRound = (graphData.rounds[graphData.rounds.length - 1] || 0) + 1;
            if (!graphData.rounds.includes(newRound)) {
                graphData.rounds.push(newRound);
            }

            render();
        }
    }

    function animateValue(assetType, fromValue, toValue) {
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / animationDuration, 1);

            // Ease-in-out function
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            currentAnimations[assetType] = fromValue + (toValue - fromValue) * eased;

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
                render();
            } else {
                delete currentAnimations[assetType];
            }
        };
        animate();
    }

    function render() {
        console.log('===== RENDER CALLED =====');
        console.log('graphData.rounds:', graphData.rounds);
        console.log('graphData.assets keys:', Object.keys(graphData.assets || {}));
        console.log('ctx exists:', !!ctx);
        console.log('actualWidth:', actualWidth);
        console.log('actualHeight:', actualHeight);

        if (!ctx || !actualWidth || !actualHeight) return;

        // Clear canvas
        ctx.clearRect(0, 0, actualWidth, actualHeight);

        // CRITICAL: Clear bar data array to prevent tooltip mapping bugs
        // This ensures each render creates a fresh mapping of bars to assetTypes
        canvas.barData = [];

        // Draw dark background with gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 0, actualHeight);
        bgGradient.addColorStop(0, '#0a0a0a');    // Near black at top
        bgGradient.addColorStop(1, '#000000');    // Pure black at bottom
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, actualWidth, actualHeight);

        if (!graphData.rounds || graphData.rounds.length === 0) {
            console.log('SHOWING PLACEHOLDER - rounds empty');
            renderPlaceholder();
            return;
        }

        const chartWidth = actualWidth - padding.left - padding.right;
        const chartHeight = actualHeight - padding.top - padding.bottom;

        // Fixed Y-axis range: 100 to 800
        const assetTypes = Object.keys(graphData.assets);
        const minValue = 100;
        const maxValue = 800;
        const yScale = chartHeight / (maxValue - minValue);

        const roundCount = graphData.rounds.length;
        const groupWidth = chartWidth / roundCount;

        // Calculate bar width with spacing - reduced to 50% of original
        const totalBarsPerRound = assetTypes.length;
        const totalGapSpace = barGap * (totalBarsPerRound - 1);
        const availableWidth = (groupWidth * (1 - barSpacing)) - totalGapSpace;
        const barWidth = (availableWidth / totalBarsPerRound) * 0.5; // 50% width

        // Draw axes
        drawAxes(chartWidth, chartHeight, maxValue, minValue, yScale);

        // Draw bars for each round
        console.log('Starting to draw bars...');
        console.log('roundCount:', roundCount);
        console.log('assetTypes:', assetTypes);

        graphData.rounds.forEach((round, roundIndex) => {
            console.log(`\n--- Drawing round ${round} (index ${roundIndex}) ---`);
            const groupX = padding.left + roundIndex * groupWidth;

            assetTypes.forEach((assetType, assetIndex) => {
                const history = graphData.assets[assetType].history;
                console.log(`  ${assetType} history:`, history);

                const dataPoint = history.find(h => h.round === round);
                console.log(`  ${assetType} dataPoint for round ${round}:`, dataPoint);

                if (dataPoint) {
                    console.log(`  ✓ Drawing bar for ${assetType}`);
                    const value = currentAnimations[assetType] !== undefined
                        ? currentAnimations[assetType]
                        : dataPoint.value;

                    // Ensure value is within range
                    const clampedValue = Math.max(100, Math.min(800, value));
                    const barHeight = (clampedValue - 100) * yScale; // Adjust for min value of 100
                    // Center bars within their allocated space
                    const barOffset = (availableWidth / totalBarsPerRound - barWidth) / 2;
                    const barX = groupX + (barWidth * assetIndex) + (barGap * assetIndex) + (groupWidth * barSpacing / 2) + barOffset;
                    const barY = padding.top + chartHeight - barHeight;


                    console.log(`    Bar coords: x=${barX.toFixed(1)}, y=${barY.toFixed(1)}, width=${barWidth.toFixed(1)}, height=${barHeight.toFixed(1)}, value=${clampedValue}`);

                    // Draw bar with gradient
                    const color = graphData.assets[assetType].color;
                    const barGradient = ctx.createLinearGradient(barX, barY + barHeight, barX, barY);
                    barGradient.addColorStop(0, color);
                    barGradient.addColorStop(1, adjustColorBrightness(color, 30));

                    ctx.fillStyle = barGradient;
                    ctx.fillRect(barX, barY, barWidth, barHeight);
                    console.log(`    ✅ fillRect called with color ${color}`);

                    // Store bar data for tooltip
                    canvas.barData.push({
                        x: barX,
                        y: barY,
                        width: barWidth,
                        height: barHeight,
                        assetType: assetType,
                        round: round,
                        value: value
                    });
                }
            });
        });

        // Draw legend
        drawLegend(assetTypes);
    }

    function drawAxes(chartWidth, chartHeight, maxValue, minValue, yScale) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'; // Very soft, low opacity
        ctx.lineWidth = 1;

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + chartHeight);
        ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        ctx.stroke();

        // Y-axis arrow (subtle)
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.beginPath();
        ctx.moveTo(padding.left - 5, padding.top + 10);
        ctx.lineTo(padding.left, padding.top);
        ctx.lineTo(padding.left + 5, padding.top + 10);
        ctx.stroke();

        // X-axis arrow (subtle)
        ctx.beginPath();
        ctx.moveTo(padding.left + chartWidth - 10, padding.top + chartHeight - 5);
        ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        ctx.lineTo(padding.left + chartWidth - 10, padding.top + chartHeight + 5);
        ctx.stroke();

        // Y-axis labels (muted light grey) - 100, 200, 300... 800
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '13px Inter, sans-serif';
        ctx.textAlign = 'right';
        const ySteps = 7; // 100, 200, 300, 400, 500, 600, 700, 800
        for (let i = 0; i <= ySteps; i++) {
            const value = 100 + (100 * i); // 100, 200, 300... 800
            const y = padding.top + chartHeight - ((value - 100) * yScale);
            ctx.fillText(`${value}`, padding.left - 10, y + 5);

            // Grid lines (very soft, low opacity)
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();
        }

        // X-axis labels (rounds) - muted light grey
        ctx.textAlign = 'center';
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '13px Inter, sans-serif';
        graphData.rounds.forEach((round, index) => {
            const x = padding.left + (chartWidth / graphData.rounds.length) * (index + 0.5);
            ctx.fillText(`R${round}`, x, padding.top + chartHeight + 25);
        });

        // Axis titles (light grey)
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.fillStyle = '#D1D5DB';

        // Y-axis title
        ctx.save();
        ctx.translate(20, padding.top + chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Asset Value (points)', 0, 0);
        ctx.restore();

        // X-axis title
        ctx.textAlign = 'center';
        ctx.fillText('Round', padding.left + chartWidth / 2, actualHeight - 20);
    }

    function drawBar(x, y, width, height, color, assetType, round, value) {
        // 3D Shadow effect - soft drop shadow with horizontal offset
        const shadowColor = color + '40'; // Bar color with low opacity
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 4;  // Right offset
        ctx.shadowOffsetY = 6;  // Down offset

        // Create gradient for 3D effect (lighter left, darker right)
        const barGradient = ctx.createLinearGradient(x, y, x + width, y);
        const lighterColor = adjustBrightness(color, 20);  // Lighter on left
        const darkerColor = adjustBrightness(color, -15);  // Darker on right
        barGradient.addColorStop(0, lighterColor);
        barGradient.addColorStop(0.5, color);
        barGradient.addColorStop(1, darkerColor);

        // Rectangle bar (no rounded corners)
        ctx.fillStyle = barGradient;
        ctx.fillRect(x, y, width, height);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Add subtle highlight on top edge for extra depth
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.stroke();

        // Store bar data for tooltips
        if (!canvas.barData) canvas.barData = [];
        canvas.barData.push({ x, y, width, height, assetType, round, value });
    }

    // Helper function to adjust color brightness
    function adjustBrightness(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    function drawLegend(assetTypes) {
        // Position legend in top-right corner, OUTSIDE the chart area
        const legendWidth = 160;
        const itemHeight = 36;
        const boxSize = 24;
        const labelOffset = 34;

        // Position completely to the right of the chart area
        const legendX = actualWidth - legendWidth - 20;
        const legendY = padding.top;
        const legendHeight = assetTypes.length * itemHeight + 20;

        // Draw semi-transparent background for legend
        ctx.fillStyle = 'rgba(15, 17, 23, 0.85)';
        ctx.fillRect(legendX - 10, legendY - 10, legendWidth, legendHeight);

        // Border for legend box
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX - 10, legendY - 10, legendWidth, legendHeight);

        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'left';

        assetTypes.forEach((assetType, index) => {
            const y = legendY + index * itemHeight;

            // Color box with subtle shadow
            ctx.shadowColor = assetColors[assetType] + '60';
            ctx.shadowBlur = 6;
            ctx.fillStyle = assetColors[assetType];
            ctx.fillRect(legendX, y, boxSize, boxSize);

            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // Label (light grey for dark theme)
            ctx.fillStyle = '#E5E7EB';
            const name = graphData.assets[assetType].name;
            ctx.fillText(name, legendX + labelOffset, y + 17);
        });
    }

    function renderPlaceholder() {
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '20px Inter, sans-serif';
        ctx.textAlign = 'center';

        if (mode === 'base') {
            ctx.fillText('Loading base values...', actualWidth / 2, actualHeight / 2);
        } else {
            // Live mode
            ctx.fillText('No game data yet', actualWidth / 2, actualHeight / 2 - 20);
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#6B7280';
            ctx.fillText('Start Round 2 and make trades to see data', actualWidth / 2, actualHeight / 2 + 10);
        }
    }

    function renderError(message) {
        ctx.fillStyle = '#F87171';
        ctx.font = '18px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(message, actualWidth / 2, actualHeight / 2);
    }

    function handleMouseMove(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (!canvas.barData) return;

        // Find bar under cursor
        const bar = canvas.barData.find(b =>
            x >= b.x && x <= b.x + b.width &&
            y >= b.y && y <= b.y + b.height
        );

        if (bar) {
            showTooltip(event.clientX, event.clientY, bar);
        } else {
            hideTooltip();
        }
    }

    function showTooltip(x, y, bar) {
        const tooltip = document.getElementById(canvas.tooltipId);
        const assetName = graphData.assets[bar.assetType].name;

        tooltip.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">${assetName}</div>
            <div style="font-size: 12px; color: #D1D5DB;">Round ${bar.round}</div>
            <div style="font-size: 16px; font-weight: 700; margin-top: 4px;">${bar.value.toFixed(0)} points</div>
        `;

        tooltip.style.display = 'block';
        tooltip.style.left = `${x + 15}px`;
        tooltip.style.top = `${y - 60}px`;
    }

    function hideTooltip() {
        const tooltip = document.getElementById(canvas.tooltipId);
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    /**
     * Adjust color brightness for gradients
     * @param {string} color - Hex color code (e.g., '#FFD700')
     * @param {number} percent - Brightness adjustment percentage
     * @returns {string} Adjusted color in hex format
     */
    function adjustColorBrightness(color, percent) {
        // Remove # if present
        let hex = color.replace('#', '');

        // Convert to RGB
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);

        // Adjust brightness
        r = Math.min(255, Math.max(0, r + (r * percent / 100)));
        g = Math.min(255, Math.max(0, g + (g * percent / 100)));
        b = Math.min(255, Math.max(0, b + (b * percent / 100)));

        // Convert back to hex
        const toHex = (num) => {
            const hex = Math.round(num).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // Cleanup
    function destroy() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        socket.off('asset:update', handleAssetUpdate);
        socket.off('graph:update');
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', hideTooltip);
    }

    // Initialize
    init();

    return { destroy, refresh: fetchGraphData };
}
