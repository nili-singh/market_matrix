import socket from '../../utils/socket.js';

/**
 * Player Dashboard Page
 * Private dashboard for teams to view their portfolio, rank, and holdings
 */
export default async function PlayerDashboard() {
    const container = document.getElementById('app');

    // Check authentication
    const token = localStorage.getItem('team_token');
    if (!token) {
        window.location.href = '/team-login';
        return;
    }

    // State
    let dashboardData = null;
    let isLoading = true;

    // Initial render
    render();

    // Fetch dashboard data
    await loadDashboard();

    // Setup socket listeners for real-time updates
    setupSocketListeners();

    async function loadDashboard() {
        try {
            const response = await fetch('https://market-matrix-t2nc.onrender.com/api/team-data/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('team_token');
                window.location.href = '/team-login';
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to load dashboard');
            }

            const data = await response.json();
            dashboardData = data.team;
            isLoading = false;
            render();

        } catch (error) {
            console.error('Load dashboard error:', error);
            container.innerHTML = `
                <div class="error-container">
                    <h2>Error Loading Dashboard</h2>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    function render() {
        if (isLoading) {
            container.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Loading your dashboard...</p>
                </div>
            `;
            return;
        }

        const teamName = localStorage.getItem('team_name');

        container.innerHTML = `
            <div class="player-dashboard">
                <!-- Header -->
                <div class="dashboard-header">
                    <div>
                        <h1 class="dashboard-title">${teamName}</h1>
                        <p class="text-muted">${dashboardData.teamId}</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-primary" id="homeBtn">Back to Home</button>
                        <button class="btn btn-secondary" id="logoutBtn">Logout</button>
                    </div>
                </div>

                <!-- Portfolio Summary -->
                <div class="portfolio-summary glass-card">
                    <h3 class="section-title">Portfolio Summary</h3>
                    <div class="portfolio-stats">
                        <div class="stat-item">
                            <div class="stat-label">Balance</div>
                            <div class="stat-value balance">₹${formatNumber(dashboardData.balance)}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Total Portfolio Value</div>
                            <div class="stat-value portfolio">₹${formatNumber(dashboardData.portfolioValue)}</div>
                        </div>
                    </div>
                </div>

                <!-- Asset Holdings -->
                <div class="asset-holdings glass-card">
                    <h3 class="section-title">Asset Holdings</h3>
                    <div class="asset-list">
                        ${renderAssetItem('CRYPTO', 'Crypto Tokens', dashboardData.assets.CRYPTO, window.__assetPrices?.CRYPTO || 0)}
                        ${renderAssetItem('STOCK', 'Stock', dashboardData.assets.STOCK, window.__assetPrices?.STOCK || 0)}
                        ${renderAssetItem('GOLD', 'Gold', dashboardData.assets.GOLD, window.__assetPrices?.GOLD || 0)}
                        ${renderAssetItem('EURO_BOND', 'Euro Bond', dashboardData.assets.EURO_BOND, window.__assetPrices?.EURO_BOND || 0)}
                        ${renderAssetItem('TREASURY_BILL', 'Treasury Bill', dashboardData.assets.TREASURY_BILL, window.__assetPrices?.TREASURY_BILL || 0)}
                    </div>
                </div>
            </div>
        `;

        // Add styles
        addDashboardStyles();

        // Event listeners
        document.getElementById('homeBtn').addEventListener('click', () => {
            window.location.href = '/';
        });
        document.getElementById('logoutBtn').addEventListener('click', logout);
    }

    function renderAssetItem(assetType, assetName, quantity, price) {
        const totalValue = quantity * price;
        const assetIcon = getAssetIcon(assetType);

        // Show price only if it's not zero
        const quantityText = price > 0
            ? `${quantity} units @ ₹${formatNumber(price)}`
            : `${quantity} units`;

        // Show total value only if it's not zero
        const valueDisplay = totalValue > 0
            ? `₹${formatNumber(totalValue)}`
            : '';

        return `
            <div class="asset-item">
                <div class="asset-info">
                    <div class="asset-icon">${assetIcon}</div>
                    <div>
                        <div class="asset-name">${assetName}</div>
                        <div class="asset-quantity">${quantityText}</div>
                    </div>
                </div>
                <div class="asset-value">${valueDisplay}</div>
            </div>
        `;
    }

    function getAssetIcon(assetType) {
        const icons = {
            'CRYPTO': '₿',
            'STOCK': '📈',
            'GOLD': '🏆',
            'EURO_BOND': '💶',
            'TREASURY_BILL': '📜'
        };
        return icons[assetType] || '●';
    }

    function formatNumber(num) {
        return new Intl.NumberFormat('en-IN').format(Math.round(num));
    }

    function logout() {
        localStorage.removeItem('team_token');
        localStorage.removeItem('team_id');
        localStorage.removeItem('team_name');
        window.location.href = '/team-login';
    }

    function setupSocketListeners() {
        // Listen for portfolio updates
        socket.on('team:portfolio-updated', (data) => {
            if (data.teamId === dashboardData.teamId) {
                dashboardData = { ...dashboardData, ...data };
                render();
            }
        });

        // Listen for asset price updates
        socket.on('assets:updated', (prices) => {
            window.__assetPrices = prices;
            render();
        });

        // Listen for rank changes
        socket.on('team:rank-changed', (data) => {
            if (data.teamId === dashboardData.teamId) {
                dashboardData.rank = data.rank;
                render();
            }
        });
    }
}

