const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://market-matrix-t2nc.onrender.com/api'
    : 'http://localhost:3000/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('admin_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('admin_token', token);
        } else {
            localStorage.removeItem('admin_token');
        }
    }

    getToken() {
        return this.token || localStorage.getItem('admin_token');
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Add auth token if available
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.error || 'Request failed');
                error.details = data.details;
                error.response = data;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        if (data.token) {
            this.setToken(data.token);
        }

        return data;
    }

    async verifyToken() {
        return this.request('/auth/verify', {
            method: 'POST',
        });
    }

    logout() {
        this.setToken(null);
    }

    // Public endpoints
    async getAssets() {
        return this.request('/assets');
    }

    async getGameState() {
        return this.request('/game-state');
    }

    async getPublicLeaderboard() {
        return this.request('/leaderboard/public');
    }

    // Admin endpoints
    async getLeaderboard() {
        return this.request('/admin/leaderboard');
    }

    async getTeams() {
        return this.request('/admin/teams');
    }

    async createTeam(teamData) {
        return this.request('/admin/teams', {
            method: 'POST',
            body: JSON.stringify(teamData),
        });
    }

    async updateTeam(teamId, teamData) {
        return this.request(`/admin/teams/${teamId}`, {
            method: 'PUT',
            body: JSON.stringify(teamData),
        });
    }

    async deleteTeam(teamId) {
        return this.request(`/admin/teams/${teamId}`, {
            method: 'DELETE',
        });
    }

    async startRound2() {
        return this.request('/admin/round/start', {
            method: 'POST',
        });
    }

    async nextRound() {
        return this.request('/rounds/next', {
            method: 'POST',
        });
    }

    async nextTeam() {
        return this.request('/admin/team/next', {
            method: 'POST',
        });
    }

    async getRoundState() {
        return this.request('/rounds/state');
    }

    async previousRound() {
        return this.request('/rounds/previous', {
            method: 'POST',
        });
    }

    async shuffleDeck(currentRound) {
        return this.request('/cards/shuffle', {
            method: 'POST',
            body: JSON.stringify({ currentRound }),
        });
    }

    async drawCard(teamId) {
        return this.request(`/cards/draw/${teamId}`, {
            method: 'POST',
        });
    }

    async previewFiveCards() {
        return this.request('/cards/preview-five', {
            method: 'POST',
        });
    }

    async drawSpecificCard(teamId, cardId) {
        return this.request(`/cards/draw/${teamId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cardId }),
        });
    }

    async getDeckState() {
        return this.request('/cards/deck-state');
    }

    async getDrawnHistory() {
        return this.request('/cards/drawn-history');
    }

    async executeTrade(tradeData) {
        return this.request('/admin/trade', {
            method: 'POST',
            body: JSON.stringify(tradeData),
        });
    }

    async executeTeamTrade(tradeData) {
        return this.request('/admin/trade/team-to-team', {
            method: 'POST',
            body: JSON.stringify(tradeData),
        });
    }

    async adjustAssetValue(assetType, newValue) {
        return this.request(`/admin/assets/${assetType}`, {
            method: 'PUT',
            body: JSON.stringify({ newValue }),
        });
    }

    async executeBatchTrade(batchTradeData) {
        return this.request('/admin/trade/batch', {
            method: 'POST',
            body: JSON.stringify(batchTradeData),
        });
    }

    async getAssetHistory(rounds) {
        const query = rounds ? `?rounds=${rounds}` : '';
        return this.request(`/assets/history${query}`);
    }
}

export default new ApiClient();
