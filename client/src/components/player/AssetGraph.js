import { Chart, registerables } from 'chart.js';
import api from '../../utils/api.js';
import socket from '../../utils/socket.js';

Chart.register(...registerables);

export default function AssetGraph(container) {
    let chart = null;
    let assets = [];

    async function initChart() {
        try {
            const response = await api.getAssets();
            assets = response.assets;

            // Create canvas
            container.innerHTML = '<canvas id="priceChart"></canvas>';
            const ctx = document.getElementById('priceChart').getContext('2d');

            // Prepare datasets
            const datasets = assets.map((asset, index) => {
                const colors = [
                    { border: 'rgb(99, 102, 241)', bg: 'rgba(99, 102, 241, 0.1)' },   // Crypto - Purple
                    { border: 'rgb(16, 185, 129)', bg: 'rgba(16, 185, 129, 0.1)' },   // Stock - Green
                    { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.1)' },   // Gold - Orange
                    { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' },   // Euro Bond - Blue
                    { border: 'rgb(239, 68, 68)', bg: 'rgba(239, 68, 68, 0.1)' },     // T-Bill - Red
                ];

                const color = colors[index] || colors[0];

                return {
                    label: asset.name,
                    data: asset.priceHistory.map(point => ({
                        x: new Date(point.timestamp),
                        y: point.value,
                    })),
                    borderColor: color.border,
                    backgroundColor: color.bg,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                };
            });

            chart = new Chart(ctx, {
                type: 'line',
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#cbd5e1',
                                font: {
                                    family: 'Inter',
                                    size: 12,
                                    weight: '600',
                                },
                                padding: 15,
                                usePointStyle: true,
                            },
                        },
                        tooltip: {
                            backgroundColor: 'rgba(30, 39, 73, 0.95)',
                            titleColor: '#f8fafc',
                            bodyColor: '#cbd5e1',
                            borderColor: 'rgba(148, 163, 184, 0.2)',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: true,
                            callbacks: {
                                label: function (context) {
                                    return `${context.dataset.label}: ₹${context.parsed.y.toFixed(2)}`;
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'minute',
                                displayFormats: {
                                    minute: 'HH:mm',
                                },
                            },
                            grid: {
                                color: 'rgba(148, 163, 184, 0.1)',
                            },
                            ticks: {
                                color: '#64748b',
                                font: {
                                    family: 'Inter',
                                },
                            },
                        },
                        y: {
                            beginAtZero: false,
                            grid: {
                                color: 'rgba(148, 163, 184, 0.1)',
                            },
                            ticks: {
                                color: '#64748b',
                                font: {
                                    family: 'Inter',
                                },
                                callback: function (value) {
                                    return '₹' + value.toFixed(0);
                                },
                            },
                        },
                    },
                    animation: {
                        duration: 750,
                        easing: 'easeInOutQuart',
                    },
                },
            });

            // Set canvas height
            ctx.canvas.style.height = '400px';

        } catch (error) {
            console.error('Error initializing chart:', error);
        }
    }

    async function updateChart() {
        if (!chart) return;

        try {
            const response = await api.getAssets();
            assets = response.assets;

            // Update datasets
            assets.forEach((asset, index) => {
                if (chart.data.datasets[index]) {
                    chart.data.datasets[index].data = asset.priceHistory.map(point => ({
                        x: new Date(point.timestamp),
                        y: point.value,
                    }));
                }
            });

            chart.update('none'); // Update without animation for real-time feel

        } catch (error) {
            console.error('Error updating chart:', error);
        }
    }

    // Listen for asset updates
    socket.on('asset:update', () => {
        updateChart();
    });

    // Initialize chart
    initChart();

    // Refresh every 3 seconds as fallback
    setInterval(updateChart, 3000);
}
