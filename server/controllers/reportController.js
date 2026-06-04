// server/controllers/reportController.js
const { Anthropic } = require('@anthropic-ai/sdk');

// Initialize the Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const generateReport = async (req, res) => {
    try {
        // 1. Ensure files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No log files provided.' });
        }

        // 2. Extract text from the uploaded files
        let combinedLogs = '';
        req.files.forEach(file => {
            const fileContent = file.buffer.toString('utf-8');
            combinedLogs += `\n--- File: ${file.originalname} ---\n${fileContent}\n`;
        });

        console.log("Analyzing logs and communicating with Claude...");

        // 3. Define the System Prompt (The Executive Formatting Rules)
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

        // 4. Send the request to Claude 3.5 Sonnet
        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 2500,
            temperature: 0.2, // Low temperature for factual, analytical output
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: `Here are the raw penetration testing logs to analyze:\n${combinedLogs}`
                }
            ]
        });

        // 5. Send the Markdown response back to the client
        res.status(200).json({
            success: true,
            reportContent: message.content[0].text
        });

    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
};

module.exports = { generateReport };