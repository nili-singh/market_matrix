/**
 * Super Admin Reset Panel
 * Global game reset functionality for super administrators
 */

import socket from '../../utils/socket.js';

const API_URL = import.meta.env.VITE_API_URL || 'https://market-matrix-t2nc.onrender.com';

export default function superAdminResetPanel(container) {
    let gameStatus = null;

    const checkAuth = () => {
        const token = localStorage.getItem('superadmin_token');
        if (!token) {
            window.navigateTo('/superadmin');
            return false;
        }
        return true;
    };

    const render = () => {
        if (!checkAuth()) return;

        const username = localStorage.getItem('superadmin_username') || 'Super Admin';

        container.innerHTML = `
            <div class="superadmin-panel-container">
                <div class="superadmin-panel-header">
                    <div class="panel-title">
                        <div class="superadmin-icon">⚙️</div>
                        <div>
                            <h1>Super Admin Reset Panel</h1>
                            <p class="panel-subtitle">Logged in as: ${username}</p>
                        </div>
                    </div>
                    <button id="logout-btn" class="btn btn-secondary">Logout</button>
                </div>

                <div class="panel-content">
                    <div class="status-card">
                        <h2>📊 Current Game Status</h2>
                        <div id="game-status" class="status-grid">
                            <div class="status-loading">Loading game status...</div>
                        </div>
                    </div>

                    <div class="reset-card">
                        <div class="warning-banner">
                            <span class="warning-icon">⚠️</span>
                            <div>
                                <strong>Danger Zone</strong>
                                <p>The actions below will affect all players and cannot be undone.</p>
                            </div>
                        </div>

                        <button id="reset-game-btn" class="btn btn-danger btn-large">
                            🔄 Reset Entire Game
                        </button>
                    </div>
                </div>

                <!-- Confirmation Modal -->
                <div id="confirm-modal" class="modal" style="display: none;">
                    <div class="modal-overlay" id="modal-overlay"></div>
                    <div class="modal-content superadmin-modal">
                        <div class="modal-header">
                            <h2>⚠️ Reset Entire Game?</h2>
                        </div>
                        <div class="modal-body">
                            <p class="modal-warning">
                                This will reset the entire game for all players. This action includes:
                            </p>
                            <ul class="reset-list">
                                <li>Reset all asset values back to base percentages</li>
                                <li>Clear all drawn cards</li>
                                <li>Reset leaderboard rankings</li>
                                <li>Reset current round back to Round 1</li>
                                <li>Clear all round history</li>
                                <li>Reset all team balances and holdings</li>
                            </ul>
                            <p class="modal-confirm"><strong>Are you absolutely sure?</strong></p>
                        </div>
                        <div class="modal-footer">
                            <button id="cancel-reset-btn" class="btn btn-secondary">Cancel</button>
                            <button id="confirm-reset-btn" class="btn btn-danger">Confirm Reset</button>
                        </div>
                    </div>
                </div>

                <!-- Success/Error Messages -->
                <div id="message-toast" class="message-toast" style="display: none;"></div>
            </div>
        `;

        attachEventListeners();
        loadGameStatus();
    };

    const attachEventListeners = () => {
        document.getElementById('logout-btn').addEventListener('click', handleLogout);
        document.getElementById('reset-game-btn').addEventListener('click', showConfirmModal);
        document.getElementById('cancel-reset-btn').addEventListener('click', hideConfirmModal);
        document.getElementById('confirm-reset-btn').addEventListener('click', handleReset);
        document.getElementById('modal-overlay').addEventListener('click', hideConfirmModal);

        // Listen for global reset events from socket
        socket.on('game:reset', handleResetNotification);
    };

    const loadGameStatus = async () => {
        const statusEl = document.getElementById('game-status');
        const token = localStorage.getItem('superadmin_token');

        try {
            const response = await fetch(`${API_URL}/api/superadmin/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    handleLogout();
                    return;
                }
                throw new Error('Failed to load status');
            }

            const data = await response.json();
            gameStatus = data.summary;

            statusEl.innerHTML = `
                <div class="status-item">
                    <span class="status-label">Current Round:</span>
                    <span class="status-value">${gameStatus.currentRound}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Phase:</span>
                    <span class="status-value">${gameStatus.currentPhase}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Teams:</span>
                    <span class="status-value">${gameStatus.teamCount}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Cards Drawn:</span>
                    <span class="status-value">${gameStatus.drawnCardCount}</span>
                </div>
            `;
        } catch (error) {
            console.error('Error loading game status:', error);
            statusEl.innerHTML = `<div class="status-error">Failed to load game status</div>`;
        }
    };

    const showConfirmModal = () => {
        const modal = document.getElementById('confirm-modal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };

    const hideConfirmModal = () => {
        const modal = document.getElementById('confirm-modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    const handleReset = async () => {
        const confirmBtn = document.getElementById('confirm-reset-btn');
        const cancelBtn = document.getElementById('cancel-reset-btn');
        const token = localStorage.getItem('superadmin_token');

        // Disable buttons during reset
        confirmBtn.disabled = true;
        cancelBtn.disabled = true;
        confirmBtn.textContent = 'Resetting...';

        try {
            const response = await fetch(`${API_URL}/api/superadmin/reset`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    handleLogout();
                    return;
                }
                throw new Error('Reset failed');
            }

            const data = await response.json();

            hideConfirmModal();
            showToast('✅ Game reset successfully! All players have been notified.', 'success');

            // Reload game status
            setTimeout(() => {
                loadGameStatus();
            }, 1000);

        } catch (error) {
            console.error('Reset error:', error);
            showToast('❌ Failed to reset game. Please try again.', 'error');

            // Re-enable buttons
            confirmBtn.disabled = false;
            cancelBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Reset';
        }
    };

    const handleResetNotification = (data) => {
        console.log('Received reset notification:', data);
        showToast('🔄 Game has been reset', 'info');
        loadGameStatus();
    };

    const showToast = (message, type = 'info') => {
        const toast = document.getElementById('message-toast');
        toast.textContent = message;
        toast.className = `message-toast message-${type}`;
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.display = 'none';
        }, 5000);
    };

    const handleLogout = () => {
        localStorage.removeItem('superadmin_token');
        localStorage.removeItem('superadmin_username');

        // Remove socket listener
        socket.off('game:reset', handleResetNotification);

        window.navigateTo('/superadmin');
    };

    render();
}
