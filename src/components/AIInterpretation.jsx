// src/components/AIInterpretation.jsx
// AI-powered code interpretation component

import React, { useState, useEffect } from 'react';
import { aiInterpreter } from '../utils/aiInterpreter.js';

const AIInterpretation = ({ codeData, isVisible, onClose }) => {
    const [interpretation, setInterpretation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMode, setSelectedMode] = useState('explain');
    const [customQuestion, setCustomQuestion] = useState('');
    const [showCustomQuestion, setShowCustomQuestion] = useState(false);

    const modes = aiInterpreter.getInterpretationModes();

    // Load interpretation when mode changes
    useEffect(() => {
        if (isVisible && codeData) {
            loadInterpretation();
        }
    }, [isVisible, codeData, selectedMode]);

    const loadInterpretation = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const result = await aiInterpreter.interpretCode(
                codeData,
                selectedMode,
                customQuestion,
                ''
            );
            
            const formatted = aiInterpreter.formatInterpretation(result);
            setInterpretation(formatted);
            
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomQuestionSubmit = () => {
        if (customQuestion.trim()) {
            loadInterpretation();
            setShowCustomQuestion(false);
        }
    };

    const getSafetyBadgeColor = (level) => {
        const colors = {
            critical: '#e74c3c',
            important: '#f39c12',
            standard: '#27ae60'
        };
        return colors[level] || colors.standard;
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: '#1a202c',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1.5rem'
                }}>
                    <div>
                        <h2 style={{
                            margin: 0,
                            color: '#e2e8f0',
                            fontSize: '1.5rem',
                            fontWeight: '600'
                        }}>
                            🤖 AI Code Interpretation
                        </h2>
                        <p style={{
                            margin: '0.5rem 0 0 0',
                            color: '#a0aec0',
                            fontSize: '0.9rem'
                        }}>
                            Clause {codeData?.clause}: {codeData?.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#a0aec0',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '8px'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Mode Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{
                        color: '#e2e8f0',
                        fontSize: '1rem',
                        marginBottom: '0.75rem'
                    }}>
                        Interpretation Mode
                    </h3>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                    }}>
                        {modes.map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: selectedMode === mode.id ? '#3498db' : '#4a5568',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                }}
                                title={mode.description}
                            >
                                {mode.icon} {mode.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Question Section */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setShowCustomQuestion(!showCustomQuestion)}
                        style={{
                            background: 'none',
                            border: '1px solid #4a5568',
                            color: '#e2e8f0',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        💬 Ask Custom Question
                    </button>
                    
                    {showCustomQuestion && (
                        <div style={{ marginTop: '0.75rem' }}>
                            <input
                                type="text"
                                value={customQuestion}
                                onChange={(e) => setCustomQuestion(e.target.value)}
                                placeholder="Ask a specific question about this code section..."
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #4a5568',
                                    backgroundColor: '#2d3748',
                                    color: '#e2e8f0',
                                    fontSize: '0.9rem',
                                    marginBottom: '0.5rem'
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && handleCustomQuestionSubmit()}
                            />
                            <button
                                onClick={handleCustomQuestionSubmit}
                                disabled={!customQuestion.trim()}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: customQuestion.trim() ? '#3498db' : '#4a5568',
                                    color: 'white',
                                    cursor: customQuestion.trim() ? 'pointer' : 'not-allowed',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Get Answer
                            </button>
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: '#a0aec0'
                    }}>
                        <div style={{
                            display: 'inline-block',
                            width: '32px',
                            height: '32px',
                            border: '3px solid #4a5568',
                            borderTop: '3px solid #3498db',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginBottom: '1rem'
                        }}></div>
                        <p>🤖 AI is analyzing the code section...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div style={{
                        backgroundColor: '#742a2a',
                        border: '1px solid #e53e3e',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem'
                    }}>
                        <h4 style={{ color: '#fed7d7', margin: '0 0 0.5rem 0' }}>
                            ❌ Interpretation Error
                        </h4>
                        <p style={{ color: '#feb2b2', margin: 0, fontSize: '0.9rem' }}>
                            {error}
                        </p>
                        <button
                            onClick={loadInterpretation}
                            style={{
                                marginTop: '0.75rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#e53e3e',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            🔄 Retry
                        </button>
                    </div>
                )}

                {/* Interpretation Results */}
                {interpretation && !isLoading && !error && (
                    <div style={{
                        backgroundColor: '#2d3748',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid #4a5568'
                    }}>
                        {/* Interpretation Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                            paddingBottom: '0.75rem',
                            borderBottom: '1px solid #4a5568'
                        }}>
                            <h3 style={{
                                margin: 0,
                                color: '#e2e8f0',
                                fontSize: '1.1rem'
                            }}>
                                {interpretation.title}
                            </h3>
                            
                            {/* Safety Level Badge */}
                            {interpretation.safetyLevel && (
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    backgroundColor: getSafetyBadgeColor(interpretation.safetyLevel),
                                    color: 'white',
                                    textTransform: 'uppercase'
                                }}>
                                    {interpretation.safetyLevel}
                                </span>
                            )}
                        </div>

                        {/* AI Explanation */}
                        <div style={{
                            color: '#e2e8f0',
                            lineHeight: '1.6',
                            fontSize: '0.95rem',
                            marginBottom: '1rem',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {interpretation.content}
                        </div>

                        {/* Related Sections */}
                        {interpretation.relatedSections && interpretation.relatedSections.length > 0 && (
                            <div style={{ marginTop: '1rem' }}>
                                <h4 style={{
                                    color: '#a0aec0',
                                    fontSize: '0.9rem',
                                    marginBottom: '0.5rem'
                                }}>
                                    🔗 Related Code Sections
                                </h4>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem'
                                }}>
                                    {interpretation.relatedSections.map((section, index) => (
                                        <span
                                            key={index}
                                            style={{
                                                padding: '0.25rem 0.75rem',
                                                backgroundColor: '#4a5568',
                                                color: '#e2e8f0',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            {section}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Confidence Score */}
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            backgroundColor: '#1a202c',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{
                                color: '#a0aec0',
                                fontSize: '0.8rem'
                            }}>
                                AI Confidence Level
                            </span>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <div style={{
                                    width: '100px',
                                    height: '6px',
                                    backgroundColor: '#4a5568',
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${(interpretation.confidence || 0.9) * 100}%`,
                                        height: '100%',
                                        backgroundColor: interpretation.confidence > 0.8 ? '#27ae60' : 
                                                        interpretation.confidence > 0.6 ? '#f39c12' : '#e74c3c',
                                        transition: 'width 0.3s ease'
                                    }}></div>
                                </div>
                                <span style={{
                                    color: '#e2e8f0',
                                    fontSize: '0.8rem',
                                    fontWeight: '600'
                                }}>
                                    {Math.round((interpretation.confidence || 0.9) * 100)}%
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{
                    marginTop: '1.5rem',
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={() => setShowCustomQuestion(!showCustomQuestion)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: '1px solid #4a5568',
                            backgroundColor: 'transparent',
                            color: '#e2e8f0',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        💬 Ask Question
                    </button>
                    
                    <button
                        onClick={loadInterpretation}
                        disabled={isLoading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: isLoading ? '#4a5568' : '#3498db',
                            color: 'white',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
                    </button>
                    
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#4a5568',
                            color: '#e2e8f0',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIInterpretation;