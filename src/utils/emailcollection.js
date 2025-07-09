// utils/emailCollection.js
// Simple email collection and validation system

// Email validation with enhanced checks
export const validateEmail = (email) => {
  const errors = [];
  
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
    return { isValid: false, errors };
  }
  
  // Check for common disposable email providers
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
    'mailinator.com', 'throwaway.email', 'temp-mail.org',
    '10minmail.com', 'fakeinbox.com', 'tempail.com'
  ];
  
  const domain = email.split('@')[1].toLowerCase();
  if (disposableDomains.includes(domain)) {
    errors.push('Please use a permanent work email address');
    return { isValid: false, errors };
  }
  
  // Check for common personal email domains (optional warning)
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const isPersonalEmail = personalDomains.includes(domain);
  
  return { 
    isValid: true, 
    errors: [], 
    isPersonalEmail,
    domain 
  };
};

// Store email data locally (for simple tracking)
export const storeEmailData = (email, source = 'trial_gate') => {
  const emailData = {
    email,
    source,
    timestamp: new Date().toISOString(),
    domain: email.split('@')[1],
    userAgent: navigator.userAgent,
    referrer: document.referrer || 'direct'
  };
  
  // Store in localStorage for simple tracking
  const existingEmails = JSON.parse(localStorage.getItem('collectedEmails') || '[]');
  existingEmails.push(emailData);
  localStorage.setItem('collectedEmails', JSON.stringify(existingEmails));
  
  return emailData;
};

// Send email to external service (example integration)
export const submitEmailToService = async (email, source = 'trial_gate') => {
  // Example: Send to your backend, Mailchimp, ConvertKit, etc.
  
  try {
    // Option 1: Send to your own backend
    /*
    const response = await fetch('/api/collect-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source, timestamp: new Date().toISOString() })
    });
    */
    
    // Option 2: Send to Mailchimp (requires API key)
    /*
    const response = await fetch('https://your-region.api.mailchimp.com/3.0/lists/YOUR_LIST_ID/members', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        tags: [source, 'codecompass_trial']
      })
    });
    */
    
    // Option 3: Send to a webhook service like Zapier
    /*
    const response = await fetch('https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        source,
        timestamp: new Date().toISOString(),
        product: 'codecompass'
      })
    });
    */
    
    // For now, just store locally and simulate success
    storeEmailData(email, source);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true, message: 'Email collected successfully' };
    
  } catch (error) {
    console.error('Email submission failed:', error);
    
    // Still store locally as backup
    storeEmailData(email, source);
    
    return { success: false, error: error.message };
  }
};

// Get email statistics (for admin/analytics)
export const getEmailStats = () => {
  const emails = JSON.parse(localStorage.getItem('collectedEmails') || '[]');
  
  const stats = {
    total: emails.length,
    today: emails.filter(e => {
      const today = new Date().toDateString();
      const emailDate = new Date(e.timestamp).toDateString();
      return emailDate === today;
    }).length,
    domains: {},
    sources: {}
  };
  
  emails.forEach(email => {
    // Count domains
    stats.domains[email.domain] = (stats.domains[email.domain] || 0) + 1;
    
    // Count sources
    stats.sources[email.source] = (stats.sources[email.source] || 0) + 1;
  });
  
  return stats;
};

// Email templates for follow-up (if you implement email sending)
export const emailTemplates = {
  trialWelcome: (email) => ({
    subject: "Welcome to your Code Compass trial! 🧭",
    html: `
      <h2>Welcome to Code Compass!</h2>
      <p>Hi there,</p>
      <p>Your 7-day free trial is now active! You can now search through all CSA B149.1-25 gas codes instantly.</p>
      <h3>What you can do during your trial:</h3>
      <ul>
        <li>✅ Unlimited code searches</li>
        <li>✅ Mobile and desktop access</li>
        <li>✅ Always up-to-date regulations</li>
        <li>✅ Fast, intelligent search</li>
      </ul>
      <p><a href="https://codecompass.ninja" style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Start Searching Codes</a></p>
      <p>Your trial ends in 7 days. We'll send you a reminder before it expires.</p>
      <p>Happy searching!<br>The Code Compass Team</p>
    `
  }),
  
  trialReminder: (email, daysLeft) => ({
    subject: `${daysLeft} days left in your Code Compass trial`,
    html: `
      <h2>Your trial expires soon!</h2>
      <p>Hi there,</p>
      <p>Just a friendly reminder that your Code Compass trial expires in ${daysLeft} days.</p>
      <p>Don't lose access to instant CSA code searches!</p>
      <p><a href="https://buy.stripe.com/fZucN6bhHgMcfT81xS7ok00" style="background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Subscribe Now - $49.99/year</a></p>
      <p>Questions? Just reply to this email.</p>
    `
  })
};