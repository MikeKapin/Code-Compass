# Code Compass - Email Automation Setup Guide

This guide will help you set up automatic email delivery for activation codes when customers complete their purchase.

## Overview

When a customer successfully pays for Code Compass, the system will now:
1. ✅ Generate an 8-character activation code
2. ✅ Display it in a permanent modal (won't disappear)
3. ✅ Automatically send an email with the code to the customer
4. ✅ Store the subscription in the database

---

## Step 1: Choose an Email Service

We've configured support for 3 popular email services. Choose one:

### Option A: Resend (Recommended) ⭐
- **Free Tier:** 100 emails/day, 3,000/month
- **Easy Setup:** 5 minutes
- **Best For:** Startups, small businesses
- **Website:** https://resend.com

### Option B: SendGrid
- **Free Tier:** 100 emails/day
- **Easy Setup:** 10 minutes
- **Best For:** Established businesses
- **Website:** https://sendgrid.com

### Option C: Mailgun
- **Free Tier:** 5,000 emails/month
- **Setup:** 15 minutes
- **Best For:** High volume
- **Website:** https://mailgun.com

---

## Step 2: Set Up Resend (Recommended)

### 2.1 Create Resend Account
1. Go to https://resend.com
2. Click "Sign Up" (free account)
3. Verify your email

### 2.2 Get API Key
1. Log into Resend dashboard
2. Go to "API Keys" in the sidebar
3. Click "Create API Key"
4. Name it: "Code Compass Production"
5. Click "Create"
6. **Copy the API key** (starts with `re_`)

### 2.3 Verify Your Domain (Important!)
1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain: `larklabs.org`
4. Add the DNS records they provide to your domain registrar:
   - **TXT record** for verification
   - **CNAME records** for email sending
5. Wait for verification (usually 5-30 minutes)
6. Once verified, you can send from `noreply@larklabs.org`

**Note:** Until your domain is verified, emails will come from `onboarding@resend.dev` which looks unprofessional. Complete domain verification!

### 2.4 Update Email Function
1. Open: `netlify/functions/send-activation-email.js`
2. Find line 47: `from: 'LARK Labs <noreply@larklabs.org>'`
3. Change to your verified domain if different

---

## Step 3: Configure Netlify Environment Variables

### 3.1 Add API Key to Netlify
1. Go to: https://app.netlify.com
2. Select your Code Compass site
3. Go to **Site settings** → **Environment variables**
4. Click "Add a variable"
5. Add the following:

```
Key: RESEND_API_KEY
Value: re_your_api_key_here
```

6. Click "Save"

### 3.2 Redeploy Your Site
After adding the environment variable:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete (~2 minutes)

---

## Step 4: Test the Email System

### 4.1 Test from Your Computer
1. Open browser console (F12)
2. Run this command:
```javascript
fetch('/.netlify/functions/send-activation-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'YOUR_EMAIL@gmail.com',  // ← Change this to your email
    activationCode: 'TEST1234',
    customerName: 'Test User',
    subscriptionData: {
      subscriptionYear: 2025,
      expiresAt: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
      plan: 'annual'
    }
  })
})
.then(r => r.json())
.then(console.log);
```

3. Check your email (including spam folder)
4. You should receive a beautifully formatted email with the activation code!

### 4.2 Test Full Purchase Flow
1. Create a test Stripe payment link (or use test mode)
2. Complete a test purchase
3. Verify:
   - ✅ Activation modal appears
   - ✅ Code is displayed
   - ✅ Email is sent
   - ✅ Copy button works

---

## Step 5: Update Stripe Return URL (Optional)

To pass customer email to the success page:

1. Go to: https://dashboard.stripe.com
2. Find your payment link
3. Edit the "Success URL"
4. Add email parameter:
```
https://codecompassapp.netlify.app/?success=true&session_id={CHECKOUT_SESSION_ID}&email={CUSTOMER_EMAIL}
```

This ensures the customer's email is captured for the automated email.

---

## Troubleshooting

### Email Not Sending?
1. **Check Netlify logs:**
   - Go to Netlify → Functions → `send-activation-email`
   - Look for errors

2. **Verify API Key:**
   - Test API key with curl:
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer re_YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "test@resend.dev",
       "to": "your@email.com",
       "subject": "Test",
       "html": "<p>Test email</p>"
     }'
   ```

3. **Domain Not Verified?**
   - Emails will come from `onboarding@resend.dev`
   - Complete domain verification (Step 2.3)

### Email Going to Spam?
- Complete domain verification (adds SPF/DKIM records)
- Avoid spam trigger words in subject line
- Consider adding a dedicated IP (paid Resend plan)

---

## Email Customization

### Change Email Design
Edit: `netlify/functions/send-activation-email.js`
- Lines 60-200: HTML email template
- Use inline CSS (required for email)
- Test with multiple email clients

### Change Email Content
Common customizations:
- **Subject line:** Line 143
- **Header:** Lines 70-75
- **Message:** Lines 80-120
- **Footer:** Lines 150-160

---

## Cost Estimates

### For 100 customers/month:
- **Resend Free:** $0/month ✅
- **SendGrid Free:** $0/month ✅
- **Mailgun Free:** $0/month ✅

### For 500 customers/month:
- **Resend:** $20/month (10,000 emails/month plan)
- **SendGrid:** $19.95/month (40,000 emails/month)
- **Mailgun:** $35/month (50,000 emails/month)

**Recommendation:** Start with Resend free tier. Upgrade when you exceed 100 emails/day.

---

## What's Next?

After email automation is working:

1. **Set up email templates** for:
   - Welcome email (first purchase)
   - Renewal reminders (30 days before expiry)
   - Failed payment notifications

2. **Track email delivery:**
   - Resend provides delivery analytics
   - Monitor open rates and click rates

3. **Add customer name extraction:**
   - Update Stripe to pass customer name
   - Personalize emails with first name

---

## Support

Need help? Common issues:

1. **"RESEND_API_KEY not configured"**
   → Add environment variable in Netlify (Step 3)

2. **"Domain not verified"**
   → Complete DNS verification (Step 2.3)

3. **Emails not arriving**
   → Check spam folder
   → Verify email address is valid
   → Check Netlify function logs

4. **Want to use SendGrid instead?**
   → Uncomment line 44 in `send-activation-email.js`
   → Comment out line 42
   → Add `SENDGRID_API_KEY` to Netlify

---

## Files Modified

This automation system consists of:
1. `netlify/functions/send-activation-email.js` - Email sending function
2. `src/utils/paymentHandler.js` - Calls email function after payment
3. This setup guide

All changes are committed and ready to deploy!
