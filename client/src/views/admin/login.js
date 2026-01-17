import api from '../../utils/api.js';

export default function adminLogin(container) {
    container.innerHTML = `
    <div class="flex-center" style="min-height: 100vh; padding: 2rem;">
      <div class="glass-card slide-in" style="width: 100%; max-width: 450px; padding: 3rem;">
        <div class="text-center mb-lg">
          <h2 style="background: var(--color-accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            Admin Login
          </h2>
          <p class="text-muted">Access the control panel</p>
        </div>
        
        <form id="loginForm">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input 
              type="text" 
              class="input" 
              id="username" 
              placeholder="Enter username"
              required
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">Password</label>
            <input 
              type="password" 
              class="input" 
              id="password" 
              placeholder="Enter password"
              required
            />
          </div>
          
          <div id="errorMessage" class="text-danger text-center mb-sm" style="display: none;"></div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%;" id="loginBtn">
            Login
          </button>
          
          <button type="button" class="btn btn-secondary mt-sm" style="width: 100%;" onclick="window.navigateTo('/')">
            Back to Home
          </button>
        </form>
      </div>
    </div>
  `;

    const form = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        errorMessage.style.display = 'none';
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        try {
            const response = await api.login(username, password);

            if (response.success) {
                window.navigateTo('/admin/dashboard');
            }
        } catch (error) {
            errorMessage.textContent = error.message || 'Invalid credentials';
            errorMessage.style.display = 'block';
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });
}
