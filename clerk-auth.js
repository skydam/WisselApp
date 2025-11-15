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

        // Remove loading screen
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

            // Check URL hash to determine which form to show
            const showSignUp = window.location.hash === '#sign-up';

            if (showSignUp) {
                // Mount sign-up component
                Clerk.mountSignUp(document.getElementById('clerk-auth-container'), {
                    appearance: {
                        elements: {
                            rootBox: 'w-full',
                            card: 'shadow-none border-0'
                        }
                    },
                    afterSignUpUrl: '/',
                    signInUrl: '#sign-in'
                });
            } else {
                // Mount sign-in component
                Clerk.mountSignIn(document.getElementById('clerk-auth-container'), {
                    appearance: {
                        elements: {
                            rootBox: 'w-full',
                            card: 'shadow-none border-0'
                        }
                    },
                    afterSignInUrl: '/',
                    signUpUrl: '#sign-up'
                });
            }

            // Listen for hash changes to switch between sign-in and sign-up
            window.addEventListener('hashchange', () => {
                const container = document.getElementById('clerk-auth-container');
                if (!container) return;

                // Clear the container
                container.innerHTML = '';

                // Mount the appropriate component based on hash
                if (window.location.hash === '#sign-up') {
                    Clerk.mountSignUp(container, {
                        appearance: {
                            elements: {
                                rootBox: 'w-full',
                                card: 'shadow-none border-0'
                            }
                        },
                        afterSignUpUrl: '/',
                        signInUrl: '#sign-in'
                    });
                } else {
                    Clerk.mountSignIn(container, {
                        appearance: {
                            elements: {
                                rootBox: 'w-full',
                                card: 'shadow-none border-0'
                            }
                        },
                        afterSignInUrl: '/',
                        signUpUrl: '#sign-up'
                    });
                }
            });

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
