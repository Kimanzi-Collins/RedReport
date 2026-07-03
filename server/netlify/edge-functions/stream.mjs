// SYNC WARNING: this file duplicates server/services/streamProviders.js
// (fallback order, per-provider timeout, provider fetch/transform logic)
// because Netlify Edge Functions run on Deno and cannot `require()` that
// CommonJS module. Keep both in lockstep when changing provider behavior.
const PROVIDER_TIMEOUT_MS = 10000;

async function fetchWithTimeout(url, options, ms) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
        if (error.name === 'AbortError') throw new Error('TIMEOUT');
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

export default async (req, context) => {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    try {
        const body = await req.json();
        const preferredProvider = body.provider || 'claude';
        const userText = body.prompt || '';
        const reportType = body.reportType || 'executive';
        const fileContents = body.fileContents || [];
        const endpoint = body.endpoint || 'report';
        const operator = (body.username || '').trim() || 'Operator';

        let combinedLogs = '';
        if (fileContents.length > 0) {
            fileContents.forEach(file => {
                if (endpoint === 'blueprint') {
                    combinedLogs += `\n--- File: ${file.name} ---\n${file.content.substring(0, 15000)}\n`;
                } else {
                    combinedLogs += `\n--- File: ${file.name} ---\n${file.content}\n`;
                }
            });
        }

        let systemPrompt = "";

        if (endpoint === 'blueprint') {
            systemPrompt = `You are Jarvis, an elite Infrastructure as Code (IaC) and DevSecOps expert. 
            Your task is to read the provided vulnerability logs and generate a strict, deployable defensive blueprint to patch the vulnerabilities.
            
            CRITICAL DIRECTIVES:
            1. Output ONLY valid Markdown containing code blocks. Do NOT include conversational greetings.
            2. First, provide a Terraform configuration (\`main.tf\`) for network/firewall rules to block the threat vectors.
            3. Second, provide an Ansible playbook (\`patch.yml\`) for server-level remediations and OS patching.`;
        } else if (endpoint === 'timeline') {
            systemPrompt = `You are an expert Incident Response Analyst and Digital Forensics specialist. Your task is to process security logs and construct a clean, chronological timeline of the security incident.

            Output your analysis strictly as a JSON array of event objects. Do not wrap the JSON in markdown code blocks, and do not provide any conversational text. The JSON must exactly match this schema:

            [
              {
                "timestamp": "YYYY-MM-DD HH:MM:SS",
                "event": "Short title",
                "sourceIp": "IP or N/A",
                "targetIp": "IP or N/A",
                "severity": "Critical | High | Medium | Low",
                "details": "Description of what occurred."
              }
            ]`;
        } else {
            // Default Report
            if (combinedLogs) {
                let reportTemplate = "";
                if (reportType === 'investor') {
                    reportTemplate = `
            # 📈 Cyber Risk & Financial Impact Report
            > **Status:** [CRITICAL / HIGH / MODERATE] | **Risk Exposure:** [Financial/Reputational]

            ## 1. Investor Briefing
            [Provide a 3-4 sentence high-level overview for the Board. State what was compromised and the primary business risk (e.g., data theft, system downtime). Avoid deep technical jargon.]

            ## 2. Liability & Compliance Exposure
            | Framework / Risk Category | Exposure Level | Potential Impact / Failing Controls |
            | :--- | :--- | :--- |
            | **Regulatory (e.g., GDPR, CBK, PCI)** | [High/Low] | [Fines/Penalties] |
            | **Brand Reputation** | [High/Low] | [Customer Trust / Churn] |
            | **Business Continuity** | [High/Low] | [Downtime/Revenue Loss] |

            ## 3. Financial Risk Exposure
            * **Estimated Breach Cost:** [Provide a realistic monetary estimate based on the data context]
            * **Primary Financial Driver:** [e.g., Ransomware downtime, PII leakage]

            ## 4. Strategic Mitigation & ROI
            <div style="margin: 15px 0; padding: 10px; background-color: #F3F4F6; border-left: 4px solid #DC2626;">
               <strong>Recommended CAPEX/OPEX Security Investment Priority:</strong>
               <div style="width: 100%; background-color: #E5E7EB; border-radius: 5px; margin-top: 5px;">
                  <div style="width: [ESTIMATED PERCENTAGE]%; background-color: #DC2626; height: 10px; border-radius: 5px;"></div>
               </div>
               <p style="margin-top:8px; font-size:12px; color:#111827;">[1 sentence investment justification, e.g., Implementation of Zero-Trust Architecture required to protect shareholder value.]</p>
            </div>

            ## 5. Recommended Board Actions
            ### 🚨 Immediate Authorization (0-72h)
            * [Action 1 - e.g., Approve emergency patch deployment budget]
            ### 🛡️ Strategic Directives (Q-over-Q)
            * [Action 2 - e.g., Authorize network redesign]`;
                } else {
                    reportTemplate = `
            # 🛡️ VulnScribe Confidential Security Report
            > **Status:** [CRITICAL / HIGH / MEDIUM / LOW] | **Primary Vector:** [e.g., Unpatched Service, Phishing]

            ## 1. Executive Summary
            [Provide a 3-4 sentence high-level overview for C-suite executives. State what was compromised, the overall severity, and the primary business risk.]

            ## 2. Risk Heatmap
            | Metric | Status/Level |
            | :--- | :--- |
            | **Overall Severity** | [Critical/High/Medium/Low] |
            | **Assets Compromised** | [Number or Name of assets] |
            | **Primary Threat Vector** | [Vector Name] |

            ## 3. Technical Methodology
            [Briefly list the tools and techniques observed in the logs (e.g., Nmap for reconnaissance, Metasploit for exploitation) to establish analytical credibility.]

            ## 4. Threat Metrics
            <div style="margin: 15px 0; padding: 10px; background-color: #F3F4F6; border-left: 4px solid #DC2626;">
               <strong>Overall Threat Severity:</strong>
               <div style="width: 100%; background-color: #E5E7EB; border-radius: 5px; margin-top: 5px;">
                  <div style="width: [ESTIMATED PERCENTAGE]%; background-color: #DC2626; height: 10px; border-radius: 5px;"></div>
               </div>
            </div>

            ## 5. Detailed Findings
            ### [Vulnerability Name/CVE]
            * **Affected Asset:** [IP or Hostname]
            * **Evidence:** [Provide a 1-2 line snippet from the logs proving the exploit]
            * **Business Impact:** [Explain the "So What?" - What can an attacker do with this access?]

            ## 6. Remediation Roadmap
            ### 🚨 Immediate Actions (Band-aid)
            * [Action 1]
            * [Action 2]
            ### 🛡️ Strategic Actions (Long-term)
            * [Action 1]`;
                }

                systemPrompt = `You are Jarvis, an elite Cyber Ninja Assistant, expert Red Team Operator, and Cybersecurity Analyst. 
                
                CRITICAL OUTPUT DIRECTIVES:
                1. Start with a brief, conversational 2-3 sentence summary addressing ${operator} directly about the uploaded logs.
                2. On a new line, explicitly state: "**Your PDF is ready Sir.**"
                3. Below that, provide the highly-visual Markdown report matching this EXACT template:
                ${reportTemplate}
                
                Do not include any conversational filler before or after the markdown report template. Do not use Mermaid.js. Use inline HTML for visual bars.`;

            } else {
                systemPrompt = `You are Jarvis, an elite Cyber Ninja Assistant, expert Red Team Operator, and Cybersecurity Analyst. 
                You assist the user, ${operator}, with threat intelligence, penetration testing guidance, defensive infrastructure, and incident response.
                
                CRITICAL DIRECTIVES:
                - The user has NOT uploaded any telemetry logs. Do NOT generate a threat intelligence report. 
                - Answer their query directly, conversationally, and helpfully.
                - Keep your tone sharp, highly analytical, authoritative, and slightly futuristic. 
                - Do not use generic AI caveats (e.g., "As an AI..."). Give actionable, precise cybersecurity directives.
                - Format your responses beautifully using standard Markdown, bullet points, and code blocks where applicable.`;
            }
        }

        let userPrompt = userText;
        if (combinedLogs) {
            if (endpoint === 'blueprint') {
                userPrompt = `Generate mitigation scripts for these logs:\n${combinedLogs}`;
            } else if (endpoint === 'timeline') {
                userPrompt = `Analyze these logs and generate the JSON timeline:\n${combinedLogs}`;
            } else {
                userPrompt = `Here are the telemetry logs to analyze:\n${combinedLogs}\n\nUser Query: ${userText}`;
            }
        }

        if (!userPrompt.trim()) return new Response(JSON.stringify({ error: 'Please provide a prompt or upload logs.' }), { status: 400 });

        const streamProviders = {
            nvidia: async (sys, usr) => {
                const apiKey = process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY;
                if (!apiKey) throw new Error("NVIDIA_API_KEY missing");
                const resp = await fetchWithTimeout("https://integrate.api.nvidia.com/v1/chat/completions", {
                    method: "POST", headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "Accept": "text/event-stream" },
                    body: JSON.stringify({ model: "meta/llama-3.3-70b-instruct", messages: [{role: "system", content: sys}, {role: "user", content: usr}], temperature: 0.2, max_tokens: 2048, stream: true })
                }, PROVIDER_TIMEOUT_MS);
                if (!resp.ok) throw new Error(`HTTP_${resp.status}`);
                return resp.body;
            },
            claude: async (sys, usr) => {
                const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
                if (!apiKey) throw new Error("CLAUDE_API_KEY missing");
                const resp = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
                    method: "POST", headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json", "accept": "text/event-stream" },
                    body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 2048, thinking: { type: "disabled" }, system: sys, messages: [{role: "user", content: usr}], stream: true })
                }, PROVIDER_TIMEOUT_MS);
                if (!resp.ok) throw new Error(`HTTP_${resp.status}`);
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
                if (!resp.ok) throw new Error(`HTTP_${resp.status}`);
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

        const getOrder = (pref) => {
            const norm = (pref || 'claude').toLowerCase();
            return [norm, 'claude', 'gemini', 'nvidia'].filter((p, i, arr) => streamProviders[p] && arr.indexOf(p) === i);
        };

        let streamBody = null;
        const engineErrors = [];
        for (const provider of getOrder(preferredProvider)) {
            try {
                console.log(`Attempting ${provider} engine (stream)...`);
                streamBody = await streamProviders[provider](systemPrompt, userPrompt);
                break;
            } catch (error) {
                console.error(`Stream provider ${provider} failed: ${error.message}`);
                engineErrors.push(`${provider}:${error.message}`);
            }
        }

        if (!streamBody) {
            return new Response(JSON.stringify({ error: 'All streaming engines failed.', details: engineErrors.join(' | ') }), { status: 500 });
        }

        return new Response(streamBody, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};

export const config = {
    path: "/api/stream"
};
