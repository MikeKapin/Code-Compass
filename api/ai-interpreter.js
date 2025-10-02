// api/ai-interpreter.js
// AI-powered CSA code interpretation and explanation system

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { codeText, question, mode = 'explain', context = '' } = req.body;

        if (!codeText) {
            return res.status(400).json({ error: 'Code text is required' });
        }

        // Initialize Claude API
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('Claude API key not configured');
        }

        const interpretation = await interpretCode(codeText, question, mode, context, apiKey);

        return res.status(200).json({
            success: true,
            interpretation: interpretation,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI interpretation error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Interpret CSA code using Claude AI
 */
async function interpretCode(codeText, question, mode, context, apiKey) {
    const systemPrompts = {
        explain: `You are a certified gas technician and code expert specializing in CSA B149.1 (Installation Code for Gas Burning Appliances and Equipment) and related Canadian gas codes.

Your role is to provide clear, practical explanations of gas code requirements for gas technicians, inspectors, and contractors. You should:

1. Explain code requirements in plain language
2. Provide practical implementation guidance
3. Highlight safety considerations
4. Reference related code sections when relevant
5. Include real-world examples when helpful

Always maintain accuracy and emphasize safety. If a code interpretation could impact safety, clearly state when professional consultation is recommended.`,

        practical: `You are an experienced gas technician providing practical, field-ready guidance on CSA code implementation.

Focus on:
1. How to actually implement this code requirement on the job
2. Common mistakes to avoid
3. Tools and materials needed
4. Step-by-step procedures
5. Inspection checkpoints
6. What inspectors look for

Provide actionable, practical advice that technicians can use in the field.`,

        safety: `You are a gas safety expert focusing on the safety implications and requirements of CSA gas codes.

Emphasize:
1. Why this code requirement exists (safety rationale)
2. What hazards it prevents
3. Critical safety considerations during implementation
4. Personal protective equipment requirements
5. Emergency procedures if violations are found
6. Consequences of non-compliance

Always prioritize safety and be specific about safety risks.`,

        compare: `You are a code analyst helping users understand relationships and differences between gas code requirements.

Focus on:
1. How different code sections relate to each other
2. Differences between similar requirements
3. When different codes apply
4. Hierarchy of code requirements
5. Common areas of confusion
6. Cross-references to other relevant sections`
    };

    const userPrompts = {
        explain: `Please explain this CSA gas code section in clear, practical terms:

CODE SECTION:
${codeText}

${question ? `SPECIFIC QUESTION: ${question}` : ''}
${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

Provide a comprehensive explanation that a gas technician can understand and apply.`,

        practical: `Provide practical, field implementation guidance for this CSA code requirement:

CODE SECTION:
${codeText}

${question ? `SPECIFIC QUESTION: ${question}` : ''}
${context ? `JOB CONTEXT: ${context}` : ''}

Include step-by-step procedures, tools needed, and common field challenges.`,

        safety: `Analyze the safety implications and requirements of this CSA code section:

CODE SECTION:
${codeText}

${question ? `SAFETY QUESTION: ${question}` : ''}
${context ? `SAFETY CONTEXT: ${context}` : ''}

Focus on safety hazards, prevention measures, and compliance requirements.`,

        compare: `Analyze and compare this CSA code section with related requirements:

CODE SECTION:
${codeText}

${question ? `COMPARISON QUESTION: ${question}` : ''}
${context ? `COMPARISON CONTEXT: ${context}` : ''}

Explain relationships, differences, and when each requirement applies.`
    };

    const systemPrompt = systemPrompts[mode] || systemPrompts.explain;
    const userPrompt = userPrompts[mode] || userPrompts.explain;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 2000,
                temperature: 0.1,
                system: systemPrompt,
                messages: [{
                    role: "user",
                    content: userPrompt
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.status}`);
        }

        const data = await response.json();
        
        return {
            mode: mode,
            explanation: data.content[0].text,
            codeSection: extractCodeReference(codeText),
            relatedSections: findRelatedSections(codeText),
            safetyLevel: assessSafetyLevel(codeText),
            confidence: 0.9,
            responseTime: new Date().toISOString()
        };

    } catch (error) {
        throw new Error(`AI interpretation failed: ${error.message}`);
    }
}

/**
 * Extract code clause/section reference
 */
function extractCodeReference(codeText) {
    const clauseMatch = codeText.match(/(?:clause|section)\s+(\d+(?:\.\d+)*)/i);
    return clauseMatch ? clauseMatch[1] : null;
}

/**
 * Find related code sections based on content
 */
function findRelatedSections(codeText) {
    const related = [];
    
    // Pattern matching for common related topics
    if (codeText.toLowerCase().includes('vent')) {
        related.push('Section 8 - Venting Systems');
    }
    if (codeText.toLowerCase().includes('clearance')) {
        related.push('Section 7 - Installation Requirements');
    }
    if (codeText.toLowerCase().includes('piping')) {
        related.push('Section 6 - Gas Piping Systems');
    }
    if (codeText.toLowerCase().includes('appliance')) {
        related.push('Section 10 - Specific Appliances');
    }
    
    return related;
}

/**
 * Assess safety level of code requirement
 */
function assessSafetyLevel(codeText) {
    const criticalKeywords = ['explosion', 'fire', 'leak', 'carbon monoxide', 'emergency'];
    const importantKeywords = ['clearance', 'vent', 'safety', 'protection'];
    
    const text = codeText.toLowerCase();
    
    if (criticalKeywords.some(keyword => text.includes(keyword))) {
        return 'critical';
    }
    
    if (importantKeywords.some(keyword => text.includes(keyword))) {
        return 'important';
    }
    
    return 'standard';
}