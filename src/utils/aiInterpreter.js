// src/utils/aiInterpreter.js
// AI interpretation utility for Code Compass

export class AIInterpreter {
    constructor() {
        this.apiEndpoint = '/api/ai-interpreter';
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    }

    /**
     * Get AI interpretation of code section
     */
    async interpretCode(codeData, mode = 'explain', question = '', context = '') {
        const cacheKey = `${codeData.clause}_${mode}_${question}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const codeText = `Clause ${codeData.clause}: ${codeData.title}\n\n${codeData.description}`;
            
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    codeText: codeText,
                    question: question,
                    mode: mode,
                    context: context
                })
            });

            if (!response.ok) {
                throw new Error(`AI interpretation failed: ${response.status}`);
            }

            const result = await response.json();
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;

        } catch (error) {
            console.error('AI interpretation error:', error);
            throw error;
        }
    }

    /**
     * Get interpretation modes
     */
    getInterpretationModes() {
        return [
            {
                id: 'explain',
                name: 'Explain',
                icon: '💡',
                description: 'Clear explanation of code requirements'
            },
            {
                id: 'practical',
                name: 'Practical',
                icon: '🔧',
                description: 'Field implementation guidance'
            },
            {
                id: 'safety',
                name: 'Safety',
                icon: '⚠️',
                description: 'Safety implications and requirements'
            },
            {
                id: 'compare',
                name: 'Compare',
                icon: '📊',
                description: 'Compare with related code sections'
            }
        ];
    }

    /**
     * Format interpretation for display
     */
    formatInterpretation(interpretation) {
        if (!interpretation.success) {
            return {
                title: 'Interpretation Error',
                content: interpretation.error || 'Failed to generate interpretation',
                type: 'error'
            };
        }

        const data = interpretation.interpretation;
        
        return {
            title: this.getModeDisplayName(data.mode),
            content: data.explanation,
            codeSection: data.codeSection,
            relatedSections: data.relatedSections || [],
            safetyLevel: data.safetyLevel || 'standard',
            confidence: data.confidence || 0.9,
            type: 'success'
        };
    }

    getModeDisplayName(mode) {
        const names = {
            explain: '💡 Code Explanation',
            practical: '🔧 Practical Implementation',
            safety: '⚠️ Safety Analysis',
            compare: '📊 Code Comparison'
        };
        
        return names[mode] || '💡 AI Interpretation';
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            items: Array.from(this.cache.keys())
        };
    }
}

// Create singleton instance
export const aiInterpreter = new AIInterpreter();