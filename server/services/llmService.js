// server/services/llmService.js
const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenAI } = require('@google/genai');

// Initialize both AI clients
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function callClaude(systemPrompt, userPrompt) {
    const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 3000,
        temperature: 0.2,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
    });
    return response.content[0].text;
}

async function callGemini(systemPrompt, userPrompt) {
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash", // Fast, highly capable model ideal for log parsing
        contents: userPrompt,
        config: {
            systemInstruction: systemPrompt,
            temperature: 0.2
        }
    });
    return response.text;
}

// The core failover orchestration function
async function generateWithFailover(systemPrompt, userPrompt, preferredProvider = 'gemini') {
    if (preferredProvider === 'claude') {
        try {
            console.log("Attempting Claude API...");
            return await callClaude(systemPrompt, userPrompt);
        } catch (error) {
            console.warn(`Claude API failed (${error.message}). Automatically falling back to Gemini API...`);
            return await callGemini(systemPrompt, userPrompt);
        }
    } else {
        try {
            console.log("Attempting Gemini API...");
            return await callGemini(systemPrompt, userPrompt);
        } catch (error) {
            console.warn(`Gemini API failed (${error.message}). Automatically falling back to Claude API...`);
            return await callClaude(systemPrompt, userPrompt);
        }
    }
}

module.exports = { generateWithFailover };