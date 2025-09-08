// netlify/functions/activation-manager.js
// Manage premium activation codes and device activations

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { action, activationCode, deviceId, email, sessionId } = JSON.parse(event.body || '{}');

        // Simple in-memory storage (replace with database in production)
        // For now, using Netlify environment variables or external service
        
        switch (action) {
            case 'create_activation_code':
                return await createActivationCode(email, sessionId, headers);
            
            case 'create_paid_user_code':
                return await createPaidUserCode(email, JSON.parse(event.body).paymentData || {}, headers);
            
            case 'use_activation_code':
                return await useActivationCode(activationCode, deviceId, headers);
            
            case 'check_activation':
                return await checkActivation(activationCode, deviceId, headers);
            
            case 'renew_subscription':
                return await renewSubscription(JSON.parse(event.body).oldCode, email, headers);
            
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid action' })
                };
        }

    } catch (error) {
        console.error('Activation manager error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: error.message 
            })
        };
    }
};

// Create new activation code after successful payment
async function createActivationCode(email, sessionId, headers) {
    // Generate unique 8-digit activation code
    const activationCode = generateActivationCode();
    
    const activationData = {
        code: activationCode,
        email: email,
        sessionId: sessionId,
        maxActivations: 4,
        usedActivations: 0,
        devices: [],
        createdAt: new Date().toISOString(),
        expiresAt: getYearFromNow()
    };

    // Store activation code (in production, use a database)
    // For now, we'll return it and let the client handle storage
    
    console.log('Created activation code:', activationCode, 'for email:', email);
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            activationCode: activationCode,
            maxActivations: 4,
            message: `Your activation code is: ${activationCode}. You can use this code on up to 4 devices.`
        })
    };
}

// Use activation code on a device
async function useActivationCode(activationCode, deviceId, headers) {
    // Master developer codes with unlimited access
    const masterCodes = [
        'DEV79MK1', // Master code for Mike (developer access)
        'CODECMPS', // Code Compass master
        'DEVUNLTD'  // Developer unlimited backup
    ];
    
    // 7-day trial codes for trade shows (can be used by multiple people)
    const trialCodes = [
        'SHOW2024', // Trade show demo code
        'TRIAL7DY', // 7-day trial code
        'EXPO2024', // Exhibition code
        'DEMO7DAY'  // Demo code
    ];
    
    if (masterCodes.includes(activationCode.toUpperCase())) {
        console.log('Master developer code used:', activationCode);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                activated: true,
                masterCode: true,
                message: 'Developer master code activated - unlimited device access!',
                usedActivations: 0,
                remainingActivations: 999,
                expiresAt: '2030-12-31T23:59:59.000Z' // Long expiration for testing
            })
        };
    }
    
    if (trialCodes.includes(activationCode.toUpperCase())) {
        console.log('Trade show trial code used:', activationCode);
        
        // Calculate 7 days from now
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                activated: true,
                trialCode: true,
                message: 'Trade show trial activated! Full access for 7 days, then reverts to free version.',
                usedActivations: 0,
                remainingActivations: 1, // Single use per device
                expiresAt: expirationDate.toISOString(),
                trialDays: 7,
                isTrialActivation: true
            })
        };
    }
    
    // Check for paid user codes (XXXXXXXX format with year suffix)
    if (/^[A-Z0-9]{6}\d{2}$/.test(activationCode.toUpperCase())) {
        return await validatePaidUserCode(activationCode, deviceId, headers);
    }
    
    // Regular activation code validation
    if (!activationCode || activationCode.length !== 8) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Invalid activation code format'
            })
        };
    }

    // Simulate activation logic
    const mockActivationData = {
        code: activationCode,
        maxActivations: 4,
        usedActivations: Math.floor(Math.random() * 2), // Simulate current usage
        devices: [],
        expiresAt: getYearFromNow()
    };

    // Check if device already activated
    if (mockActivationData.devices.includes(deviceId)) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                alreadyActivated: true,
                message: 'This device is already activated',
                remainingActivations: mockActivationData.maxActivations - mockActivationData.usedActivations
            })
        };
    }

    // Check if activations exceeded
    if (mockActivationData.usedActivations >= mockActivationData.maxActivations) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Maximum activations (4) reached for this code',
                usedActivations: mockActivationData.usedActivations,
                maxActivations: mockActivationData.maxActivations
            })
        };
    }

    // Add device and increment usage
    mockActivationData.devices.push(deviceId);
    mockActivationData.usedActivations++;

    // In production, save to database here

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            activated: true,
            message: 'Device activated successfully!',
            usedActivations: mockActivationData.usedActivations,
            remainingActivations: mockActivationData.maxActivations - mockActivationData.usedActivations,
            expiresAt: mockActivationData.expiresAt
        })
    };
}

