import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Import the complete CSA data (for premium users)
import { searchCSAData, fullCSAData, getPopularSearchTerms as getB149_1_PopularTerms, getAnnexInfo } from '../data/csaData.js';
import { searchCSACode, createCSASearchIndex, csaB149Data, getPopularSearchTerms as getB149_2_PopularTerms } from '../data/csaDataB149_2.js';
// Import the free CSA data (for all users)
import { searchFreeCSAData, searchFreeCSAB149_2_Data, getFreeCSAInfo } from '../data/csaDataFree.js';
import { searchRegulations, createRegulationSearchIndex, regulationsData } from '../data/regulationsData.js';
// Payment and analytics imports
import { paymentHandler } from './utils/paymentHandler.js';
import { trackSearch, trackSubscriptionAttempt } from './utils/analytics.js';
import AIInterpretation from './components/AIInterpretation.jsx';
import PremiumPage from './components/PremiumPage.jsx';
import ActivationModal from './components/ActivationModal.jsx';

// The complete CSA B149.1-25 data is imported from the data file

// Move SearchBar component outside to prevent re-creation on every render
const SearchBar = React.memo(({ 
  query, 
  onQueryChange, 
  onSubmit, 
  onFocus, 
  onBlur, 
  placeholder, 
  suggestions, 
  showSuggestions, 
  onSuggestionClick 
}) => (
  <div style={{ position: 'relative', width: '100%' }}>
    <form onSubmit={onSubmit}>
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          value={query}
          onChange={onQueryChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '20px 60px 20px 20px',
            fontSize: '18px',
            borderRadius: '12px',
            border: '2px solid #333',
            backgroundColor: '#2d2d2d',
            color: 'white',
            outline: 'none',
            transition: 'border-color 0.3s ease',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#4CAF50';
            onFocus();
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#333';
            onBlur();
          }}
        />
        
        <button
          type="submit"
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'linear-gradient(135deg, #4CAF50, #45a049)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 18px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-50%) translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(-50%)';
            e.target.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)';
          }}
        >
          🔍
        </button>
      </div>
    </form>

    {/* Suggestions dropdown */}
    {showSuggestions && suggestions.length > 0 && (
      <div style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#2d2d2d',
        border: '1px solid #333',
        borderRadius: '8px',
        marginTop: '4px',
        maxHeight: '200px',
        overflowY: 'auto',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}>
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              borderBottom: index < suggestions.length - 1 ? '1px solid #333' : 'none',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#3d3d3d';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            {suggestion}
          </div>
        ))}
      </div>
    )}
  </div>
));

// Freemium model - no email collection needed

