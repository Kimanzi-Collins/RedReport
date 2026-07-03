const { generateWithFailover } = require('../services/llmService');

const generateReport = async (req, res) => {
    try {
        const body = req.body || {};
        const preferredProvider = body.provider || 'claude';
        const userText = body.prompt || '';
        const reportType = body.reportType || 'executive';
        const operator = (body.username || '').trim() || 'Operator';
        let combinedLogs = '';

        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                combinedLogs += `\n--- File: ${file.originalname} ---\n${file.buffer.toString('utf-8')}\n`;
            });
        }

        let systemPrompt = "";

        if (combinedLogs) {
            // SCENARIO 1: TELEMETRY UPLOADED -> DUAL PAYLOAD GENERATION
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
                // The VulnScribe Executive Technical Template
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
            // SCENARIO 2: PURE CYBERSECURITY MENTORSHIP
            systemPrompt = `You are Jarvis, an elite Cyber Ninja Assistant, expert Red Team Operator, and Cybersecurity Analyst. 
            You assist the user, ${operator}, with threat intelligence, penetration testing guidance, defensive infrastructure, and incident response.
            
            CRITICAL DIRECTIVES:
            - The user has NOT uploaded any telemetry logs. Do NOT generate a threat intelligence report. 
            - Answer their query directly, conversationally, and helpfully.
            - Keep your tone sharp, highly analytical, authoritative, and slightly futuristic. 
            - Do not use generic AI caveats (e.g., "As an AI..."). Give actionable, precise cybersecurity directives.
            - Format your responses beautifully using standard Markdown, bullet points, and code blocks where applicable.`;
        }

        const userPrompt = combinedLogs 
            ? `Here are the telemetry logs to analyze:\n${combinedLogs}\n\nUser Query: ${userText}` 
            : userText;

        if (!userPrompt.trim()) return res.status(400).json({ error: 'Please provide a prompt or upload logs.' });

        const reportContent = await generateWithFailover(systemPrompt, userPrompt, preferredProvider);
        res.status(200).json({ success: true, reportContent: reportContent });

    } catch (error) {
        console.error("Report generation failure:", error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
};

module.exports = { generateReport };
