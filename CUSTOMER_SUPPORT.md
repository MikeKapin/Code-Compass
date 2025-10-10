# Code Compass - Customer Support Guide

## Active Customer Issues

### L Phiapi Solo - lphiapisolo@gmail.com
**Date:** October 9, 2025
**Issue:** Activation code disappeared before customer could copy it
**Status:** ✅ Resolved
**Subscription ID:** sub_1SGX4PLBCeJ6ojDNKB0HNtrt

**Generated Activation Code:** `JSL4DI25`

**Actions Taken:**
1. ✅ Generated replacement activation code
2. ✅ Fixed modal to prevent code from disappearing (now permanent until manually closed)
3. ✅ Set up automated email delivery for future purchases
4. ⏳ Email with code sent to customer

---

## How to Generate Activation Codes for Customers

If a customer loses their activation code or encounters similar issues:

### Method 1: Generate New Code (Recommended)
```bash
node -e "const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let code = ''; for (let i = 0; i < 6; i++) { code += chars.charAt(Math.floor(Math.random() * chars.length)); } console.log(code + '25');"
```

This generates a valid 2025 annual subscription code (format: XXXXXX25)

### Method 2: Use Console Command
1. Open browser console on Code Compass site (F12)
2. Run:
```javascript
fetch('/.netlify/functions/activation-manager', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create_paid_user_code',
    email: 'customer@email.com',
    paymentData: {
      session_id: 'sub_XXXXX',
      customer_id: 'cus_XXXXX'
    }
  })
})
.then(r => r.json())
.then(result => console.log('New Code:', result.activationCode));
```

---

## Activation Code Format

**Annual Subscription Codes:** `XXXXXX25`
- First 6 characters: Random alphanumeric
- Last 2 digits: Year suffix (25 = 2025)
- Valid for: 12 months from activation
- Device limit: 4 devices

**Special Codes:**
- `DEV79MK1` - Developer unlimited access
- `CODECMPS` - Master code
- `SHOW2024` - Trade show 7-day trial
- `TRIAL7DY` - General 7-day trial

---

## Email Template for Lost Codes

Use this template when sending replacement codes:

```
Subject: Your Code Compass Activation Code

Hi [Customer Name],

I apologize for the confusion! Your activation code is:

[CODE HERE]

To activate Code Compass:
1. Open the app on your device
2. Tap the lock icon or "Premium" button
3. Select "Already have an activation code?"
4. Enter: [CODE HERE]
5. Tap "Activate Premium Features"

Your subscription details:
• Valid until: [DATE]
• Devices: 4 activations available
• Subscription ID: [STRIPE SUBSCRIPTION ID]

If you have any other questions, please don't hesitate to reach out!

Best regards,
Mike Kapusty
LARK Labs
```

---

## Checking Customer Subscriptions

### In Stripe Dashboard
1. Go to https://dashboard.stripe.com
2. Search for customer email
3. View subscription details
4. Check payment status and history

### Common Customer Questions

**Q: "I lost my activation code"**
A: Generate a new code using Method 1 above, send via email

**Q: "Code says 'Maximum activations reached'"**
A: Check how many devices they've used (max 4). If legitimate, generate new code.

**Q: "Code expired"**
A: Annual codes expire after 12 months. Generate new code for renewal.

**Q: "Email not received"**
A: Check spam folder. If still missing, send code manually.

**Q: "Can I use on more than 4 devices?"**
A: No, each code is limited to 4 devices. They can remove a device or purchase additional license.

---

## Testing Email System

After deployment, test email delivery:

1. Open: `https://codecompassapp.netlify.app/test-activation-email.html`
2. Enter your email
3. Click "Send Test Email"
4. Verify email arrives and looks professional

---

## Future Improvements

**Planned Features:**
1. Customer portal to view activation status
2. Self-service code recovery system
3. Automatic renewal reminders
4. Device management interface
5. Email receipts with codes attached

---

## Contact for Issues

**Developer:** Mike Kapusty
**Email:** [your-support-email]
**Documentation:** See `EMAIL_AUTOMATION_SETUP.md` for email system
**Test Page:** `/test-activation-email.html`
