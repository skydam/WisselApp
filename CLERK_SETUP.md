# Clerk Setup Guide for WisselApp

## Step 1: Create Clerk Account

1. Go to https://clerk.com
2. Click "Start Building for Free"
3. Sign up with your email (jvharten@gmail.com)
4. Verify your email

## Step 2: Create Application

1. After login, click "Create Application"
2. Application name: **Hockey Team Manager**
3. Sign-in options: ✅ Email
4. Click "Create Application"

## Step 3: Get API Keys

After creating the app, you'll see your API keys:

```
Publishable Key: pk_test_...
Secret Key: sk_test_...
```

**IMPORTANT**: Copy both keys - you'll need them!

## Step 4: Configure Email Settings

1. In Clerk Dashboard, go to "Email & SMS"
2. Enable "Email addresses"
3. Enable "Password" authentication
4. Configure email templates:
   - **Password Reset** (Clerk provides default - you can customize)
   - **Verification Email**

## Step 5: Configure Allowlist (Optional - for restricted access)

1. Go to "User & Authentication" → "Restrictions"
2. Enable "Allowlist"
3. Add email: `jvharten@gmail.com`
4. This maintains your current whitelist behavior

## Step 6: Customize Appearance (Optional)

1. Go to "Customization" → "Theme"
2. Choose theme: **Dark** or **Light**
3. Upload logo (optional)
4. Matches your WisselApp design

## API Keys for Railway

Once you have your keys, add them to Railway:

```bash
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx...
CLERK_SECRET_KEY=sk_test_xxxxx...
```

## What Clerk Provides

✅ **Password Recovery** - Users can reset forgotten passwords
✅ **Email Verification** - Verify email addresses on signup
✅ **Session Management** - Secure, automatic session handling
✅ **User Profiles** - Built-in user profile management
✅ **Social Logins** - Add Google, GitHub, etc. (optional)
✅ **Security** - Industry-standard security practices
✅ **Analytics** - User activity insights
✅ **Webhooks** - Real-time event notifications

## Pricing

- **Free Tier**: 10,000 monthly active users
- **Your Usage**: ~1-10 users
- **Cost**: $0/month

## Next Steps

After completing this setup:
1. Copy your API keys
2. I'll integrate them into the WisselApp code
3. Deploy to Railway with new env vars
4. Test the new auth flow

Ready to proceed!