function addDashboardStyles() {
    if (document.getElementById('dashboardStyles')) return;

    const style = document.createElement('style');
    style.id = 'dashboardStyles';
    style.textContent = `
        .player-dashboard {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        .header-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .dashboard-title {
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
        }

        .rank-card {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 16px;
            padding: 2rem;
            text-align: center;
            margin-bottom: 2rem;
        }

        .rank-label {
            font-size: 0.9rem;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
        }

        .rank-value {
            font-size: 3rem;
            font-weight: 700;
        }

        .rank-number {
            color: #6366f1;
        }

        .rank-total {
            color: #9ca3af;
            font-size: 1.5rem;
        }

        .glass-card {
            background: rgba(26, 31, 58, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 1.5rem;
        }

        .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: #e5e7eb;
        }

        .portfolio-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
        }

        .stat-item {
            text-align: center;
        }

        .stat-label {
            font-size: 0.9rem;
            color: #9ca3af;
            margin-bottom: 0.5rem;
        }

        .stat-value {
            font-size: 2rem;
            font-weight: 700;
        }

        .stat-value.balance {
            color: #10b981;
        }

        .stat-value.portfolio {
            color: #6366f1;
        }

        .asset-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .asset-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: rgba(15, 23, 42, 0.4);
            border-radius: 12px;
            border: 1px solid rgba(99, 102, 241, 0.1);
            transition: all 0.2s;
        }

        .asset-item:hover {
            background: rgba(15, 23, 42, 0.6);
            border-color: rgba(99, 102, 241, 0.3);
        }

        .asset-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .asset-icon {
            font-size: 2rem;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(99, 102, 241, 0.1);
            border-radius: 12px;
        }

        .asset-name {
            font-weight: 600;
            color: #e5e7eb;
            margin-bottom: 0.25rem;
        }

        .asset-quantity {
            font-size: 0.875rem;
            color: #9ca3af;
        }

        .asset-value {
            font-size: 1.25rem;
            font-weight: 700;
            color: #6366f1;
        }

        .loading-container, .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
        }

        .loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid rgba(99, 102, 241, 0.1);
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
            .player-dashboard {
                padding: 1rem;
            }

            .dashboard-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }

            .rank-value {
                font-size: 2rem;
            }

            .portfolio-stats {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
        }
    `;
    document.head.appendChild(style);
}
