/**
 * Clerk Authentication Integration for WisselApp
 *
 * This file replaces the custom auth system with Clerk.
 * Include this AFTER loading Clerk's script and BEFORE your app scripts.
 */

// Wait for Clerk object to be available, then initialize
async function initializeClerk() {
    console.log('🔵 Waiting for Clerk to be available...');

    // Clerk publishable key (this is a public key, safe to include in client-side code)
    const clerkPublishableKey = 'pk_test_ZW5nYWdlZC10ZXJyYXBpbi0xNi5jbGVyay5hY2NvdW50cy5kZXYk';

    // Wait for Clerk object to exist (max 10 seconds)
    let attempts = 0;
    while (!window.Clerk && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (!window.Clerk) {
        throw new Error('Clerk object not found after 10 seconds');
    }

    console.log('✅ Clerk object found');
    console.log('🔵 Checking Clerk initialization status...');

    // Check if Clerk is already loaded (might auto-initialize from script tag)
    if (Clerk.loaded) {
        console.log('✅ Clerk already initialized');
    } else {
        console.log('🔵 Calling Clerk.load() with explicit publishable key...');

        // Try calling load with the publishable key explicitly
        try {
            await Clerk.load({
                publishableKey: clerkPublishableKey
            });
            console.log('✅ Clerk.load() completed');
        } catch (loadError) {
            console.error('❌ Clerk.load() failed:', loadError);
            throw loadError;
        }
    }

    console.log('✅ Clerk initialized successfully');
    console.log('🔵 Clerk.loaded:', Clerk.loaded);
    console.log('🔵 Clerk.user:', Clerk.user);

    // Remove loading screen
    console.log('🔵 Removing loading screen...');
    document.getElementById('clerk-loading')?.remove();

    // Check if user is signed in
    if (Clerk.user) {
        console.log('✅ User is signed in:', Clerk.user.primaryEmailAddress?.emailAddress);

        // Show main content
        document.querySelector('.container')?.style.setProperty('display', 'block');

        // Update UI with user info
        updateUserInfo(Clerk.user);

        // Enable backend storage
        window.useBackendStorage = true;

        // Get Clerk session token for API calls
        window.getClerkToken = async () => {
            return await Clerk.session.getToken();
        };

    } else {
        console.log('❌ User not signed in, showing landing page...');

        // Create landing page
        const landingPage = document.createElement('div');
        landingPage.id = 'landing-page';
        landingPage.style.cssText = `
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Geist Sans', system-ui, -apple-system, sans-serif;
        `;

        landingPage.innerHTML = `
            <div style="background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); padding: 48px; max-width: 480px; width: 90%; text-align: center;">
                <div style="margin-bottom: 32px;">
                    <h1 style="font-size: 32px; font-weight: 700; color: #1a1a1a; margin: 0 0 12px 0;">🏒 Hockey Team Manager</h1>
                    <p style="font-size: 16px; color: #666; margin: 0;">Manage your team, generate fair rotations, and track playing time</p>
                </div>
                <div id="clerk-auth-container"></div>
            </div>
        `;

        document.body.appendChild(landingPage);

        const authContainer = document.getElementById('clerk-auth-container');

        console.log('🔵 Auth container found:', !!authContainer);

        if (!authContainer) {
            console.error('❌ clerk-auth-container not found!');
            throw new Error('Auth container element not found');
        }

        try {
            console.log('🔵 Mounting sign-in component...');
            // Mount sign-in component using default Clerk behavior (no routing option)
            // Per Clerk docs: "virtual" routing is deprecated and internal-only
            Clerk.mountSignIn(authContainer, {
                appearance: {
                    elements: {
                        rootBox: 'w-full',
                        card: 'shadow-none border-0'
                    }
                }
            });
            console.log('✅ Sign-in component mounted');
        } catch (mountError) {
            console.error('❌ Failed to mount Clerk component:', mountError);
            throw mountError;
        }

        // Keep main content hidden
        document.querySelector('.container')?.style.setProperty('display', 'none');
    }

    // Setup logout button
    setupLogoutButton();

    // Track initial state to prevent reload loop
    let initialAuthState = Clerk.user ? 'authenticated' : 'unauthenticated';
    let hasReloaded = sessionStorage.getItem('clerk_just_signed_in') === 'true';

    // Clear the reload flag if we're already authenticated
    if (initialAuthState === 'authenticated' && hasReloaded) {
        sessionStorage.removeItem('clerk_just_signed_in');
    }

    // Listen for Clerk auth changes
    Clerk.addListener((state) => {
        const currentState = state.user ? 'authenticated' : 'unauthenticated';

        // Only act on actual state changes
        if (currentState !== initialAuthState) {
            if (state.user && !hasReloaded) {
                // User just signed in
                console.log('User signed in:', state.user.primaryEmailAddress?.emailAddress);
                sessionStorage.setItem('clerk_just_signed_in', 'true');
                window.location.reload();
            } else if (!state.user) {
                // User signed out
                console.log('User signed out');
                sessionStorage.removeItem('clerk_just_signed_in');
                window.location.href = '/';
            }

            initialAuthState = currentState;
        }
    });
}

// Start initialization when page loads
window.addEventListener('load', async () => {
    try {
        await initializeClerk();
    } catch (error) {
        console.error('❌ Clerk initialization failed:', error);

        // Remove loading screen even on error
        document.getElementById('clerk-loading')?.remove();

        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Geist Sans', sans-serif;
        `;
        errorDiv.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 48px; max-width: 480px; text-align: center;">
                <h2 style="color: #e53e3e; margin: 0 0 16px 0;">Authentication Error</h2>
                <p style="color: #666; margin: 0 0 24px 0;">Failed to load authentication system: ${error.message}</p>
                <button onclick="window.location.reload()" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">Reload Page</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
});

function updateUserInfo(user) {
    const userEmailEl = document.getElementById('user-email');
    if (userEmailEl && user.primaryEmailAddress) {
        userEmailEl.textContent = user.primaryEmailAddress.emailAddress;
    }
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await Clerk.signOut();
                console.log('✅ User signed out');
                window.location.href = '/';
            } catch (error) {
                console.error('❌ Logout failed:', error);
            }
        });
    }
}

// Update fetch to include Clerk token
const originalFetch = window.fetch;
window.fetch = async function(url, options = {}) {
    // Add Clerk auth token to API requests
    if (url.startsWith('/api/')) {
        const token = await Clerk?.session?.getToken();
        if (token) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            };
        }
    }
    return originalFetch(url, options);
};
