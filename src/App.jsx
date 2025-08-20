import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Import the new search functionality
import { searchCSACode, createCSASearchIndex, csaB149Data } from '../data/csaDataB149_2.js';
import { searchRegulations, createRegulationSearchIndex, regulationsData } from '../data/regulationsData.js';
import { trialManager } from './utils/trialManager.js';
// Add this import at the top
import { paymentHandler } from './utils/paymentHandler.js';
import { validateEmail } from './utils/emailcollection.js';
import { 
  trackTrialStarted,
  trackSearch,
  trackSubscriptionAttempt,
  trackEmailSubmission 
} from './utils/analytics.js';

// CSA Data Structure - organized by sections and annexes
const csaB149_1_25 = {
  sections: {
    section1: {
      title: "Scope and Application",
      clauses: []
    },
    section2: {
      title: "Reference Publications", 
      clauses: []
    },
    section3: {
      title: "Definitions",
      clauses: [
        {
          "clause": "3.1",
          "title": "Accessory",
          "description": "a part capable of performing an independent function and contributing to the operation of the appliance or gas piping system that it serves."
        },
        {
          "clause": "3.2",
          "title": "Air supply (with respect to the installation of an appliance)",
          "description": "combustion air, flue gas dilution air, and ventilation air."
        },
        {
          "clause": "3.3",
          "title": "Combustion air",
          "description": "the air required for satisfactory combustion of gas, including excess air."
        },
        {
          "clause": "3.4",
          "title": "Excess air",
          "description": "that portion of the combustion air that is supplied to the combustion zone in excess of that which is theoretically required for complete combustion."
        },
        {
          "clause": "3.5",
          "title": "Flue gas dilution air",
          "description": "the ambient air that is admitted to a venting system at the draft hood, draft diverter, or draft regulator."
        },
        {
          "clause": "3.6",
          "title": "Ventilation air",
          "description": "air that is admitted to a space containing an appliance to replace air exhausted through a ventilation opening or by means of exfiltration."
        },
        {
          "clause": "3.7",
          "title": "Appliance",
          "description": "a device designed to utilize gas as a fuel or raw material to produce light, heat, power, refrigeration, or air conditioning."
        },
        {
          "clause": "3.8",
          "title": "Appliance, commercial",
          "description": "an appliance used in a commercial establishment."
        },
        {
          "clause": "3.9",
          "title": "Appliance, domestic",
          "description": "an appliance used in a dwelling unit, including a mobile home."
        },
        {
          "clause": "3.10",
          "title": "Appliance, industrial",
          "description": "an appliance used in an industrial establishment."
        },
        {
          "clause": "3.11",
          "title": "Appliance, outdoor",
          "description": "an appliance designed to be located outdoors that will operate safely when exposed to outdoor temperature and weather conditions without the need for protection from the elements."
        }
      ]
    },
    section4: {
      title: "General Requirements",
      clauses: []
    },
    section5: {
      title: "Gas Piping Systems",
      clauses: []
    },
    section6: {
      title: "Appliance Installation", 
      clauses: []
    },
    section7: {
      title: "Venting Systems",
      clauses: []
    },
    section8: {
      title: "Air Supply",
      clauses: []
    }
  },
  annexes: {
    annexA: {
      title: "Conversion Factors",
      clauses: []
    },
    annexB: {
      title: "Capacity Tables",
      clauses: []
    },
    annexC: {
      title: "Installation Examples",
      clauses: []
    }
  }
};

// Flatten data for backward compatibility
const fullCSAData = [];
Object.values(csaB149_1_25.sections).forEach(section => {
  fullCSAData.push(...section.clauses);
});
Object.values(csaB149_1_25.annexes).forEach(annex => {
  fullCSAData.push(...annex.clauses);
});

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

