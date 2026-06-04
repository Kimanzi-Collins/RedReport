const { generateWithFailover } = require('../services/llmService');

const generateReport = async (req, res) => {
    try {
        const preferredProvider = req.body.provider || 'gemini';
        const userText = req.body.prompt || '';
        const reportType = req.body.reportType || 'executive'; // 'executive' or 'investor'
        let combinedLogs = '';

        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                combinedLogs += `\n--- File: ${file.originalname} ---\n${file.buffer.toString('utf-8')}\n`;
            });
        }

        // --- DYNAMIC PERSONA ROUTING ---
        let reportTemplate = "";
        
        if (reportType === 'investor') {
            reportTemplate = `
        # 📈 Cyber Risk & Financial Impact Report
        > **Status:** [CRITICAL / HIGH / MODERATE] | **Risk Exposure:** [Financial/Reputational]

        ## 1. Investor Briefing
        [Write a concise, high-level paragraph explaining the security event purely in terms of business impact, avoiding deep technical jargon like 'buffer overflow' or 'reverse shell'. Use terms like 'unauthorized access' or 'data exposure'.]

        ## 2. Liability & Compliance Exposure
        | Risk Category | Exposure Level | Potential Impact |
        |---------------|----------------|------------------|
        | **Regulatory (GDPR/CCPA)** | [High/Low] | [Fines/Penalties] |
        | **Brand Reputation** | [High/Low] | [Customer Trust] |
        | **Business Continuity** | [High/Low] | [Downtime/Revenue Loss] |

        ## 3. Incident Timeline (Business Context)
        1. 🕒 **Initial Breach:** [When and how the perimeter was compromised]
        2. 📉 **Impact Event:** [What business assets were exposed]
        3. 🛡️ **Containment:** [Action taken to stop the bleeding]

        ## 4. Strategic Mitigation & ROI
        <div style="margin: 15px 0; padding: 10px; background-color: #F3F4F6; border-left: 4px solid #0EA5E9;">
           <strong>Recommended CAPEX/OPEX Security Investment:</strong>
           <div style="width: 100%; background-color: #E5E7EB; border-radius: 5px; margin-top: 5px;">
              <div style="width: 75%; background-color: #0EA5E9; height: 10px; border-radius: 5px;"></div>
           </div>
           <p style="margin-top:8px; font-size:12px; color:#4B5563;">Implementation of Zero-Trust Architecture required to protect future shareholder value.</p>
        </div>`;
        } else {
            // Standard Executive Template
            reportTemplate = `
        # 🛡️ Threat Intelligence Summary
        > **Status:** [CRITICAL / HIGH / MEDIUM / LOW] | **Primary Vector:** [Short name]

        ## 1. Executive Summary
        [Write a concise, high-level paragraph of the breach and technical impact.]

        ## 2. Risk Heatmap
        | Metric | Status | Severity |
        |--------|--------|----------|
        | **Compromised Assets** | [List IP/System] | [High/Low] |
        | **Data Exfiltration** | [Confirmed/Denied] | [High/Low] |
        | **Lateral Movement** | [Detected/None] | [High/Low] |

        ## 3. Attack Chain Visualized
        1. 🔍 **Reconnaissance:** [Description]
        2. 🔓 **Initial Access:** [Description]
        3. 💻 **Execution:** [Description]
        4. 📤 **Exfiltration:** [Description]

        ## 4. Threat Metrics
        <div style="margin: 15px 0; padding: 10px; background-color: #F3F4F6; border-left: 4px solid #DC2626;">
           <strong>Overall Threat Severity:</strong>
           <div style="width: 100%; background-color: #E5E7EB; border-radius: 5px; margin-top: 5px;">
              <div style="width: 90%; background-color: #DC2626; height: 10px; border-radius: 5px;"></div>
           </div>
        </div>

        ## 5. Defensive Blueprint
        ### 🚨 Immediate Actions
        * [Action 1]
        * [Action 2]`;
        }

        const systemPrompt = `You are Jarvis, an elite Cyber Ninja Assistant. 
        CRITICAL OUTPUT DIRECTIVES:
        1. Start with a brief, conversational 2-3 sentence summary addressing Collins directly.
        2. On a new line, explicitly state: "**Your PDF is ready Sir.**"
        3. Below that, provide the highly-visual Markdown report matching this EXACT template:
        ${reportTemplate}
        
        Do not use Mermaid.js. Use inline HTML for visual bars as requested in the template.`;

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