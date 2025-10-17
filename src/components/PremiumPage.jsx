// src/components/PremiumPage.jsx
// Premium upgrade landing page with payment integration

import React from 'react';

const PremiumPage = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  const handleBuyNow = () => {
    // Track purchase attempt
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: 79.00,
        items: [{
          item_id: 'codecompass_annual',
          item_name: 'Code Compass Annual Subscription',
          category: 'Software',
          price: 79.00,
          quantity: 1
        }]
      });
    }

    // Open Stripe payment page
    window.open('https://buy.stripe.com/8x24gAadDgMceP40tO7ok04', '_blank');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        ×
      </button>

      {/* Premium page content */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header with gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '40px 30px',
          borderRadius: '16px 16px 0 0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🧭</div>
          <h1 style={{
            margin: '0 0 16px 0',
            fontSize: '2.5rem',
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            Unlock Code Compass
          </h1>
          <p style={{
            margin: 0,
            fontSize: '1.2rem',
            opacity: 0.9,
            fontWeight: '300'
          }}>
            Get complete access to all CSA codes + AI explanations
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '40px 30px' }}>
          {/* Value proposition */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{
              color: '#333',
              fontSize: '1.8rem',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              Everything You Need for Gas Code Compliance
            </h2>
            <p style={{
              color: '#666',
              fontSize: '1.1rem',
              lineHeight: '1.6',
              marginBottom: '0'
            }}>
              Join thousands of gas technicians, inspectors, and contractors who rely on Code Compass for accurate, instant access to Canadian gas codes.
            </p>
          </div>

          {/* Features grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}>
            {/* Complete Code Access */}
            <div style={{
              padding: '24px',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                fontSize: '2rem',
                marginBottom: '12px'
              }}>📖</div>
              <h3 style={{
                color: '#333',
                fontSize: '1.2rem',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Complete Code Books
              </h3>
              <ul style={{
                color: '#666',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                margin: 0,
                paddingLeft: '16px'
              }}>
                <li>CSA B149.1-25 Natural Gas Installation Code</li>
                <li>CSA B149.2-25 Propane Storage & Handling Code</li>
                <li>Pressure Controls & Piping Systems</li>
                <li>Venting Systems & Safety Requirements</li>
                <li>Technical Annexes & Installation Standards</li>
              </ul>
            </div>

            {/* AI Explanations */}
            <div style={{
              padding: '24px',
              borderRadius: '12px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9'
            }}>
              <div style={{
                fontSize: '2rem',
                marginBottom: '12px'
              }}>🤖</div>
              <h3 style={{
                color: '#333',
                fontSize: '1.2rem',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                AI-Powered Explanations
              </h3>
              <ul style={{
                color: '#666',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                margin: 0,
                paddingLeft: '16px'
              }}>
                <li>Plain-language code interpretations</li>
                <li>Practical implementation guidance</li>
                <li>Safety considerations & compliance tips</li>
                <li>Real-world application examples</li>
                <li>Expert-level technical support</li>
              </ul>
            </div>
          </div>

          {/* Pricing Cards - 3 Options */}
          <h2 style={{
            textAlign: 'center',
            color: '#333',
            fontSize: '1.8rem',
            fontWeight: '600',
            marginBottom: '32px'
          }}>
            Choose Your Plan
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {/* Free Plan */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '28px 24px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2.5rem',
                marginBottom: '12px'
              }}>🔓</div>
              <h3 style={{
                color: '#333',
                fontSize: '1.4rem',
                fontWeight: '700',
                marginBottom: '8px'
              }}>
                Free
              </h3>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: '#666',
                marginBottom: '8px'
              }}>
                $0
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#888',
                marginBottom: '20px'
              }}>
                Limited access
              </div>
              <ul style={{
                textAlign: 'left',
                color: '#666',
                fontSize: '0.9rem',
                lineHeight: '1.8',
                marginBottom: '24px',
                paddingLeft: '20px',
                minHeight: '120px'
              }}>
                <li>Search 1,118+ code clauses</li>
                <li>Basic code text viewing</li>
                <li>No AI explanations</li>
                <li>Ad-supported</li>
              </ul>
              <button
                onClick={onClose}
                style={{
                  background: '#e2e8f0',
                  color: '#666',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Current Plan
              </button>
            </div>

            {/* Student Plan - HIGHLIGHTED */}
            <div style={{
              backgroundColor: '#fff7ed',
              padding: '28px 24px',
              borderRadius: '12px',
              border: '3px solid #f97316',
              textAlign: 'center',
              position: 'relative',
              transform: 'scale(1.05)',
              boxShadow: '0 8px 30px rgba(249, 115, 22, 0.2)'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: 'white',
                padding: '4px 16px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Best Value
              </div>
              <div style={{
                fontSize: '2.5rem',
                marginBottom: '12px'
              }}>🎓</div>
              <h3 style={{
                color: '#333',
                fontSize: '1.4rem',
                fontWeight: '700',
                marginBottom: '8px'
              }}>
                Student Access
              </h3>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: '#f97316',
                marginBottom: '8px'
              }}>
                FREE
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#888',
                marginBottom: '20px'
              }}>
                12 months with LARK code
              </div>
              <ul style={{
                textAlign: 'left',
                color: '#666',
                fontSize: '0.9rem',
                lineHeight: '1.8',
                marginBottom: '24px',
                paddingLeft: '20px',
                minHeight: '120px'
              }}>
                <li>✓ Full code access (1,118+ clauses)</li>
                <li>✓ Unlimited AI explanations</li>
                <li>✓ All premium features</li>
                <li>✓ Ad-free experience</li>
                <li>✓ Valid for 12 months</li>
              </ul>
              <div style={{
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: 'white',
                padding: '12px 32px',
                borderRadius: '25px',
                fontSize: '1rem',
                fontWeight: '600',
                width: '100%'
              }}>
                Use LARK Code
              </div>
              <p style={{
                fontSize: '0.75rem',
                color: '#666',
                marginTop: '12px',
                fontStyle: 'italic'
              }}>
                Code provided by your instructor
              </p>
            </div>

            {/* Premium Plan */}
            <div style={{
              backgroundColor: '#f0fdf4',
              padding: '28px 24px',
              borderRadius: '12px',
              border: '2px solid #4CAF50',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2.5rem',
                marginBottom: '12px'
              }}>⭐</div>
              <h3 style={{
                color: '#333',
                fontSize: '1.4rem',
                fontWeight: '700',
                marginBottom: '8px'
              }}>
                Premium
              </h3>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: '#4CAF50',
                marginBottom: '8px'
              }}>
                $79
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#888',
                marginBottom: '20px'
              }}>
                per year ($6.58/month)
              </div>
              <ul style={{
                textAlign: 'left',
                color: '#666',
                fontSize: '0.9rem',
                lineHeight: '1.8',
                marginBottom: '24px',
                paddingLeft: '20px',
                minHeight: '120px'
              }}>
                <li>✓ Full code access (1,118+ clauses)</li>
                <li>✓ Unlimited AI explanations</li>
                <li>✓ Priority support</li>
                <li>✓ Ad-free experience</li>
                <li>✓ Cancel anytime</li>
              </ul>
              <button
                onClick={handleBuyNow}
                style={{
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                  transition: 'all 0.3s ease',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
                }}
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* Trust indicators */}
          <div style={{ 
            textAlign: 'center',
            padding: '20px 0',
            borderTop: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              color: '#666',
              fontSize: '0.9rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#4CAF50', fontSize: '1.2rem' }}>✓</span>
                Instant Access
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#4CAF50', fontSize: '1.2rem' }}>✓</span>
                Secure Payment
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#4CAF50', fontSize: '1.2rem' }}>✓</span>
                Cancel Anytime
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#4CAF50', fontSize: '1.2rem' }}>✓</span>
                30-Day Guarantee
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div style={{ marginTop: '32px' }}>
            <h3 style={{
              color: '#333',
              fontSize: '1.3rem',
              fontWeight: '600',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Frequently Asked Questions
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <details style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <summary style={{
                  fontWeight: '600',
                  color: '#333',
                  cursor: 'pointer',
                  marginBottom: '8px'
                }}>
                  What's included in the premium subscription?
                </summary>
                <p style={{
                  color: '#666',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  Complete access to CSA B149.1-25 and B149.2-25 code books (1,118+ clauses), AI-powered explanations for every code section, pressure controls, piping systems, venting requirements, and all technical annexes.
                </p>
              </details>

              <details style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <summary style={{
                  fontWeight: '600',
                  color: '#333',
                  cursor: 'pointer',
                  marginBottom: '8px'
                }}>
                  How does the AI explanation feature work?
                </summary>
                <p style={{
                  color: '#666',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  Our AI provides plain-language explanations of complex code requirements, practical implementation guidance, safety considerations, and real-world application examples - like having an expert gas technician explain every code section.
                </p>
              </details>

              <details style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <summary style={{
                  fontWeight: '600',
                  color: '#333',
                  cursor: 'pointer',
                  marginBottom: '8px'
                }}>
                  Can I cancel anytime?
                </summary>
                <p style={{
                  color: '#666',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  Yes! You can cancel your subscription at any time. No contracts, no hidden fees. If you're not satisfied within 30 days, we'll provide a full refund.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;