// Email Modal Component
const EmailModal = React.memo(({ 
  isOpen, 
  onClose, 
  email, 
  setEmail, 
  onSubmit, 
  isSubmitting, 
  error 
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#2d2d2d',
        padding: '2rem',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '100%',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Start Your Trial</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
        
        <p style={{ marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Enter your email to start a 7-day trial with access to CSA B149.1-25 and B149.2-25 codes.
        </p>
        
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #333',
                backgroundColor: '#1a1a1a',
                color: 'white',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              disabled={isSubmitting}
            />
          </div>
          
          {error && (
            <div style={{ 
              color: '#ff4444', 
              fontSize: '14px', 
              marginBottom: '1rem' 
            }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid #666',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: '#4CAF50',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Starting Trial...' : 'Start Trial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

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
  const [accessStatus, setAccessStatus] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  // Email collection state
  const [email, setEmail] = useState('');
  
  // Search suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Initialize search indices on component mount
  useEffect(() => {
    // Initialize CSA B149.2 search index
    if (csaB149Data?.document) {
      const csaIndex = createCSASearchIndex();
      setCsaSearchIndex(csaIndex);
    }
    
    // Initialize regulations search index
    if (regulationsData && regulationsData.length > 0) {
      const regIndex = createRegulationSearchIndex(regulationsData);
      setRegulationsSearchIndex(regIndex);
    }
  }, []);


  // Initialize payment handler and check access status on mount
  useEffect(() => {
    // Initialize payment handler
    paymentHandler.init();
    
    // Get initial access status
    const status = trialManager.getAccessStatus();
    setAccessStatus(status);
    console.log('Initial access status:', status);
  }, []);

  // Listen for payment success events
  useEffect(() => {
    const handlePaymentSuccess = () => {
      // Refresh access status when payment succeeds
      const status = trialManager.getAccessStatus();
      setAccessStatus(status);
      console.log('Payment success - updated access status:', status);
    };

    // Listen for custom payment success event
    window.addEventListener('paymentSuccess', handlePaymentSuccess);
    
    // Listen for storage changes (when payment status updates)
    const handleStorageChange = (e) => {
      if (e.key === 'subscriptionStatus' || e.key === 'codecompass_trial_data') {
        const status = trialManager.getAccessStatus();
        setAccessStatus(status);
        console.log('Storage change - updated access status:', status);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('paymentSuccess', handlePaymentSuccess);
    };
  }, []);

  // Built-in search function for B149.1-25
  const searchCodes = useCallback((query) => {
    if (!query || query.trim() === '') return [];
    
    const searchTerm = query.toLowerCase().trim();
    
    return fullCSAData.filter(item => {
      // Check clause number
      if (item.clause && item.clause.toLowerCase().includes(searchTerm)) return true;
      
      // Check title
      if (item.title && item.title.toLowerCase().includes(searchTerm)) return true;
      
      // Check description
      if (item.description && item.description.toLowerCase().includes(searchTerm)) return true;
      
      return false;
    });
  }, []);

  // Get popular search terms for CSA codes
  const getPopularSearchTerms = useCallback(() => {
    return ['BTU', 'venting', 'clearance', 'CSA', 'accessory', 'appliance', 'gas piping', 'installation', 'safety'];
  }, []);

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
    // Handle regulations search (free)
    if (activeSearchType === 'regulations') {
      if (regulationsSearchIndex) {
        const searchResults = searchRegulations(searchQuery, regulationsSearchIndex);
        setResults(searchResults);
        setQuery(searchQuery);
        setShowSuggestions(false);
        trackSearch(searchQuery, searchResults.length);
      }
      return;
    }

    // For both B149.1-25 and B149.2-25, check trial access
    if (trialManager.canAccessPremiumFeatures()) {
      setQuery(searchQuery);
      setShowSuggestions(false);
      
      if (activeSearchType === 'b149-1') {
        // B149.1-25 search
        const searchResults = searchCodes(searchQuery);
        setResults(searchResults);
        trackSearch(searchQuery, searchResults.length);
      } else if (activeSearchType === 'b149-2') {
        // B149.2-25 search
        if (csaSearchIndex) {
          const searchResults = searchCSACode(searchQuery, csaSearchIndex);
          setResults(searchResults);
          trackSearch(searchQuery, searchResults.length);
        }
      }
      
      // Update access status after search
      setAccessStatus(trialManager.getAccessStatus());
      return;
    }

    // If no access, show email modal for trial
    setShowEmailModal(true);
  }, [activeSearchType, regulationsSearchIndex, csaSearchIndex, searchCodes]);

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

  // Clear search and suggestions when switching search types
  useEffect(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
  }, [activeSearchType]);

  // Search functionality with analytics - updated for all search types
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    // For premium-required searches, check access status
    if ((activeSearchType === 'b149-1' || activeSearchType === 'b149-2') && !trialManager.canAccessPremiumFeatures()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      let searchResults = [];

      switch (activeSearchType) {
        case 'b149-1':
          if (trialManager.canAccessPremiumFeatures()) {
            searchResults = searchCodes(query);
          }
          break;
        case 'b149-2':
          if (trialManager.canAccessPremiumFeatures() && csaSearchIndex) {
            searchResults = searchCSACode(query, csaSearchIndex);
          }
          break;
        case 'regulations':
          if (regulationsSearchIndex) {
            searchResults = searchRegulations(query, regulationsSearchIndex);
          }
          break;
      }

      setResults(searchResults);
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [query, accessStatus, activeSearchType, csaSearchIndex, regulationsSearchIndex, searchCodes]);

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

  // Get access status display for current search type
  const getAccessStatusForType = useCallback((searchType) => {
    if (searchType === 'regulations') {
      return { hasAccess: true, type: 'free' };
    }
    
    const status = accessStatus || trialManager.getAccessStatus();
    return status;
  }, [accessStatus]);

  // Handle email submission for trial
  const handleEmailSubmit = useCallback(async (e) => {
    e.preventDefault();
    setEmailSubmitting(true);
    setEmailError('');

    try {
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Start trial
      const result = trialManager.startTrial(email);
      
      if (result.success) {
        // Track trial start
        trackTrialStarted(email);
        
        // Update access status
        const newStatus = trialManager.getAccessStatus();
        setAccessStatus(newStatus);
        
        // Close modal and show success
        setShowEmailModal(false);
        setEmail('');
        
        // Perform the search that was requested
        if (query.trim()) {
          handleSearch(query.trim());
        }
      } else {
        throw new Error(result.message || 'Failed to start trial');
      }
    } catch (error) {
      console.error('Trial start error:', error);
      setEmailError(error.message);
    } finally {
      setEmailSubmitting(false);
    }
  }, [email, query, handleSearch]);

  // Handle subscription - redirect to payment
  const handleSubscribe = useCallback(() => {
    trackSubscriptionAttempt('upgrade_button');
    // TODO: Replace with actual payment URL
    window.open('https://buy.stripe.com/your-payment-link', '_blank');
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

  // Access banner component
  const AccessBanner = useMemo(() => {
    // Only show banner for premium-required searches
    if (activeSearchType === 'regulations') return null;
    
    const currentAccessStatus = getAccessStatusForType(activeSearchType);
    
    if (currentAccessStatus.hasAccess && currentAccessStatus.type === 'trial') {
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
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              🎉 Trial active: {currentAccessStatus.daysRemaining} day{currentAccessStatus.daysRemaining !== 1 ? 's' : ''} remaining
            </span>
            {currentAccessStatus.searchCount > 0 && (
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '4px' }}>
                {currentAccessStatus.searchCount} searches performed across B149.1-25 & B149.2-25
              </div>
            )}
          </div>
          <button
            onClick={handleSubscribe}
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
              e.target.style.color = '#4CAF50';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.color = 'white';
            }}
          >
            Upgrade to Annual - $79
          </button>
        </div>
      );
    } else if (currentAccessStatus.hasAccess && currentAccessStatus.type === 'subscription') {
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
            Unlimited searches across all CSA codes
          </div>
        </div>
      );
    } else if (!currentAccessStatus.hasAccess && currentAccessStatus.type === 'expired_trial') {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #FF5722, #D84315)',
          color: 'white',
          padding: '16px 20px',
          textAlign: 'center',
          marginBottom: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(255, 87, 34, 0.3)'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              ⏰ Trial Expired
            </span>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '4px' }}>
              You performed {currentAccessStatus.searchCount || 0} searches during your trial
            </div>
          </div>
          <button
            onClick={handleSubscribe}
            style={{
              backgroundColor: 'white',
              color: '#FF5722',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
            }}
          >
            Subscribe for $79/year
          </button>
        </div>
      );
    }

    return null;
  }, [activeSearchType, accessStatus, getAccessStatusForType, handleSubscribe]);

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
      {/* Email Modal */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        email={email}
        setEmail={setEmail}
        onSubmit={handleEmailSubmit}
        isSubmitting={emailSubmitting}
        error={emailError}
      />

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