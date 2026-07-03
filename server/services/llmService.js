const { GoogleGenerativeAI } = require('@google/generative-ai');
const AnthropicSdk = require('@anthropic-ai/sdk');
const Anthropic = AnthropicSdk.Anthropic || AnthropicSdk.default || AnthropicSdk;

// Per-provider hard timeout so a hung upstream call can't block failover
// and can't hold the request open until the platform's own gateway 504s it.
const PROVIDER_TIMEOUT_MS = 10000;

// Nvidia NIM Engine (Llama 3.3 70B)
async function callNvidia(systemPrompt, userPrompt) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error("NVIDIA_API_KEY is missing from environment variables");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

    try {
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "meta/llama-3.3-70b-instruct",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.2,
                max_tokens: 2048
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP_${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        if (error.name === 'AbortError') throw new Error('TIMEOUT');
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function callGemini(systemPrompt, userPrompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing from environment variables");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`, { signal: controller.signal });
        return result.response.text();
    } catch (error) {
        if (error.name === 'AbortError') throw new Error('TIMEOUT');
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function callClaude(systemPrompt, userPrompt) {
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("CLAUDE_API_KEY is missing from environment variables");

    const anthropic = new Anthropic({ apiKey });

    try {
        const response = await anthropic.messages.create({
            model: "claude-sonnet-5",
            max_tokens: systemPrompt.includes("JSON array") ? 1024 : 2500,
            thinking: { type: "disabled" },
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
        }, { timeout: PROVIDER_TIMEOUT_MS });
        return response.content.find((block) => block.type === "text")?.text ?? "";
    } catch (error) {
        if (error.name === 'AbortError' || error.name === 'APIConnectionTimeoutError') throw new Error('TIMEOUT');
        throw error;
    }
}

const providers = {
    claude: callClaude,
    gemini: callGemini,
    nvidia: callNvidia,
};

function getProviderOrder(preferredProvider = 'claude') {
    const normalized = preferredProvider.toLowerCase();
    return [
        normalized,
        'claude',
        'gemini',
        'nvidia',
    ].filter((provider, index, order) => providers[provider] && order.indexOf(provider) === index);
}

function getErrorCode(error) {
    const message = error?.message || 'UNKNOWN_ERROR';
    const httpMatch = message.match(/\b(?:HTTP_|status[":\s]+|Error \[)(\d{3})\b/i);
    if (httpMatch) return `HTTP_${httpMatch[1]}`;
    if (message.includes('quota') || message.includes('Too Many Requests')) return 'RATE_LIMIT';
    if (message.includes('credit balance')) return 'INSUFFICIENT_CREDITS';
    if (message.includes('API key') || message.includes('api_key')) return 'AUTH_OR_KEY_ERROR';
    if (message.includes('missing from environment variables')) return 'MISSING_ENV';
    if (message === 'TIMEOUT') return 'TIMEOUT';
    return error?.name || 'ENGINE_ERROR';
}

// Master Routing Function
async function generateWithFailover(systemPrompt, userPrompt, preferredProvider = 'claude') {
    // Demo Mode Safety Valve
    if (process.env.USE_DEMO_MODE === 'true') {
        console.log("DEMO MODE ACTIVE: Returning simulated response...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (systemPrompt.includes("JSON array")) {
            return JSON.stringify([{ timestamp: "2026-06-04 22:15:05", event: "Recon", sourceIp: "192.168.1.105", targetIp: "10.0.0.50", severity: "Low", details: "NMAP scan detected." }]);
        }
        return `### 🚨 Executive Summary: Simulated Breach\nSystem compromised via SSH brute force. Isolate network immediately.`;
    }

    const errors = [];

    for (const provider of getProviderOrder(preferredProvider)) {
        try {
            console.log(`Attempting ${provider} engine...`);
            return await providers[provider](systemPrompt, userPrompt);
        } catch (error) {
            const code = getErrorCode(error);
            console.error(`${provider} engine failed: ${code}`);
            errors.push(`${provider}:${code}`);
        }
    }

    console.error("All LLM intelligence engines failed:", errors.join(' | '));
    throw new Error("AI engine not functional. Connection severed.");
}

module.exports = { generateWithFailover };