// Check if device is activated
async function checkActivation(activationCode, deviceId, headers) {
    // Simulate check
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            isActivated: Math.random() > 0.5, // Simulate random result
            remainingActivations: Math.floor(Math.random() * 4)
        })
    };
}

// Generate 8-digit activation code
function generateActivationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Validate paid user codes (annual subscription)
async function validatePaidUserCode(activationCode, deviceId, headers) {
    const upperCode = activationCode.toUpperCase();
    
    // Extract year from last 2 digits
    const yearSuffix = parseInt(upperCode.slice(-2));
    const currentYear = new Date().getFullYear() % 100;
    
    // Validate year suffix (current year, previous year, and next year for flexibility)
    if (yearSuffix < (currentYear - 1) || yearSuffix > (currentYear + 1)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Activation code has expired or is invalid'
            })
        };
    }
    
    // Calculate expiration date (12 months from activation date)
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1); // 12 months from now
    
    console.log('Paid user code validated:', upperCode, 'expires:', expirationDate.toISOString());
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            activated: true,
            paidCode: true,
            message: `Annual subscription activated! Premium access until ${expirationDate.toLocaleDateString()}.`,
            usedActivations: 1,
            remainingActivations: 3, // 4 devices total - 1 used
            expiresAt: expirationDate.toISOString(),
            subscriptionYear: 2000 + yearSuffix,
            codeType: 'annual_subscription'
        })
    };
}

// Generate paid user activation code
function generatePaidUserCode(subscriptionYear) {
    const year = subscriptionYear || new Date().getFullYear();
    const yearSuffix = (year % 100).toString().padStart(2, '0');
    
    // Generate 6 random characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return code + yearSuffix;
}

// Create paid user activation code after successful payment
async function createPaidUserCode(email, paymentData, headers) {
    const subscriptionYear = new Date().getFullYear();
    const activationCode = generatePaidUserCode(subscriptionYear);
    
    const activationData = {
        code: activationCode,
        email: email,
        paymentId: paymentData.paymentId || paymentData.session_id || `pay_${Date.now()}`,
        subscriptionYear: subscriptionYear,
        maxActivations: 4,
        usedActivations: 0,
        devices: [],
        createdAt: new Date().toISOString(),
        expiresAt: getExpirationDate(subscriptionYear),
        renewalDate: getExpirationDate(subscriptionYear), // When to generate new code
        codeType: 'annual_subscription'
    };

    // In production, store this in your database
    console.log('Created paid user activation code:', activationCode, 'for email:', email);
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            activationCode: activationCode,
            subscriptionYear: subscriptionYear,
            maxActivations: 4,
            expiresAt: activationData.expiresAt,
            renewalDate: activationData.renewalDate,
            message: `Your annual activation code is: ${activationCode}. Valid until ${new Date(activationData.expiresAt).toLocaleDateString()}. You can use this code on up to 4 devices.`,
            codeType: 'annual_subscription'
        })
    };
}

// Auto-renew subscription and generate new code
async function renewSubscription(oldCode, email, headers) {
    const nextYear = new Date().getFullYear() + 1;
    const newActivationCode = generatePaidUserCode(nextYear);
    
    console.log('Renewing subscription for:', email, 'Old code:', oldCode, 'New code:', newActivationCode);
    
    const renewalData = {
        oldCode: oldCode,
        newCode: newActivationCode,
        email: email,
        subscriptionYear: nextYear,
        maxActivations: 4,
        usedActivations: 0,
        devices: [],
        createdAt: new Date().toISOString(),
        expiresAt: getExpirationDate(nextYear),
        renewalDate: getExpirationDate(nextYear),
        codeType: 'annual_subscription_renewal'
    };
    
    // In production, store this in your database and send email to user
    console.log('Created renewal code:', newActivationCode, 'for year:', nextYear);
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            activationCode: newActivationCode,
            subscriptionYear: nextYear,
            maxActivations: 4,
            expiresAt: renewalData.expiresAt,
            renewalDate: renewalData.renewalDate,
            message: `Your subscription has been renewed! New activation code: ${newActivationCode}. Valid until ${new Date(renewalData.expiresAt).toLocaleDateString()}.`,
            codeType: 'annual_subscription_renewal'
        })
    };
}

// Get expiration date for a given subscription (12 months from creation)
function getExpirationDate(subscriptionYear) {
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1); // 12 months from now
    return expirationDate.toISOString();
}

// Get date one year from now
function getYearFromNow() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString();
}