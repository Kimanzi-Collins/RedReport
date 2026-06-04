const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize existing SDKs
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// NEW: Nvidia NIM Engine (Llama 3.1 70B)
async function callNvidia(systemPrompt, userPrompt) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error("NVIDIA_API_KEY is missing from .env");

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "meta/llama-3.1-70b-instruct",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.2, // Low temp for highly analytical, factual output
            max_tokens: 2048
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Nvidia API Error [${response.status}]: ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Legacy Engines
async function callGemini(systemPrompt, userPrompt) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
    return result.response.text();
}

async function callClaude(systemPrompt, userPrompt) {
    const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
    });
    return response.content[0].text;
}

// Master Routing Function
async function generateWithFailover(systemPrompt, userPrompt) {
    // Demo Mode Safety Valve
    if (process.env.USE_DEMO_MODE === 'true') {
        console.log("DEMO MODE ACTIVE: Returning simulated response...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (systemPrompt.includes("JSON array")) {
            return JSON.stringify([{ timestamp: "2026-06-04 22:15:05", event: "Recon", sourceIp: "192.168.1.105", targetIp: "10.0.0.50", severity: "Low", details: "NMAP scan detected." }]);
        }
        return `### 🚨 Executive Summary: Simulated Breach\nSystem compromised via SSH brute force. Isolate network immediately.`;
    }

    try {
        console.log("Attempting Nvidia NIM Engine (Llama 3.1 70B)...");
        return await callNvidia(systemPrompt, userPrompt);
    } catch (primaryError) {
        console.error("Nvidia API failed:", primaryError.message);
        console.log("Falling back to Gemini Engine...");
        
        try {
            return await callGemini(systemPrompt, userPrompt);
        } catch (fallbackError) {
            console.error("Gemini API failed:", fallbackError.message);
            throw new Error("Critical System Failure: All LLM intelligence engines are offline.");
        }
    }
}

module.exports = { generateWithFailover };