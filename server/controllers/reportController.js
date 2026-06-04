// server/controllers/reportController.js
const { generateWithFailover } = require('../services/llmService');

const generateReport = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No log files provided.' });
        }

        // Extract the user's toggle choice from the frontend, defaulting to Gemini to bypass your 400 error
        const preferredProvider = req.body.provider || 'gemini'; 

        let combinedLogs = '';
        req.files.forEach(file => {
            combinedLogs += `\n--- File: ${file.originalname} ---\n${file.buffer.toString('utf-8')}\n`;
        });

        console.log(`Analyzing logs with preferred provider: ${preferredProvider}`);

        // Define your master formatting rules
        const systemPrompt = `You are an expert Red Team Operator and Cybersecurity Analyst. Translate the provided raw penetration testing logs into a comprehensive, executive-ready security report.
        
        Analyze the data and output strictly in the following Markdown structure. Generate Mermaid.js code for any attack path diagrams. Do not include conversational filler.
        
        # RedReport AI Confidential Security Report
        
        ## 1. Executive Summary
        Provide a 3-4 sentence high-level overview for C-suite executives. State what was compromised, the overall severity, and the primary business risk.
        
        ## 2. Risk Heatmap
        Categorize the overall engagement risk using a standard Markdown table (Metrics: Overall Severity, Assets Compromised, Primary Threat Vector).
        
        ## 3. Attack Path Visualized
        Provide a Mermaid.js graph (graph TD) illustrating how the vulnerability was exploited.
        
        ## 4. Detailed Findings
        For each vulnerability: List the CVE/Name, Affected Asset, Log Evidence (short snippet), and Business Impact.
        
        ## 5. Remediation Roadmap
        Provide prioritized, actionable steps (Immediate and Strategic) to secure the environment.`;
        
        const userPrompt = `Here are the raw penetration testing logs to analyze:\n${combinedLogs}`;

        // Execute the resilient LLM call
        const reportContent = await generateWithFailover(systemPrompt, userPrompt, preferredProvider);

        res.status(200).json({
            success: true,
            reportContent: reportContent
        });

    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
};

module.exports = { generateReport };