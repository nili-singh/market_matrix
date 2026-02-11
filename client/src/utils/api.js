const API_BASE_URL = import.meta.env.VITE_API_URL;

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
        const data = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        if (data.token) {
            this.setToken(data.token);
        }

        return data;
    }

    async superAdminLogin(username, password) {
        const data = await this.request('/api/superadmin/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        if (data.token) {
            localStorage.setItem('superadmin_token', data.token);
            // We don't share the same token storage as regular admin
        }

        return data;
    }

    async verifyToken() {
        return this.request('/api/auth/verify', {
            method: 'POST',
        });
    }

    logout() {
        this.setToken(null);
    }

    // Public endpoints
    async getAssets() {
        return this.request('/api/assets');
    }

    async getGameState() {
        return this.request('/api/game-state');
    }

    async getPublicLeaderboard() {
        return this.request('/api/leaderboard/public');
    }

    // Admin endpoints
    async getLeaderboard() {
        return this.request('/api/admin/leaderboard');
    }

    async getTeams() {
        return this.request('/api/admin/teams');
    }

    async createTeam(teamData) {
        return this.request('/api/admin/teams', {
            method: 'POST',
            body: JSON.stringify(teamData),
        });
    }

    async updateTeam(teamId, teamData) {
        return this.request(`/api/admin/teams/${teamId}`, {
            method: 'PUT',
            body: JSON.stringify(teamData),
        });
    }

    async deleteTeam(teamId) {
        return this.request(`/api/admin/teams/${teamId}`, {
            method: 'DELETE',
        });
    }

    async startRound2() {
        return this.request('/api/admin/round/start', {
            method: 'POST',
        });
    }

    async nextRound() {
        return this.request('/api/rounds/next', {
            method: 'POST',
        });
    }

    async nextTeam() {
        return this.request('/api/admin/team/next', {
            method: 'POST',
        });
    }

    async getRoundState() {
        return this.request('/api/rounds/state');
    }

    async previousRound() {
        return this.request('/api/rounds/previous', {
            method: 'POST',
        });
    }

    async shuffleDeck(currentRound) {
        return this.request('/api/cards/shuffle', {
            method: 'POST',
            body: JSON.stringify({ currentRound }),
        });
    }

    async drawCard(teamId) {
        return this.request(`/api/cards/draw/${teamId}`, {
            method: 'POST',
        });
    }

    async previewFiveCards() {
        return this.request('/api/cards/preview-five', {
            method: 'POST',
        });
    }

    async drawSpecificCard(teamId, cardId) {
        return this.request(`/api/cards/draw/${teamId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cardId }),
        });
    }

    async getDeckState() {
        return this.request('/api/cards/deck-state');
    }

    async getDrawnHistory() {
        return this.request('/api/cards/drawn-history');
    }

    async executeTrade(tradeData) {
        return this.request('/api/admin/trade', {
            method: 'POST',
            body: JSON.stringify(tradeData),
        });
    }

    async executeTeamTrade(tradeData) {
        return this.request('/api/admin/trade/team-to-team', {
            method: 'POST',
            body: JSON.stringify(tradeData),
        });
    }

    async adjustAssetValue(assetType, newValue) {
        return this.request(`/api/admin/assets/${assetType}`, {
            method: 'PUT',
            body: JSON.stringify({ newValue }),
        });
    }

    async executeBatchTrade(batchTradeData) {
        return this.request('/api/admin/trade/batch', {
            method: 'POST',
            body: JSON.stringify(batchTradeData),
        });
    }

    async getAssetHistory(rounds) {
        const query = rounds ? `?rounds=${rounds}` : '';
        return this.request(`/api/assets/history${query}`);
    }
}

export default new ApiClient();