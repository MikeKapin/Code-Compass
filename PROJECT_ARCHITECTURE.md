# Code Compass - Project Architecture & Feature Documentation

**Version:** 2.2.0
**Last Updated:** January 2025
**Purpose:** Complete project structure reference for AI assistants, developers, and future builds

---

## 🏗️ Project Overview

Code Compass is a premium mobile/web application for Canadian gas technicians, providing instant access to CSA B149.1-25, B149.2-25 code books, Ontario regulations, and AI-powered interpretations.

**Tech Stack:**
- Frontend: Vanilla JavaScript, Vite, HTML/CSS
- Backend: Netlify Functions (Node.js serverless)
- Database: Vercel Postgres
- Email: Resend API
- Payment: Stripe
- Hosting: Netlify
- Domain: codecompassapp.netlify.app (main app), larklabs.org (company site)

---

## 📂 Core File Structure

```
Code Compass/
├── src/                          # Frontend source code
│   ├── main.js                   # App initialization
│   ├── styles.css                # Global styles
│   └── utils/
│       ├── activationManager.js  # Activation code validation
│       ├── paymentHandler.js     # Stripe checkout + email integration
│       ├── aiInterpreter.js      # Claude AI integration
│       └── analyticsManager.js   # Usage tracking
│
├── netlify/functions/            # Serverless backend functions
│   ├── activation-manager.js     # Code generation & validation
│   ├── send-activation-email.js  # ✨ NEW: Resend email integration
│   ├── payment-webhook.js        # Stripe webhook handler
│   ├── ai-interpreter.js         # AI API proxy
│   ├── analytics.js              # Analytics tracking
│   └── auth.js                   # JWT authentication
│
├── data/                         # Code books & regulations
│   ├── codeData.js              # CSA B149.1-25 & B149.2-25
│   ├── regulationsData.js       # Ontario Regulations
│   └── *.pdf                    # PDF source files
│
├── docs/                         # Documentation
│   ├── EMAIL_AUTOMATION_SETUP.md      # Email system setup guide
│   ├── DOMAIN_VERIFICATION_GUIDE.md   # DNS & domain verification
│   ├── ADD_RESEND_DNS_RECORDS.md      # Resend DNS instructions
│   ├── CUSTOMER_SUPPORT.md            # Support procedures
│   ├── VERCEL_POSTGRES_SETUP.md       # Database setup
│   └── PROJECT_ARCHITECTURE.md        # This file
│
├── index.html                    # Main app entry
├── test-activation-email.html    # Email testing interface
├── netlify.toml                  # Netlify configuration
├── vite.config.js               # Build configuration
└── package.json                 # Dependencies
```

---

## ✨ Major Features & Systems

### 1. Activation Code System
**Location:** `netlify/functions/activation-manager.js`, `src/utils/activationManager.js`

**Code Format:** `XXXXXX25` (6 random chars + 2-digit year)
- Annual subscription: 12 months validity
- Device limit: 4 activations per code
- Special codes: DEV79MK1 (unlimited), CODECMPS (master)

**Key Functions:**
- `generatePaidUserCode()` - Creates new activation codes
- `validateActivationCode()` - Checks validity & device limits
- `recordActivation()` - Stores device activations in Postgres

**Database Tables:**
- `activations` - Stores activation records
- `device_activations` - Tracks device usage

---

### 2. 🎉 Email Automation System (NEW - Jan 2025)

**Location:** `netlify/functions/send-activation-email.js`, `src/utils/paymentHandler.js`

**Purpose:** Automatically send activation codes to customers after purchase

**Architecture:**
```
Purchase Flow:
1. Customer completes Stripe checkout
2. paymentHandler.js generates activation code
3. Modal shows code with copy button (permanent, won't disappear)
4. send-activation-email.js triggers automatically
5. Email sent via Resend API to customer
```

