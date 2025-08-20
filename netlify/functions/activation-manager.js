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
            
            case 'use_activation_code':
                return await useActivationCode(activationCode, deviceId, headers);
            
            case 'check_activation':
                return await checkActivation(activationCode, deviceId, headers);
            
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
    // In production, fetch from database
    // For demo, we'll simulate the check
    
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

// Get date one year from now
function getYearFromNow() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString();
}