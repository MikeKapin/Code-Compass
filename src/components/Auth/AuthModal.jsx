// Authentication modal component
import React, { useState } from 'react';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'reset'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (mode !== 'reset' && !formData.password) {
      setError('Password is required');
      return false;
    }

    if (mode === 'signup') {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Import Vercel auth service
      const { vercelAuth } = await import('../../services/vercelAuth.js');
      
      let result;
      
      if (mode === 'signin') {
        result = await vercelAuth.signIn(formData.email, formData.password);
      } else if (mode === 'signup') {
        result = await vercelAuth.signUp(formData.email, formData.password);
      } else if (mode === 'reset') {
        // Password reset not implemented yet for Vercel auth
        result = { success: false, message: 'Password reset coming soon! Contact support for now.' };
      }

      if (result.success) {
        console.log('AuthModal: Sign in successful, result:', result);
        console.log('AuthModal: result.user:', result.user);
        console.log('AuthModal: result.user.hasAccess:', result.user?.hasAccess);
        
        setMessage(result.message);
        
        if (mode === 'reset') {
          // Stay on modal for password reset
          setFormData({ email: formData.email, password: '', confirmPassword: '' });
        } else {
          // Close modal and notify parent component
          setTimeout(() => {
            console.log('AuthModal: Calling onAuthSuccess with result object:', result);
            onAuthSuccess(result);
            onClose();
          }, 1000);
        }
      } else {
        setError(result.message);
        
        // Handle device limit exceeded
        if (result.error === 'device_limit_exceeded') {
          setMode('device_limit');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      console.error('Auth error details:', error.message);
      setError(`Network error: ${error.message || 'Please check your connection and try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', confirmPassword: '' });
    setError('');
    setMessage('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>×</button>
        
        {mode === 'device_limit' ? (
          <DeviceLimitView onBack={() => setMode('signin')} />
        ) : (
          <>
            <div className="auth-modal-header">
              <h2>
                {mode === 'signin' && 'Sign In to Code Compass'}
                {mode === 'signup' && 'Create Your Account'}
                {mode === 'reset' && 'Reset Password'}
              </h2>
              <p className="auth-modal-subtitle">
                {mode === 'signin' && 'Access your account on up to 3 devices'}
                {mode === 'signup' && 'Join Code Compass and search CSA codes anywhere'}
                {mode === 'reset' && 'Enter your email to reset your password'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              {mode !== 'reset' && (
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                </div>
              )}

              {mode === 'signup' && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    required
                    autoComplete="new-password"
                  />
                </div>
              )}

              {error && <div className="auth-error">{error}</div>}
              {message && <div className="auth-message">{message}</div>}

              <button 
                type="submit" 
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading-spinner">⏳</span>
                ) : (
                  <>
                    {mode === 'signin' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'reset' && 'Send Reset Email'}
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              {mode === 'signin' && (
                <>
                  <p>
                    Don't have an account?{' '}
                    <button 
                      type="button" 
                      className="auth-link"
                      onClick={() => switchMode('signup')}
                    >
                      Sign up
                    </button>
                  </p>
                  <p>
                    <button 
                      type="button" 
                      className="auth-link"
                      onClick={() => switchMode('reset')}
                    >
                      Forgot password?
                    </button>
                  </p>
                </>
              )}

              {mode === 'signup' && (
                <p>
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    className="auth-link"
                    onClick={() => switchMode('signin')}
                  >
                    Sign in
                  </button>
                </p>
              )}

              {mode === 'reset' && (
                <p>
                  Remember your password?{' '}
                  <button 
                    type="button" 
                    className="auth-link"
                    onClick={() => switchMode('signin')}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Device limit reached component
const DeviceLimitView = ({ onBack }) => {
  return (
    <div className="device-limit-view">
      <div className="device-limit-header">
        <h2>⚠️ Device Limit Reached</h2>
        <p>You've reached the maximum of 3 devices for your account.</p>
      </div>

      <div className="device-limit-content">
        <p>To use Code Compass on this device, you'll need to:</p>
        <ol>
          <li>Remove one of your existing devices from your account</li>
          <li>Or sign in from a device you've used before</li>
        </ol>

        <p>
          <strong>Need help?</strong> Contact support at{' '}
          <a href="mailto:support@codecompass.com">support@codecompass.com</a>
        </p>
      </div>

      <div className="device-limit-actions">
        <button className="auth-submit-btn" onClick={onBack}>
          ← Back to Sign In
        </button>
      </div>
    </div>
  );
};

export default AuthModal;