**Email Configuration:**
- Service: Resend (https://resend.com)
- Sender: `LARK Labs <noreply@larklabs.org>`
- Domain: larklabs.org (verified with DKIM, SPF, DMARC, MX records)
- API Key: Stored in Netlify env var `RESEND_API_KEY`

**Key Files:**
- `netlify/functions/send-activation-email.js` - Email sending function
- `src/utils/paymentHandler.js` (lines 210-247) - Email trigger on payment success
- `src/utils/paymentHandler.js` (lines 370-459) - Permanent modal with copy button
- `test-activation-email.html` - Testing interface

**Environment Variables Required:**
```
RESEND_API_KEY=re_XXXXX...
```

**DNS Records (on larklabs.org via Netlify DNS):**
```
MX:    send.larklabs.org → feedback-smtp.us-east-1.amazonses.com
TXT:   send.larklabs.org → v=spf1 include:amazonses.com ~all
TXT:   resend._domainkey.larklabs.org → [DKIM key]
TXT:   _dmarc.larklabs.org → v=DMARC1; p=none;
```

**Testing:**
- Manual test: `test-activation-email.html`
- CLI test: See CUSTOMER_SUPPORT.md for curl commands

**Documentation:**
- Setup guide: `EMAIL_AUTOMATION_SETUP.md`
- Domain verification: `DOMAIN_VERIFICATION_GUIDE.md`
- DNS records: `ADD_RESEND_DNS_RECORDS.md`
- Support procedures: `CUSTOMER_SUPPORT.md`

---

### 3. Payment Processing
**Location:** `src/utils/paymentHandler.js`, `netlify/functions/payment-webhook.js`

**Flow:**
1. User clicks "Buy Premium" → Stripe Checkout
2. After payment → `paymentHandler.js` generates code
3. Permanent modal displays code with copy button
4. Email sent automatically to customer
5. Webhook validates payment and stores in database

**Stripe Configuration:**
- Product: Code Compass Annual License
- Price: $79.00 CAD
- Success URL: `/?success=true&session_id={CHECKOUT_SESSION_ID}`

**Modal Fix (Jan 2025):**
- Changed from 10-second auto-dismiss banner to permanent modal
- Added copy-to-clipboard button
- Warning message to save code
- Only closes when user clicks "Continue"

---

### 4. AI Code Interpreter
**Location:** `src/utils/aiInterpreter.js`, `netlify/functions/ai-interpreter.js`

**Purpose:** Explain gas code clauses in plain language using Claude AI

**API:** Anthropic Claude (claude-3-5-sonnet-20241022)
**Environment Variable:** `ANTHROPIC_API_KEY`

**Features:**
- Context-aware explanations
- Real-world examples
- Safety considerations
- Related code references

---

### 5. Analytics System
**Location:** `src/utils/analyticsManager.js`, `netlify/functions/analytics.js`

**Tracks:**
- Clause views
- Search queries
- Feature usage
- Activation events

**Storage:** Vercel Postgres

---

### 6. Authentication System
**Location:** `netlify/functions/auth.js`

**Method:** JWT tokens
**Environment Variable:** `JWT_SECRET`
**Purpose:** Secure API endpoints

---

## 🔧 Environment Variables

**Netlify Environment Variables (codecompassapp site):**
```bash
RESEND_API_KEY=re_9NAWrdRy_4GqbjfVWzPjaJXeZHzBX9zWA
ANTHROPIC_API_KEY=sk-ant-xxxxx
JWT_SECRET=xxxxx
POSTGRES_URL=postgres://xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Setting Environment Variables:**
1. Go to: https://app.netlify.com/sites/codecompassapp/settings/env
2. Add/edit variables
3. Set scope to "All" (Builds, Deploy previews, Branch deploys)
4. After changes: "Trigger deploy" → "Clear cache and deploy site"

---

## 🚀 Deployment

**Hosting:** Netlify
**Site:** codecompassapp (https://codecompassapp.netlify.app)
**Build Command:** `npm run build`
**Publish Directory:** `dist`

**Deployment Trigger:**
- Automatic on git push to main branch
- Manual via `netlify deploy --prod`

**Build Process:**
1. Vite builds frontend → `dist/`
2. Netlify bundles functions → `.netlify/functions/`
3. Deploy to CDN
4. Functions deployed to AWS Lambda

---

## 📧 Email System Details

### Resend Integration (Jan 2025)

**Why Resend?**
- Simple REST API
- Free tier: 100 emails/day, 3000/month
- Professional deliverability
- Built-in DKIM/SPF/DMARC

**Domain Setup:**
1. Domain registered: larklabs.org (on Netlify)
2. DNS managed through: Netlify project "larklabs" (ID: 9872b0cb-6737-45fe-89ea-ab03c0fb4422)
3. Domain verified in Resend: ✅ Active
4. Sender email: noreply@larklabs.org

**Email Template:**
- Professional HTML design
- Activation code prominently displayed
- Activation instructions
- Subscription details
- Branding: LARK Labs colors and logo
- Footer with company info

**Email Flow:**
```
1. Stripe payment completes
2. paymentHandler.js (line 210) calls email function
3. send-activation-email.js formats HTML email
4. Resend API sends email
5. Customer receives within seconds
6. Logs success/failure to console
```

**Error Handling:**
- API key validation
- Response logging
- Detailed error messages
- Graceful fallback (manual email if fails)

**Testing Commands:**
```bash
# Test via web interface
open test-activation-email.html

# Test via CLI
curl -X POST https://codecompassapp.netlify.app/.netlify/functions/send-activation-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "activationCode": "TEST1234",
    "customerName": "John Doe",
    "subscriptionData": {
      "subscriptionYear": 2025,
      "expiresAt": "2026-10-10T00:00:00.000Z",
      "plan": "annual"
    }
  }'
