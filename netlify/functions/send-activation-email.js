// netlify/functions/send-activation-email.js
// Send activation code email to customer after successful payment

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { email, activationCode, customerName, subscriptionData } = JSON.parse(event.body || '{}');

        if (!email || !activationCode) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Email and activation code are required'
                })
            };
        }

        console.log('Sending activation email to:', email);

        // Choose your email service (uncomment the one you want to use):

        // Option 1: Resend (recommended - free tier: 100 emails/day)
        const emailSent = await sendEmailWithResend(email, activationCode, customerName, subscriptionData);

        // Option 2: SendGrid (free tier: 100 emails/day)
        // const emailSent = await sendEmailWithSendGrid(email, activationCode, customerName, subscriptionData);

        // Option 3: Mailgun (free tier: 5000 emails/month)
        // const emailSent = await sendEmailWithMailgun(email, activationCode, customerName, subscriptionData);

        if (emailSent) {
            console.log('✅ Activation email sent successfully to:', email);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Activation email sent successfully'
                })
            };
        } else {
            throw new Error('Failed to send email');
        }

    } catch (error) {
        console.error('Email sending error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to send activation email',
                message: error.message
            })
        };
    }
};

// OPTION 1: Resend (https://resend.com)
async function sendEmailWithResend(email, activationCode, customerName, subscriptionData) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured');
        return false;
    }

    const expiryDate = subscriptionData?.expiresAt
        ? new Date(subscriptionData.expiresAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'October 2026';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
        .code-box { background: #f8fafc; border: 3px solid #4CAF50; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
        .activation-code { font-size: 32px; font-weight: 700; color: #4CAF50; letter-spacing: 8px; font-family: monospace; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 0; }
        .info-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🧭 Code Compass</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Activation Code is Ready!</p>
        </div>

        <div class="content">
            <p>Hi ${customerName || 'there'},</p>

            <p><strong>Thank you for purchasing Code Compass!</strong> We're excited to have you as a customer.</p>

            <div class="code-box">
                <p style="margin: 0 0 15px 0; font-weight: 600; color: #333;">Your Activation Code:</p>
                <div class="activation-code">${activationCode}</div>
            </div>

            <div class="info-box">
                <p style="margin: 0;"><strong>✅ Subscription Details:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Valid until: ${expiryDate} (12 months)</li>
                    <li>Device activations: 4 devices</li>
                    <li>Full access to all premium features</li>
                </ul>
            </div>

            <h3 style="color: #333; margin-top: 25px;">📲 How to Activate:</h3>
            <ol style="line-height: 1.8;">
                <li>Open Code Compass on your device</li>
                <li>Tap the lock icon or "Premium" button</li>
                <li>Select "Already have an activation code?"</li>
                <li>Enter your code: <strong>${activationCode}</strong></li>
                <li>Tap "Activate Premium Features"</li>
            </ol>

            <p><strong>What's Included:</strong></p>
            <ul style="line-height: 1.8;">
                <li>Complete CSA B149.1-25 & B149.2-25 code books (1,118+ clauses)</li>
                <li>AI-powered code explanations</li>
                <li>Ontario Regulations (211, 215, 220, 223)</li>
                <li>Pressure controls, piping systems, venting requirements</li>
                <li>All technical annexes</li>
            </ul>

            <div style="background: #fff7ed; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>💾 Important:</strong> Save this email! You can use this activation code on up to 4 devices.</p>
            </div>

            <p>Need help? Just reply to this email and we'll be happy to assist you!</p>

            <p>Best regards,<br>
            <strong>Mike Kapusty</strong><br>
            LARK Labs<br>
            <a href="https://larklabs.org" style="color: #667eea;">larklabs.org</a></p>
        </div>

        <div class="footer">
            <p>P.S. If you find Code Compass helpful, we'd love if you could leave us a review!</p>
            <p style="font-size: 12px; color: #999;">
                LARK Labs | Gas Technician Tools & Training<br>
                You received this email because you purchased Code Compass.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'LARK Labs <noreply@larklabs.org>', // ✅ Verified domain!
                to: email,
                subject: 'Your Code Compass Activation Code - Thank You for Your Purchase! 🧭',
                html: emailHtml
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Resend API error:', error);
            return false;
        }

        const result = await response.json();
        console.log('Resend email sent:', result.id);
        return true;

    } catch (error) {
        console.error('Resend error:', error);
        return false;
    }
}

// OPTION 2: SendGrid
async function sendEmailWithSendGrid(email, activationCode, customerName, subscriptionData) {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

    if (!SENDGRID_API_KEY) {
        console.error('SENDGRID_API_KEY not configured');
        return false;
    }

    // Similar implementation as Resend but using SendGrid's API
    // See: https://docs.sendgrid.com/api-reference/mail-send/mail-send

    try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SENDGRID_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{
                    to: [{ email: email }],
                    subject: 'Your Code Compass Activation Code'
                }],
                from: { email: 'noreply@larklabs.org', name: 'LARK Labs' },
                content: [{
                    type: 'text/html',
                    value: `Your activation code is: ${activationCode}`
                }]
            })
        });

        return response.ok;
    } catch (error) {
        console.error('SendGrid error:', error);
        return false;
    }
}

// OPTION 3: Mailgun
async function sendEmailWithMailgun(email, activationCode, customerName, subscriptionData) {
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;

    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
        console.error('Mailgun credentials not configured');
        return false;
    }

    // Mailgun implementation
    // See: https://documentation.mailgun.com/en/latest/api-sending.html

    return false; // Implement as needed
}
