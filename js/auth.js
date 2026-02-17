// auth.js - Google Sign-In and user authentication

const Auth = {
    TOKEN_KEY: 'milionerzy_auth_token',
    USER_KEY: 'milionerzy_auth_user',
    _saveTimer: null,

    // Get stored token
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    // Get stored user info
    getUser() {
        try {
            const data = localStorage.getItem(this.USER_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    // Check if user is logged in
    isLoggedIn() {
        return !!(this.getToken() && this.getUser());
    },

    // Handle Google Sign-In callback
    async handleGoogleCallback(response) {
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Blad logowania');
            }

            const data = await res.json();

            // Save token and user
            localStorage.setItem(this.TOKEN_KEY, data.token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));

            // Load progress from server
            await this.loadProgress();

            // Update UI
            this.updateUI();

            console.log('[Auth] Zalogowano:', data.user.name);
        } catch (err) {
            console.error('[Auth] Blad logowania:', err.message);
            alert('Blad logowania: ' + err.message);
        }
    },

    // Logout
    logout() {
        // Save progress before logout
        if (this.isLoggedIn()) {
            this.saveProgress();
        }

        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);

        // Update UI
        this.updateUI();

        console.log('[Auth] Wylogowano');
    },

    // Get auth headers for API requests
    getHeaders() {
        const token = this.getToken();
        if (token) {
            return { 'Authorization': 'Bearer ' + token };
        }
        return {};
    },

    // Save progress to server
    async saveProgress() {
        if (!this.isLoggedIn()) return;

        try {
            // Collect all milionerzy_ keys from localStorage
            const progress = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('milionerzy_') &&
                    key !== this.TOKEN_KEY && key !== this.USER_KEY) {
                    progress[key] = localStorage.getItem(key);
                }
            }

            await fetch('/api/user/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getHeaders()
                },
                body: JSON.stringify({ progress })
            });
        } catch (err) {
            console.error('[Auth] Blad zapisu progresu:', err.message);
        }
    },

    // Load progress from server
    async loadProgress() {
        if (!this.isLoggedIn()) return;

        try {
            const res = await fetch('/api/user/progress', {
                headers: this.getHeaders()
            });

            if (!res.ok) return;

            const data = await res.json();
            if (data.progress) {
                // Restore all keys to localStorage
                Object.entries(data.progress).forEach(([key, value]) => {
                    if (key.startsWith('milionerzy_') &&
                        key !== this.TOKEN_KEY && key !== this.USER_KEY) {
                        localStorage.setItem(key, value);
                    }
                });
                console.log('[Auth] Progres zaladowany z serwera');

                // Re-init storage to pick up loaded data
                if (typeof Storage !== 'undefined' && Storage.init) {
                    Storage.init();
                }
            }
        } catch (err) {
            console.error('[Auth] Blad ladowania progresu:', err.message);
        }
    },

    // Schedule a debounced save (call after game events)
    scheduleSave() {
        if (!this.isLoggedIn()) return;
        if (this._saveTimer) clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this.saveProgress(), 3000);
    },

    // Update login/logout UI on the page
    updateUI() {
        const user = this.getUser();
        const loggedIn = this.isLoggedIn();

        // Login button area
        const loginArea = document.getElementById('auth-area');
        if (!loginArea) return;

        if (loggedIn && user) {
            loginArea.innerHTML = `
                <div class="auth-user">
                    <img src="${user.picture}" alt="" class="auth-avatar" referrerpolicy="no-referrer">
                    <span class="auth-name">${user.name}</span>
                    <button class="auth-logout-btn" id="logout-btn">Wyloguj</button>
                </div>
            `;
            document.getElementById('logout-btn').addEventListener('click', () => {
                this.logout();
                window.location.reload();
            });
        } else {
            loginArea.innerHTML = `
                <div id="google-signin-btn"></div>
            `;
            this._renderGoogleButton();
        }

        // Show/hide generate button based on auth
        const generateBtn = document.getElementById('generate-btn');
        const authNotice = document.getElementById('auth-notice');
        if (generateBtn) {
            generateBtn.disabled = !loggedIn;
            if (!loggedIn) {
                generateBtn.title = 'Zaloguj sie, aby generowac pytania';
            } else {
                generateBtn.title = '';
            }
        }
        if (authNotice) {
            authNotice.style.display = loggedIn ? 'none' : 'block';
        }

        // Show/hide "add class" card based on auth
        const addCards = document.querySelectorAll('.class-card-add');
        addCards.forEach(card => {
            if (!loggedIn) {
                card.style.opacity = '0.4';
                card.style.pointerEvents = 'none';
                card.title = 'Zaloguj sie, aby dodac klase';
            } else {
                card.style.opacity = '';
                card.style.pointerEvents = '';
                card.title = '';
            }
        });
    },

    // Render Google Sign-In button
    _renderGoogleButton() {
        // Wait for Google Identity Services to load
        if (typeof google === 'undefined' || !google.accounts) {
            setTimeout(() => this._renderGoogleButton(), 200);
            return;
        }

        const container = document.getElementById('google-signin-btn');
        if (!container) return;

        google.accounts.id.renderButton(container, {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            text: 'signin_with',
            locale: 'pl'
        });
    },

    // Initialize auth on page load
    init() {
        // Set up Google Identity Services callback
        if (typeof google !== 'undefined' && google.accounts) {
            this._initGoogle();
        } else {
            // Wait for script to load
            window._authInitGoogle = () => this._initGoogle();
        }

        // Update UI
        this.updateUI();

        // Auto-save progress periodically
        if (this.isLoggedIn()) {
            setInterval(() => this.saveProgress(), 60000);
        }
    },

    _initGoogle() {
        const clientId = document.querySelector('meta[name="google-client-id"]');
        if (!clientId) return;

        google.accounts.id.initialize({
            client_id: clientId.content,
            callback: (response) => this.handleGoogleCallback(response),
            auto_select: false
        });

        this._renderGoogleButton();
    }
};
