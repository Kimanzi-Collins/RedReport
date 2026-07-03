// Shared streaming-provider logic for /api/stream (Node/Express runtime only).
//
// SYNC WARNING: server/netlify/edge-functions/stream.mjs runs on Netlify's
// Deno-based Edge Runtime and cannot `require()` this CommonJS module, so it
// keeps a manually-synced duplicate of the provider map, fallback order, and
// timeout logic below. If you change fallback order, the timeout value, or a
// provider's fetch/transform logic here, mirror the change in stream.mjs.

const PROVIDER_TIMEOUT_MS = 10000;

function withTimeout(ms) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

async function fetchWithTimeout(url, options, ms) {
    const { signal, clear } = withTimeout(ms);
    try {
        return await fetch(url, { ...options, signal });
    } catch (error) {
        if (error.name === 'AbortError') throw new Error('TIMEOUT');
        throw error;
    } finally {
        clear();
    }
}

async function httpError(resp) {
    const body = await resp.text().catch(() => '');
    return new Error(`HTTP_${resp.status}${body ? `: ${body.slice(0, 300)}` : ''}`);
}

const streamProviders = {
    nvidia: async (sys, usr) => {
        const apiKey = process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY;
        if (!apiKey) throw new Error("NVIDIA_API_KEY missing");
        const resp = await fetchWithTimeout("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST", headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "Accept": "text/event-stream" },
            body: JSON.stringify({ model: "meta/llama-3.3-70b-instruct", messages: [{role: "system", content: sys}, {role: "user", content: usr}], temperature: 0.2, max_tokens: 2048, stream: true })
        }, PROVIDER_TIMEOUT_MS);
        if (!resp.ok) throw await httpError(resp);
        return resp.body;
    },
    claude: async (sys, usr) => {
        const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error("CLAUDE_API_KEY missing");
        const resp = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
            method: "POST", headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json", "accept": "text/event-stream" },
            body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 2048, thinking: { type: "disabled" }, system: sys, messages: [{role: "user", content: usr}], stream: true })
        }, PROVIDER_TIMEOUT_MS);
        if (!resp.ok) throw await httpError(resp);
        let buffer = '';
        const transform = new TransformStream({
            transform(chunk, controller) {
                buffer += new TextDecoder().decode(chunk, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim();
                        if (dataStr === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({choices: [{delta: {content: parsed.delta.text}}]})}\n\n`));
                            }
                        } catch (e) {}
                    }
                }
            }
        });
        return resp.body.pipeThrough(transform);
    },
    gemini: async (sys, usr) => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY missing");
        const resp = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ systemInstruction: {parts: [{text: sys}]}, contents: [{role: "user", parts: [{text: usr}]}] })
        }, PROVIDER_TIMEOUT_MS);
        if (!resp.ok) throw await httpError(resp);
        let buffer = '';
        const transform = new TransformStream({
            transform(chunk, controller) {
                buffer += new TextDecoder().decode(chunk, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim();
                        if (dataStr === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(dataStr);
                            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (content) {
                                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({choices: [{delta: {content}}]})}\n\n`));
                            }
                        } catch (e) {}
                    }
                }
            }
        });
        return resp.body.pipeThrough(transform);
    }
};

function getStreamProviderOrder(preferredProvider) {
    const norm = (preferredProvider || 'claude').toLowerCase();
    return [norm, 'claude', 'gemini', 'nvidia'].filter((p, i, arr) => streamProviders[p] && arr.indexOf(p) === i);
}

async function getFailoverStreamBody(systemPrompt, userPrompt, preferredProvider) {
    const errors = [];
    for (const provider of getStreamProviderOrder(preferredProvider)) {
        try {
            console.log(`Attempting ${provider} engine (stream)...`);
            return await streamProviders[provider](systemPrompt, userPrompt);
        } catch (error) {
            console.error(`Stream provider ${provider} failed: ${error.message}`);
            errors.push(`${provider}:${error.message}`);
        }
    }
    const failure = new Error('All streaming engines failed.');
    failure.details = errors.join(' | ');
    throw failure;
}

module.exports = { streamProviders, getStreamProviderOrder, getFailoverStreamBody, PROVIDER_TIMEOUT_MS };
