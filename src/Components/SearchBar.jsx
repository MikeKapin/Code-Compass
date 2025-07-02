import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setInputValue('');
    onSearch('');
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%'
    }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* Search Icon */}
        <span style={{
          position: 'absolute',
          left: '12px',
          color: '#6c757d',
          fontSize: '1.1rem',
          zIndex: 1,
          pointerEvents: 'none'
        }}>
          🔍
        </span>

        {/* Input Field */}
        <input
          type="text"
          value={inputValue}
          placeholder="Search codes, titles, or keywords..."
          onChange={handleInputChange}
          style={{
            width: '100%',
            padding: '12px 48px 12px 40px',
            fontSize: '16px', // Prevents zoom on iOS
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            outline: 'none',
            backgroundColor: '#f8f9fa',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3498db';
            e.target.style.backgroundColor = '#ffffff';
            e.target.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e9ecef';
            e.target.style.backgroundColor = '#f8f9fa';
            e.target.style.boxShadow = 'none';
          }}
        />

        {/* Clear Button */}
        {inputValue && (
          <button
            onClick={clearSearch}
            style={{
              position: 'absolute',
              right: '8px',
              width: '32px',
              height: '32px',
              border: 'none',
              backgroundColor: 'transparent',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.2rem',
              color: '#6c757d',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e9ecef';
              e.target.style.color = '#495057';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#6c757d';
            }}
            onTouchStart={(e) => {
              e.target.style.backgroundColor = '#e9ecef';
            }}
            onTouchEnd={(e) => {
              setTimeout(() => {
                e.target.style.backgroundColor = 'transparent';
              }, 150);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Suggestions/Tips */}
      {!inputValue && (
        <div style={{
          marginTop: '8px',
          fontSize: '0.8rem',
          color: '#6c757d',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <span>Try:</span>
          <button
            onClick={() => {
              setInputValue('appliance');
              onSearch('appliance');
            }}
            style={{
              background: 'none',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '0.75rem',
              color: '#6c757d',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e9ecef';
              e.target.style.borderColor = '#adb5bd';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = '#dee2e6';
            }}
          >
            appliance
          </button>
          <button
            onClick={() => {
              setInputValue('pressure');
              onSearch('pressure');
            }}
            style={{
              background: 'none',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '0.75rem',
              color: '#6c757d',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e9ecef';
              e.target.style.borderColor = '#adb5bd';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = '#dee2e6';
            }}
          >
            pressure
          </button>
          <button
            onClick={() => {
              setInputValue('4.1');
              onSearch('4.1');
            }}
            style={{
              background: 'none',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '0.75rem',
              color: '#6c757d',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e9ecef';
              e.target.style.borderColor = '#adb5bd';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = '#dee2e6';
            }}
          >
            4.1
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;