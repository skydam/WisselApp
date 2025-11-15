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

            // Update UI with user info
            updateUserInfo(Clerk.user);

            // Enable backend storage
            window.useBackendStorage = true;

            // Get Clerk session token for API calls
            window.getClerkToken = async () => {
                return await Clerk.session.getToken();
            };

        } else {
            console.log('❌ User not signed in, redirecting...');

            // Mount Clerk sign-in component
            const signInDiv = document.createElement('div');
            signInDiv.id = 'clerk-sign-in';
            signInDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1000;
            `;
            document.body.appendChild(signInDiv);

            Clerk.mountSignIn(signInDiv, {
                appearance: {
                    elements: {
                        rootBox: 'mx-auto',
                        card: 'shadow-lg'
                    }
                },
                afterSignInUrl: '/',
                signUpUrl: undefined // Disable signup if you want restricted access
            });

            // Hide main content while not authenticated
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

                // Remove sign-in modal if it exists
                document.getElementById('clerk-sign-in')?.remove();

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