```

---

## 🗄️ Database Schema

**Platform:** Vercel Postgres
**Connection:** `POSTGRES_URL` environment variable

**Tables:**

### activations
```sql
CREATE TABLE activations (
    id SERIAL PRIMARY KEY,
    activation_code VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    max_devices INT DEFAULT 4,
    customer_id VARCHAR(255),
    subscription_id VARCHAR(255)
);
```

### device_activations
```sql
CREATE TABLE device_activations (
    id SERIAL PRIMARY KEY,
    activation_code VARCHAR(20) REFERENCES activations(activation_code),
    device_id VARCHAR(255) NOT NULL,
    activated_at TIMESTAMP DEFAULT NOW(),
    device_info JSONB
);
```

### analytics
```sql
CREATE TABLE analytics (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50),
    event_data JSONB,
    user_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Security

**Best Practices:**
- All API keys in environment variables (never in code)
- JWT authentication for sensitive endpoints
- CORS configured for API functions
- Stripe webhook signature verification
- SQL injection prevention (parameterized queries)
- Rate limiting on API endpoints

---

## 🧪 Testing

**Email Testing:**
- Interface: `test-activation-email.html`
- Script: `test-resend-api.js`
- Function: `test-netlify-function.js`

**Local Development:**
```bash
npm install
netlify dev  # Runs functions locally
```

**Production Testing:**
```bash
# Test email system
node test-resend-api.js

# Test activation codes
# See CUSTOMER_SUPPORT.md for procedures
```

---

## 📱 Mobile Integration

**Platform:** Capacitor (iOS/Android)
**Builds:** Via Capacitor CLI
**API Endpoints:** Point to production Netlify functions

**Important:** When running on mobile, paymentHandler.js detects Capacitor and uses full URLs:
```javascript
const emailApiEndpoint = window.location.protocol === 'capacitor:'
    ? 'https://codecompassapp.netlify.app/.netlify/functions/send-activation-email'
    : '/.netlify/functions/send-activation-email';
```

---

## 🐛 Troubleshooting

### Email Not Sending
1. Check `RESEND_API_KEY` in Netlify env vars
2. Verify domain status at resend.com/domains
3. Check function logs: https://app.netlify.com/projects/codecompassapp/logs/functions
4. Test direct API: `node test-resend-api.js`

### Activation Code Issues
1. Check database connection (`POSTGRES_URL`)
2. Verify code format: `XXXXXX25`
3. Check device limit (max 4 activations)
4. See CUSTOMER_SUPPORT.md for recovery procedures

