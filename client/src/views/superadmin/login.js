/**
 * Super Admin Login View
 * Separate authentication for super admin panel
 */

const API_URL = process.env.NODE_ENV === 'production'
    ? 'https://market-matrix-t2nc.onrender.com'
    : 'http://localhost:3000';

export default function superAdminLogin(container) {
    const render = () => {
        container.innerHTML = `
            <div class="superadmin-login-container">
                <div class="superadmin-login-card">
                    <div class="superadmin-header">
                        <div class="superadmin-icon">🔐</div>
                        <h1>Super Admin Access</h1>
                        <p class="superadmin-subtitle">Restricted Area - Authorized Personnel Only</p>
                    </div>

                    <form id="superadmin-login-form" class="superadmin-form">
                        <div class="form-group">
                            <label for="username">Super Admin ID</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                placeholder="Enter super admin username"
                                required
                                autocomplete="username"
                            />
                        </div>

                        <div class="form-group">
                            <label for="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Enter password"
                                required
                                autocomplete="current-password"
                            />
                        </div>

                        <div id="error-message" class="error-message"></div>

                        <button type="submit" class="btn btn-danger btn-large">
                            <span id="login-text">Login</span>
                            <span id="login-spinner" class="spinner" style="display: none;"></span>
                        </button>
                    </form>

                    <div class="superadmin-footer">
                        <a href="/" class="back-link">← Back to Home</a>
                    </div>
                </div>
            </div>
        `;

        attachEventListeners();
    };

    const attachEventListeners = () => {
        const form = document.getElementById('superadmin-login-form');
        form.addEventListener('submit', handleLogin);
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const form = document.getElementById('superadmin-login-form');
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('error-message');
        const loginText = document.getElementById('login-text');
        const loginSpinner = document.getElementById('login-spinner');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Clear previous errors
        errorEl.textContent = '';
        errorEl.style.display = 'none';

        // Show loading state
        loginText.style.display = 'none';
        loginSpinner.style.display = 'inline-block';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/api/superadmin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store token in localStorage
                localStorage.setItem('superadmin_token', data.token);
                localStorage.setItem('superadmin_username', data.superAdmin.username);

                // Navigate to super admin panel
                window.navigateTo('/superadmin/panel');
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Super admin login error:', error);
            errorEl.textContent = error.message || 'Invalid credentials. Please try again.';
            errorEl.style.display = 'block';

            // Reset button state
            loginText.style.display = 'inline';
            loginSpinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    };

    render();
}
