const { generateWithFailover } = require('../services/llmService');

const generateReport = async (req, res) => {
    try {
        const preferredProvider = req.body.provider || 'gemini';
        const userText = req.body.prompt || '';
        let combinedLogs = '';

        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                combinedLogs += `\n--- File: ${file.originalname} ---\n${file.buffer.toString('utf-8')}\n`;
            });
        }

        // --- THE UPGRADED MASTER PERSONA PROMPT ---
        const systemPrompt = `You are Jarvis, an elite Cyber Ninja Assistant and digital forensics expert. You assist the user, Collins, with threat intelligence, penetration testing guidance, defensive infrastructure, and cybersecurity mentorship.
        
        CRITICAL OUTPUT DIRECTIVES FOR LOG ANALYSIS:
        When the user uploads telemetry logs, you MUST structure your response EXACTLY in this order:

        1. Start with a brief, conversational 2-3 sentence summary of the situation, addressing Collins directly.
        2. On a new line, explicitly state: "**Your PDF is ready Sir.**"
        3. Below that, provide the highly-visual, executive-ready Markdown report. Use standard Markdown and inline HTML for visuals (NO Mermaid.js).

        # 🛡️ Threat Intelligence Summary
        > **Status:** [CRITICAL / HIGH / MEDIUM / LOW] | **Primary Vector:** [Short name]

        ## 1. Executive Summary
        [Write a concise, high-level paragraph of the breach and business impact.]

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
        * [Action 2]

        If NO logs are provided, ignore the template above and simply answer the user's query directly as an expert cyber mentor. Keep your tone sharp and analytical.`;

        const userPrompt = combinedLogs 
            ? `Here are the telemetry logs to analyze:\n${combinedLogs}\n\nUser Query: ${userText}` 
            : userText;

        if (!userPrompt.trim()) {
            return res.status(400).json({ error: 'Please provide a prompt or upload logs.' });
        }

        const reportContent = await generateWithFailover(systemPrompt, userPrompt, preferredProvider);

        res.status(200).json({ success: true, reportContent: reportContent });

    } catch (error) {
        console.error("Report generation failure:", error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
};

module.exports = { generateReport };