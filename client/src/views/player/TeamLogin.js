import api from '../../utils/api.js';

/**
 * Team Login Page
 * Allows teams to login with teamId and password
 */
export default function TeamLogin() {
    const container = document.getElementById('app');

    container.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Team Login</h1>
                    <p class="text-muted">Market Matrix - Player Dashboard</p>
                </div>

                <form id="teamLoginForm" class="auth-form">
                    <div class="form-group">
                        <label class="form-label">Team ID</label>
                        <input 
                            type="text" 
                            id="teamId" 
                            class="input" 
                            placeholder="Enter your Team ID (e.g., TEAM_001)" 
                            required
                            autocomplete="username"
                        />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input 
                            type="password" 
                            id="password" 
                            class="input" 
                            placeholder="Enter your password" 
                            required
                            autocomplete="current-password"
                        />
                    </div>

                    <div id="errorMessage" class="error-message" style="display: none;"></div>

                    <button type="submit" class="btn btn-primary btn-block" id="loginBtn">
                        Login
                    </button>
                </form>

                <div class="auth-footer">
                    <p class="text-muted text-sm">
                        Your credentials were provided by the event organizers.
                    </p>
                </div>
            </div>
        </div>
    `;

    // Add authentication styles
    addAuthStyles();

    // Form handling
    const form = document.getElementById('teamLoginForm');
    const teamIdInput = document.getElementById('teamId');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const teamId = teamIdInput.value.trim();
        const password = passwordInput.value.trim();

        if (!teamId || !password) {
            showError('Please enter both Team ID and password');
            return;
        }

        try {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Logging in...';
            hideError();

            // Call team login API
            const response = await fetch('http://localhost:3000/api/team-auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ teamId, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token in localStorage
            localStorage.setItem('team_token', data.token);
            localStorage.setItem('team_id', data.team.teamId);
            localStorage.setItem('team_name', data.team.teamName);

            // Redirect to player dashboard
            window.location.href = '/player-dashboard';

        } catch (error) {
            console.error('Login error:', error);
            showError(error.message || 'Invalid credentials. Please try again.');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }
}

function addAuthStyles() {
    // Only add once
    if (document.getElementById('authStyles')) return;

    const style = document.createElement('style');
    style.id = 'authStyles';
    style.textContent = `
        .auth-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
            padding: 2rem;
        }

        .auth-card {
            background: rgba(26, 31, 58, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 16px;
            padding: 3rem;
            max-width: 450px;
            width: 100%;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .auth-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .auth-header h1 {
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }

        .auth-form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-label {
            font-weight: 500;
            color: #e5e7eb;
            font-size: 0.9rem;
        }

        .input {
            padding: 0.75rem 1rem;
            border-radius: 8px;
            border: 1px solid rgba(99, 102, 241, 0.3);
            background: rgba(15, 23, 42, 0.5);
            color: #fff;
            font-size: 1rem;
            transition: all 0.2s;
        }

        .input:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-size: 0.9rem;
        }

        .btn-block {
            width: 100%;
            padding: 0.875rem 1.5rem;
            font-size: 1rem;
            margin-top: 0.5rem;
        }

        .auth-footer {
            margin-top: 2rem;
            text-align: center;
        }

        .text-sm {
            font-size: 0.875rem;
        }

        .text-muted {
            color: #9ca3af;
        }
    `;
    document.head.appendChild(style);
}