const App = () => {
  // Search type state
  const [activeSearchType, setActiveSearchType] = useState('b149-1'); // 'b149-1', 'b149-2', 'regulations'
  
  // Search indices
  const [csaSearchIndex, setCsaSearchIndex] = useState(null);
  const [regulationsSearchIndex, setRegulationsSearchIndex] = useState(null);
  
  // Original app state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  
  // Search suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // AI interpretation state
  const [showAIInterpretation, setShowAIInterpretation] = useState(false);
  const [selectedCodeForAI, setSelectedCodeForAI] = useState(null);
  
  // Premium page state
  const [showPremiumPage, setShowPremiumPage] = useState(false);
  
  // Activation modal state
  const [showActivationModal, setShowActivationModal] = useState(false);

  // Initialize search indices and check premium status on component mount
  useEffect(() => {
    // Initialize CSA B149.2 search index (for premium users)
    if (csaB149Data?.document) {
      const csaIndex = createCSASearchIndex();
      setCsaSearchIndex(csaIndex);
    }
    
    // Initialize regulations search index (always available)
    if (regulationsData && regulationsData.length > 0) {
      const regIndex = createRegulationSearchIndex(regulationsData);
      setRegulationsSearchIndex(regIndex);
    }

    // Check for existing premium subscription
    checkPremiumStatus();
  }, []);

  // Check if user has premium subscription
  const checkPremiumStatus = () => {
    const subscriptionData = localStorage.getItem('codecompass_subscription_data');
    const subscriptionStatus = localStorage.getItem('subscriptionStatus');
    
    if (subscriptionData || subscriptionStatus) {
      try {
        const subscription = JSON.parse(subscriptionData || subscriptionStatus);
        const now = new Date().getTime();
        const expiresAt = new Date(subscription.expiresAt).getTime();
        
        if (subscription.isActive && expiresAt > now) {
          setIsPremiumUser(true);
          return;
        } else if (subscription.isActive && expiresAt <= now && subscription.trialCode) {
          // Trial has expired - revert to free
          console.log('Trial code expired, reverting to free version');
          localStorage.removeItem('codecompass_subscription_data');
          localStorage.removeItem('subscriptionStatus');
          setIsPremiumUser(false);
          
          // Show trial expired message
          showTrialExpiredMessage();
          return;
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    }
    
    setIsPremiumUser(false);
  };

  // Show trial expired message
  const showTrialExpiredMessage = () => {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #f39c12, #e67e22);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
      z-index: 10000;
      max-width: 500px;
      text-align: center;
      font-weight: 600;
    `;
    banner.textContent = '⏰ Your 7-day trial has expired. Purchase Code Compass for $79 to continue with full access!';
    
    document.body.appendChild(banner);
    
    setTimeout(() => {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 8000);
  };


  // Initialize payment handler and listen for payment success
  useEffect(() => {
    // Initialize payment handler
    paymentHandler.init();
  }, []);

  // Listen for payment success events
  useEffect(() => {
    const handlePaymentSuccess = () => {
      // Refresh premium status when payment succeeds
      checkPremiumStatus();
      console.log('Payment success - checking premium status');
    };

    // Listen for custom payment success event
    window.addEventListener('paymentSuccess', handlePaymentSuccess);
    
    // Listen for storage changes (when subscription status updates)
    const handleStorageChange = (e) => {
      if (e.key === 'subscriptionStatus' || e.key === 'codecompass_subscription_data') {
        checkPremiumStatus();
        console.log('Storage change - checking premium status');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('paymentSuccess', handlePaymentSuccess);
    };
  }, []);

  // Search functions for both code books (freemium model)
  const searchB149_1 = useCallback((query) => {
    if (isPremiumUser) {
      return searchCSAData(query); // Full access for premium users
    } else {
      return searchFreeCSAData(query); // Free preview for all users
    }
  }, [isPremiumUser]);

  const searchB149_2 = useCallback((query, searchIndex) => {
    if (isPremiumUser && searchIndex) {
      return searchCSACode(query, searchIndex); // Full access for premium users
    } else {
      return searchFreeCSAB149_2_Data(query); // Free preview for all users
    }
  }, [isPremiumUser]);

  // Get popular search terms based on active search type
  const getPopularSearchTerms = useCallback(() => {
    if (activeSearchType === 'b149-1') {
      return getB149_1_PopularTerms();
    } else if (activeSearchType === 'b149-2') {
      return getB149_2_PopularTerms();
    }
    return [];
  }, [activeSearchType]);

  // Handle search input change with debounced suggestions
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 1 && (activeSearchType === 'b149-1' || activeSearchType === 'b149-2')) {
      const popularTerms = getPopularSearchTerms();
      const filtered = popularTerms.filter(term => 
        term.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [activeSearchType, getPopularSearchTerms]);

  // Handle search with proper analytics tracking
  const handleSearch = useCallback((searchQuery) => {
    // Set query and hide suggestions for all searches
    setQuery(searchQuery);
    setShowSuggestions(false);

    let searchResults = [];

    // Handle search based on type (freemium model)
    if (activeSearchType === 'regulations') {
      // Regulations are always free
      if (regulationsSearchIndex) {
        searchResults = searchRegulations(searchQuery, regulationsSearchIndex);
      }
    } else if (activeSearchType === 'b149-1') {
      // B149.1-25: Free preview or full access
      searchResults = searchB149_1(searchQuery);
    } else if (activeSearchType === 'b149-2') {
      // B149.2-25: Free preview or full access
      searchResults = searchB149_2(searchQuery, csaSearchIndex);
    }

    setResults(searchResults);
    trackSearch(searchQuery, searchResults.length);
  }, [activeSearchType, regulationsSearchIndex, csaSearchIndex, searchB149_1, searchB149_2]);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query.trim());
    }
  }, [query, handleSearch]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  }, [handleSearch]);

  // Handle search input focus
  const handleInputFocus = useCallback(() => {
    if (query.length > 1 && (activeSearchType === 'b149-1' || activeSearchType === 'b149-2')) {
      const popularTerms = getPopularSearchTerms();
      const filtered = popularTerms.filter(term => 
        term.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    }
  }, [query, activeSearchType, getPopularSearchTerms]);

  // Handle input blur with longer delay
  const handleInputBlur = useCallback(() => {
    // Use a longer timeout to allow clicking on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  // AI interpretation handlers
  const handleAIInterpretation = useCallback((codeData) => {
    if (isPremiumUser) {
      setSelectedCodeForAI(codeData);
      setShowAIInterpretation(true);
    } else {
      // Show premium page for non-premium users
      setShowPremiumPage(true);
      trackSubscriptionAttempt('ai_button');
    }
  }, [isPremiumUser]);

  const closeAIInterpretation = useCallback(() => {
    setShowAIInterpretation(false);
    setSelectedCodeForAI(null);
  }, []);

  // Clear search and suggestions when switching search types
  useEffect(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setIsLoading(false); // Reset loading state when switching search types
    
    // Force a brief delay to ensure loading state is properly reset
    const resetTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(resetTimeout);
  }, [activeSearchType]);

  // Search functionality with analytics - updated for all search types
  useEffect(() => {
    // Always ensure loading is false when there's no query
    if (query.trim() === '') {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      let searchResults = [];

      switch (activeSearchType) {
        case 'b149-1':
          // B149.1-25: Free preview or full access based on premium status
          searchResults = searchB149_1(query);
          break;
        case 'b149-2':
          // B149.2-25: Free preview or full access based on premium status
          searchResults = searchB149_2(query, csaSearchIndex);
          break;
        case 'regulations':
          // Regulations: Always free
          if (regulationsSearchIndex) {
            searchResults = searchRegulations(query, regulationsSearchIndex);
          }
          break;
        default:
          // Handle any unknown search type
          break;
      }

      setResults(searchResults);
      setIsLoading(false);
    }, 150);

    // Cleanup function to ensure loading state is cleared
    return () => {
      clearTimeout(timeoutId);
      setIsLoading(false);
    };
  }, [query, activeSearchType, csaSearchIndex, regulationsSearchIndex, searchB149_1, searchB149_2, isPremiumUser]);

  // Memoized values to prevent unnecessary re-renders
  const searchBarProps = useMemo(() => ({
    query,
    onQueryChange: handleInputChange,
    onSubmit: handleSubmit,
    onFocus: handleInputFocus,
    onBlur: handleInputBlur,
    placeholder: activeSearchType === 'regulations' ? 
      'Search regulations (free)...' : 
      `Search ${activeSearchType} codes...`,
    suggestions,
    showSuggestions,
    onSuggestionClick: handleSuggestionClick
  }), [
    query, 
    handleInputChange, 
    handleSubmit, 
    handleInputFocus, 
    handleInputBlur, 
    activeSearchType, 
    suggestions, 
    showSuggestions, 
    handleSuggestionClick
  ]);

  // Handle premium upgrade (show premium page)
  const handleUpgrade = useCallback(() => {
    setShowPremiumPage(true);
    trackSubscriptionAttempt('upgrade_button');
  }, []);

  // Handle subscription - redirect to payment
  const handleSubscribe = useCallback(() => {
    setShowPremiumPage(true);
    trackSubscriptionAttempt('upgrade_button');
  }, []);

  // Close premium page
  const closePremiumPage = useCallback(() => {
    setShowPremiumPage(false);
  }, []);

  // Activation handlers
  const showActivation = useCallback(() => {
    setShowActivationModal(true);
  }, []);

  const closeActivationModal = useCallback(() => {
    setShowActivationModal(false);
  }, []);

  const handleActivationSuccess = useCallback((premiumData) => {
    setIsPremiumUser(true);
    console.log('Activation successful:', premiumData);
  }, []);

  // Get search placeholder text
  const getSearchPlaceholder = useCallback(() => {
    switch (activeSearchType) {
      case 'regulations':
        return 'Search regulations (free)...';
      case 'b149-1':
        return 'Search CSA B149.1-25 codes...';
      case 'b149-2':
        return 'Search CSA B149.2-25 codes...';
      default:
        return 'Search...';
    }
  }, [activeSearchType]);

  // Access banner component (freemium model)
  const AccessBanner = useMemo(() => {
    // Only show banner for CSA codes (not regulations)
    if (activeSearchType === 'regulations') return null;
    
    if (isPremiumUser) {
      // Check if this is a trial user
      const subscriptionData = localStorage.getItem('codecompass_subscription_data') || localStorage.getItem('subscriptionStatus');
      let isTrialUser = false;
      let daysRemaining = 0;
      
      if (subscriptionData) {
        try {
          const subscription = JSON.parse(subscriptionData);
          if (subscription.trialCode) {
            isTrialUser = true;
            const now = new Date().getTime();
            const expiresAt = new Date(subscription.expiresAt).getTime();
            daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));
          }
        } catch (error) {
          console.error('Error parsing subscription data:', error);
        }
      }
      
      if (isTrialUser) {
        return (
          <div style={{
            background: 'linear-gradient(135deg, #f39c12, #e67e22)',
            color: 'white',
            padding: '16px 20px',
            textAlign: 'center',
            marginBottom: '1rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(243, 156, 18, 0.3)'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                🕐 Trial Mode: {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
              </span>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '4px' }}>
                Full access to all features. After trial expires, reverts to free version.
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.color = '#f39c12';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.color = 'white';
              }}
            >
              Upgrade Now - Keep Full Access
            </button>
          </div>
        );
      } else {
        return (
          <div style={{
            background: 'linear-gradient(135deg, #4CAF50, #45a049)',
            color: 'white',
            padding: '16px 20px',
            textAlign: 'center',
            marginBottom: '1rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              ✨ Premium Access Active
            </span>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '4px' }}>
              Unlimited searches across all CSA codes + AI explanations
            </div>
          </div>
        );
      }
    } else {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          padding: '16px 20px',
          textAlign: 'center',
          marginBottom: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              📖 Free Preview Mode
            </span>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '4px' }}>
              Viewing Scope, Definitions & General sections. Upgrade for complete codes + AI explanations
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.color = '#667eea';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.color = 'white';
            }}
          >
            Upgrade Now - $79/year
          </button>
        </div>
      );
    }
  }, [activeSearchType, isPremiumUser, handleUpgrade]);

  // Search results component
  const SearchResults = useMemo(() => {
    if (isLoading) {
      return (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          color: '#666'
        }}>
          <div style={{ 
            fontSize: '2rem', 
            marginBottom: '1rem',
            animation: 'spin 1s linear infinite'
          }}>
            ⚙️
          </div>
          <div>Searching...</div>
        </div>
      );
    }

    if (!query.trim()) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#999'
        }}>
          Enter a search term above to find CSA codes and regulations
        </div>
      );
    }

    if (results.length > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map((item, index) => (
            <div key={index} style={{
              backgroundColor: '#2d3748',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid #4a5568',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4CAF50';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#4a5568';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#4CAF50',
                marginBottom: '0.5rem'
              }}>
                {item.clause || item.section || 'Section'} - {item.title}
              </div>
              <div style={{
                color: '#e2e8f0',
                lineHeight: '1.6',
                marginBottom: '1rem'
              }}>
                {item.description}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                {item.category && (
                  <div style={{
                    display: 'inline-block',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {item.category}
                  </div>
                )}
                
                {/* AI Explanation Button - only for premium users and CSA codes */}
                {(activeSearchType === 'b149-1' || activeSearchType === 'b149-2') && isPremiumUser && !item.isPremiumUpgrade && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAIInterpretation(item);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                    }}
                  >
                    🤖 AI Explain
                  </button>
                )}
                
                {/* Upgrade Button for Premium Upgrade prompts */}
                {item.isPremiumUpgrade && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpgrade();
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(243, 156, 18, 0.3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(243, 156, 18, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(243, 156, 18, 0.3)';
                    }}
                  >
                    💎 Upgrade Now
                  </button>
                )}

                {/* AI Upgrade Button for non-premium users */}
                {(activeSearchType === 'b149-1' || activeSearchType === 'b149-2') && !isPremiumUser && !item.isPremiumUpgrade && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpgrade();
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(155, 89, 182, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(155, 89, 182, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(155, 89, 182, 0.3)';
                    }}
                  >
                    🤖 Get AI + Full Codes
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: '#2d3748',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #4a5568',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
        <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
          No results found for "{query}"
        </div>
        <div style={{ color: '#a0aec0' }}>
          Try different keywords or check your spelling
        </div>
      </div>
    );

    return null;
  }, [results, isLoading, query]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Freemium model - no email collection modal needed */}

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #2d3748, #1a202c)',
        borderBottom: '1px solid #4a5568',
        padding: '1rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              fontSize: '2.5rem',
              filter: 'drop-shadow(0 2px 4px rgba(76, 175, 80, 0.3))'
            }}>
              🧭
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '1.8rem',
                fontWeight: '700',
                color: 'white',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                Code Compass
              </h1>
              <div style={{
                fontSize: '0.9rem',
                color: '#a0aec0',
                marginTop: '2px'
              }}>
                Navigate CSA Codes & Regulations
              </div>
            </div>
          </div>
          
          {/* Already purchased button for non-premium users */}
          {!isPremiumUser && (
            <button
              onClick={showActivation}
              style={{
                background: 'transparent',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              🔑 Already Purchased?
            </button>
          )}

        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Search Type Selector */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            backgroundColor: '#2d3748',
            padding: '6px',
            borderRadius: '12px',
            border: '1px solid #4a5568'
          }}>
            <button
              onClick={() => setActiveSearchType('regulations')}
              style={{
                flex: 1,
                background: activeSearchType === 'regulations' ? 
                  'linear-gradient(135deg, #4CAF50, #45a049)' : 
                  'transparent',
                color: 'white',
                border: 'none',
                padding: '12px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: activeSearchType === 'regulations' ? 
                  '0 2px 8px rgba(76, 175, 80, 0.3)' : 
                  'none'
              }}
            >
              📋 Regulations (Free)
            </button>
            <button
              onClick={() => setActiveSearchType('b149-1')}
              style={{
                flex: 1,
                background: activeSearchType === 'b149-1' ? 
                  'linear-gradient(135deg, #4CAF50, #45a049)' : 
                  'transparent',
                color: 'white',
                border: 'none',
                padding: '12px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: activeSearchType === 'b149-1' ? 
                  '0 2px 8px rgba(76, 175, 80, 0.3)' : 
                  'none'
              }}
            >
              🔥 CSA B149.1-25
            </button>
            <button
              onClick={() => setActiveSearchType('b149-2')}
              style={{
                flex: 1,
                background: activeSearchType === 'b149-2' ? 
                  'linear-gradient(135deg, #4CAF50, #45a049)' : 
                  'transparent',
                color: 'white',
                border: 'none',
                padding: '12px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: activeSearchType === 'b149-2' ? 
                  '0 2px 8px rgba(76, 175, 80, 0.3)' : 
                  'none'
              }}
            >
              ⚡ CSA B149.2-25
            </button>
          </div>
        </div>

        {/* Access Status Banner */}
        {AccessBanner}

        {/* Search Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <SearchBar {...searchBarProps} />
        </div>

        {/* Results */}
        <div>
          {SearchResults}
        </div>
      </main>

      {/* AI Interpretation Modal */}
      <AIInterpretation
        codeData={selectedCodeForAI}
        isVisible={showAIInterpretation}
        onClose={closeAIInterpretation}
      />

      {/* Premium Page Modal */}
      <PremiumPage
        isVisible={showPremiumPage}
        onClose={closePremiumPage}
      />

      {/* Activation Modal */}
      <ActivationModal
        isVisible={showActivationModal}
        onClose={closeActivationModal}
        onActivationSuccess={handleActivationSuccess}
      />

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default App;