### Deployment Failures
1. Check build logs: https://app.netlify.com/projects/codecompassapp/deploys
2. Verify all environment variables are set
3. Clear build cache: "Trigger deploy" → "Clear cache and deploy"

---

## 📝 Customer Support Procedures

**Generating Activation Codes:**
```bash
node -e "const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let code = ''; for (let i = 0; i < 6; i++) { code += chars.charAt(Math.floor(Math.random() * chars.length)); } console.log(code + '25');"
```

**Resending Activation Emails:**
```bash
curl -X POST https://codecompassapp.netlify.app/.netlify/functions/send-activation-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@email.com",
    "activationCode": "ABC12325",
    "customerName": "Customer Name",
    "subscriptionData": {
      "subscriptionYear": 2025,
      "expiresAt": "2026-10-10T00:00:00.000Z",
      "plan": "annual"
    }
  }'
```

**See:** `CUSTOMER_SUPPORT.md` for complete procedures

---

## 🔄 Recent Updates

### January 2025 - Email Automation System
- ✅ Integrated Resend email service
- ✅ Verified larklabs.org domain with DKIM/SPF/DMARC
- ✅ Added automatic email sending on purchase
- ✅ Created permanent modal with copy button (replaced auto-dismiss banner)
- ✅ Added test interfaces and documentation
- ✅ Fixed API key configuration in Netlify

**Files Created:**
- `netlify/functions/send-activation-email.js`
- `test-activation-email.html`
- `EMAIL_AUTOMATION_SETUP.md`
- `DOMAIN_VERIFICATION_GUIDE.md`
- `ADD_RESEND_DNS_RECORDS.md`
- `CUSTOMER_SUPPORT.md`
- `PROJECT_ARCHITECTURE.md` (this file)

**Files Modified:**
- `src/utils/paymentHandler.js` (lines 210-247: email integration, lines 370-459: modal fix)

---

## 🚧 Future Enhancements

**Planned Features:**
1. Customer self-service portal
2. Automatic renewal reminders
3. Device management interface
4. Receipt emails with PDF invoices
5. Multi-language support
6. Offline mode for mobile app

---

## 📞 Contact & Resources

**Developer:** Mike Kapusty
**Company:** LARK Labs
**Website:** https://larklabs.org
**Support Email:** (via reply to activation emails)

**External Services:**
- Netlify Dashboard: https://app.netlify.com/projects/codecompassapp
- Resend Dashboard: https://resend.com/domains
- Stripe Dashboard: https://dashboard.stripe.com
- Vercel Postgres: https://vercel.com/dashboard

**Documentation:**
- Resend API: https://resend.com/docs
- Stripe API: https://stripe.com/docs/api
- Netlify Functions: https://docs.netlify.com/functions
- Capacitor: https://capacitorjs.com/docs

---

## 🤖 AI Assistant Notes

**For Future Builds & Edits:**

1. **Email System:** Always use `noreply@larklabs.org` as sender (verified domain). Never change back to `onboarding@resend.dev`.

2. **DNS Management:** Domain managed through Netlify project "larklabs" (NOT codecompassapp). DNS records at: https://app.netlify.com/teams/m-kapin/dns/larklabs.org

3. **Modal Behavior:** Activation code modal must be permanent (user-dismissible only). Never revert to auto-dismiss.

4. **Environment Variables:** All API keys must be in Netlify env vars, never hardcoded. After env var changes, always clear cache and redeploy.

5. **Testing:** Before customer-facing changes, test email system with `test-activation-email.html` or `test-resend-api.js`.

6. **Database:** All activation codes stored in Vercel Postgres. Never generate codes without database storage.

7. **Error Logging:** Always include detailed error messages in function logs for debugging.

8. **Customer Support:** Reference `CUSTOMER_SUPPORT.md` for standard procedures. Never improvise code generation methods.

---

**Last Major Update:** January 17, 2025 - Email Automation System Fully Deployed ✅
