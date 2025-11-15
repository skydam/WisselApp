/**
 * Clerk Authentication Integration for WisselApp
 *
 * This file replaces the custom auth system with Clerk.
 * Include this AFTER loading Clerk's script and BEFORE your app scripts.
 */

// Wait for Clerk to be ready
window.addEventListener('load', async () => {
    // Initialize Clerk
    const clerkPublishableKey = 'pk_test_ZW5nYWdlZC10ZXJyYXBpbi0xNi5jbGVyay5hY2NvdW50cy5kZXYk';

    try {
        await Clerk.load({
            publishableKey: clerkPublishableKey
        });

        console.log('✅ Clerk loaded successfully');

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
                    <div id="clerk-sign-in-container"></div>
                    <div style="margin-top: 24px; font-size: 14px; color: #999;">
                        <p style="margin: 0;">Don't have an account? Click "Sign up" below</p>
                    </div>
                </div>
            `;

            document.body.appendChild(landingPage);

            // Mount Clerk sign-in component in the landing page
            Clerk.mountSignIn(document.getElementById('clerk-sign-in-container'), {
                appearance: {
                    elements: {
                        rootBox: 'w-full',
                        card: 'shadow-none border-0'
                    }
                },
                afterSignInUrl: '/'
            });

            // Keep main content hidden
            document.querySelector('.container')?.style.setProperty('display', 'none');
        }

        // Setup logout button
        setupLogoutButton();

        // Listen for Clerk auth changes
        Clerk.addListener((state) => {
            if (state.user) {
                console.log('User signed in:', state.user.primaryEmailAddress?.emailAddress);
                updateUserInfo(state.user);

                // Show main content
                document.querySelector('.container')?.style.removeProperty('display');

                // Remove landing page if it exists
                document.getElementById('landing-page')?.remove();

                // Reload to initialize app
                window.location.reload();
            } else {
                console.log('User signed out');
                window.location.href = '/';
            }
        });

    } catch (error) {
        console.error('❌ Clerk initialization failed:', error);
        alert('Authentication system failed to load. Please refresh the page.');
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
