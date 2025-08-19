# Vercel Postgres Setup for Code Compass Multi-Device Authentication

This guide will help you set up Vercel Postgres for your Code Compass app's user authentication and subscription management.

## Prerequisites

- Existing Vercel deployment of your Code Compass app
- Vercel CLI installed (`npm i -g vercel`)
- Access to your Vercel dashboard

## Step 1: Add Vercel Postgres to Your Project

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `csa-code-search` project
3. Go to the **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose your preferred region (closest to your users)
7. Click **Create**

## Step 2: Set Environment Variables

Once your Postgres database is created, Vercel will automatically add these environment variables:

- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NO_SSL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

You'll also need to add these custom environment variables:

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add the following:

```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_... (from your Stripe webhook endpoint)
```

## Step 3: Initialize Database Schema

### Option A: Using Vercel Web Interface

1. Go to your Vercel project → **Storage** → Your Postgres database
2. Click **Browse** → **Query**
3. Copy and paste the contents of `api/db/schema.sql`
4. Click **Execute**

### Option B: Using Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link your project: `vercel link`
4. Connect to your database:
   ```bash
   vercel env pull .env.local
   ```
5. Run the schema:
   ```bash
   # You can use any Postgres client with the connection string from .env.local
   psql $POSTGRES_URL -f api/db/schema.sql
   ```

### Option C: Using a Database Client

1. Get your connection string from Vercel dashboard
2. Use any Postgres client (TablePlus, pgAdmin, etc.)
3. Connect and run the `schema.sql` file

## Step 4: Test Database Connection

1. Deploy your changes: `vercel --prod`
2. Test the database health endpoint:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```
3. You should see a response indicating the database is healthy

## Step 5: Update Your Frontend Configuration

1. In `src/services/vercelAuth.js`, update the `baseURL`:
   ```javascript
   this.baseURL = process.env.NODE_ENV === 'production' 
     ? 'https://your-actual-vercel-domain.vercel.app'  // Replace with your domain
     : 'http://localhost:5173';
   ```

## Step 6: Test the Authentication System

1. Open your deployed app
2. Try creating a new account
3. Check your Vercel Postgres database to see the new user record
4. Test signing in and out
5. Test device management

## Step 7: Set Up Stripe Webhook (for subscription management)

1. In your [Stripe Dashboard](https://dashboard.stripe.com/):
   - Go to **Developers** → **Webhooks**
   - Click **Add endpoint**
   - URL: `https://your-app.vercel.app/api/subscription/webhook`
   - Events: Select `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the webhook secret and add it to your Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

## Step 8: Migrate Your Existing 2 Users

### For each existing user:

1. Have them visit your app
2. They should see a migration prompt (if they have existing subscription data)
3. They can create an account with their email
4. Their subscription will be automatically linked

### Manual migration (if needed):

1. Get their email and subscription ID from your records
2. Have them create an account first
3. Use the Vercel dashboard or a database client to run:
   ```sql
   INSERT INTO subscriptions (user_id, stripe_subscription_id, plan, status, expires_at, starts_at)
   SELECT u.id, 'their_stripe_subscription_id', 'annual', 'active', 
          NOW() + INTERVAL '1 year', NOW()
   FROM users u WHERE u.email = 'their_email@example.com';
   ```

## Step 9: Monitor and Maintain

### Database Monitoring
- Monitor database usage in Vercel dashboard
- Set up alerts for high usage

### Session Cleanup
- Expired sessions are automatically cleaned up by the database triggers
- You can manually run: `SELECT cleanup_expired_sessions();`

### Analytics
- Monitor authentication success/failure rates
- Track device registrations and removals

## Troubleshooting

### "Database connection failed"
- Check your environment variables are properly set
- Ensure your Vercel deployment has access to the database
- Verify the database is running in Vercel dashboard

### "Invalid JWT token"
- Check that `JWT_SECRET` is set consistently
- Clear localStorage and try again: `localStorage.clear()`

### "Device limit exceeded"
- Users can manage devices at `/api/devices/list`
- Check device count: `SELECT COUNT(*) FROM devices WHERE user_id = 'user-id';`

### Authentication not working
- Check browser console for errors
- Verify API endpoints are accessible
- Check Vercel function logs in dashboard

## Security Considerations

1. **JWT Secret**: Use a strong, unique JWT secret in production
2. **HTTPS Only**: Ensure all requests use HTTPS in production
3. **Rate Limiting**: The built-in rate limiting protects against brute force attacks
4. **Session Expiry**: Sessions expire after 7 days by default
5. **Device Limit**: Hard limit of 3 devices per user

## Cost Estimation

**Vercel Postgres**:
- Hobby: Free (500MB storage, 1GB transfer)
- Pro: $20/month (5GB storage, 100GB transfer)

**API Requests**:
- Authentication calls are minimal
- Most expensive operations: device registration, subscription updates

For 2 users initially, the free tier should be sufficient.

---

## Next Steps

Once setup is complete:

1. ✅ Users can create accounts
2. ✅ Access from up to 3 devices  
3. ✅ Manage their devices
4. ✅ Subscriptions work across devices
5. ✅ Seamless experience for existing users

**Your multi-device authentication system is ready!** 🎉