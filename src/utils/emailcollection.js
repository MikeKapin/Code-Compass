// utils/emailcollection.js
// Email validation and collection utilities

// Email validation function
export const validateEmail = (email) => {
  const errors = [];
  
  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  // Length validation
  if (email.length > 254) {
    errors.push('Email address is too long');
  }
  
  // Check for common typos
  const commonDomainTypos = {
    'gmail.co': 'gmail.com',
    'gmail.cm': 'gmail.com',
    'gmial.com': 'gmail.com',
    'yahoo.co': 'yahoo.com',
    'yahoo.cm': 'yahoo.com',
    'hotmail.co': 'hotmail.com',
    'hotmail.cm': 'hotmail.com',
    'outlook.co': 'outlook.com',
    'outlook.cm': 'outlook.com'
  };
  
  const domain = email.split('@')[1];
  if (domain && commonDomainTypos[domain]) {
    errors.push(`Did you mean ${email.split('@')[0]}@${commonDomainTypos[domain]}?`);
  }
  
  // Disposable email detection (basic list)
  const disposableEmails = [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email',
    'temp-mail.org'
  ];
  
  if (domain && disposableEmails.includes(domain.toLowerCase())) {
    errors.push('Please use a permanent email address');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    email: email.toLowerCase().trim()
  };
};

// Submit email to your service
export const submitEmailToService = async (email, source = 'trial_signup') => {
  const validatedEmail = validateEmail(email);
  
  if (!validatedEmail.isValid) {
    throw new Error(validatedEmail.errors[0]);
  }

  // Prepare data to send
  const emailData = {
    email: validatedEmail.email,
    source,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    url: window.location.href
  };

  try {
    // Option 1: Send to your own API
    if (shouldUseAPI()) {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit email');
      }

      return await response.json();
    }

    // Option 2: Send to email marketing service (Mailchimp, ConvertKit, etc.)
    return await submitToEmailService(emailData);

  } catch (error) {
    console.error('Email submission error:', error);
    
    // Store locally as backup
    storeEmailLocally(emailData);
    
    // Don't throw error to user - let trial proceed
    return { success: true, stored_locally: true };
  }
};

// Check if we should use API (not on localhost)
const shouldUseAPI = () => {
  return window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1';
};

// Submit to email marketing service
const submitToEmailService = async (emailData) => {
  // Example for Mailchimp
  if (window.MAILCHIMP_API_KEY && window.MAILCHIMP_LIST_ID) {
    return await submitToMailchimp(emailData);
  }

  // Example for ConvertKit
  if (window.CONVERTKIT_API_KEY && window.CONVERTKIT_FORM_ID) {
    return await submitToConvertKit(emailData);
  }

  // Example for a webhook service like Zapier
  if (window.WEBHOOK_URL) {
    return await submitToWebhook(emailData);
  }

  // If no service configured, just store locally
  storeEmailLocally(emailData);
  return { success: true, stored_locally: true };
};

// Mailchimp integration example
const submitToMailchimp = async (emailData) => {
  const response = await fetch(`https://us1.api.mailchimp.com/3.0/lists/${window.MAILCHIMP_LIST_ID}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `apikey ${window.MAILCHIMP_API_KEY}`
    },
    body: JSON.stringify({
      email_address: emailData.email,
      status: 'subscribed',
      tags: [emailData.source],
      merge_fields: {
        SOURCE: emailData.source,
        SIGNUP_URL: emailData.url
      }
    })
  });

  if (!response.ok) {
    throw new Error('Mailchimp submission failed');
  }

  return await response.json();
};

// ConvertKit integration example
const submitToConvertKit = async (emailData) => {
  const response = await fetch(`https://api.convertkit.com/v3/forms/${window.CONVERTKIT_FORM_ID}/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: window.CONVERTKIT_API_KEY,
      email: emailData.email,
      tags: [emailData.source]
    })
  });

  if (!response.ok) {
    throw new Error('ConvertKit submission failed');
  }

  return await response.json();
};

// Webhook integration example (Zapier, Make.com, etc.)
const submitToWebhook = async (emailData) => {
  const response = await fetch(window.WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    throw new Error('Webhook submission failed');
  }

  return { success: true };
};

// Store email locally as backup
const storeEmailLocally = (emailData) => {
  try {
    const emails = JSON.parse(localStorage.getItem('codecompass_emails') || '[]');
    emails.push(emailData);
    
    // Keep only last 50 emails
    if (emails.length > 50) {
      emails.splice(0, emails.length - 50);
    }
    
    localStorage.setItem('codecompass_emails', JSON.stringify(emails));
    console.log('Email stored locally as backup:', emailData.email);
  } catch (error) {
    console.warn('Failed to store email locally:', error);
  }
};

// Get locally stored emails (for debugging/backup)
export const getStoredEmails = () => {
  try {
    return JSON.parse(localStorage.getItem('codecompass_emails') || '[]');
  } catch (error) {
    console.warn('Failed to retrieve stored emails:', error);
    return [];
  }
};

// Clear locally stored emails
export const clearStoredEmails = () => {
  localStorage.removeItem('codecompass_emails');
};

// Email domain analysis
export const analyzeEmailDomain = (email) => {
  const domain = email.split('@')[1];
  
  const businessDomains = [
    'company.com', 'corp.com', 'inc.com', 'ltd.com',
    // Add more business domain patterns
  ];
  
  const personalDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'aol.com', 'live.com'
  ];
  
  const isPersonal = personalDomains.includes(domain.toLowerCase());
  const isBusiness = !isPersonal && (
    businessDomains.includes(domain.toLowerCase()) ||
    !personalDomains.includes(domain.toLowerCase())
  );
  
  return {
    domain,
    isPersonal,
    isBusiness,
    isEducational: domain.endsWith('.edu'),
    isGovernment: domain.endsWith('.gov')
  };
};