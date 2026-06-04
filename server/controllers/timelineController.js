// server/controllers/timelineController.js
const { Anthropic } = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const analyzeTimeline = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No data files provided for timeline analysis.' });
        }

        let combinedLogs = '';
        req.files.forEach(file => {
            combinedLogs += `\n--- File: ${file.originalname} ---\n${file.buffer.toString('utf-8')}\n`;
        });

        const systemPrompt = `You are an expert Incident Response Analyst and Digital Forensics specialist. Your task is to process messy security logs and construct a clean, chronological timeline of the security incident.

        Output your analysis strictly as a JSON array of event objects. Do not wrap the JSON in markdown code blocks, and do not provide any conversational text. The JSON must exactly match this schema:

        [
          {
            "timestamp": "YYYY-MM-DD HH:MM:SS or relative time found in logs",
            "event": "Short, clear title of the action (e.g., Subnet Scan Initiated)",
            "sourceIp": "Source IP or N/A",
            "targetIp": "Target IP or N/A",
            "severity": "Critical | High | Medium | Low",
            "details": "A 1-2 sentence description of what occurred and what technical indicators prove it."
          }
        ]

        Analyze the timestamps and event order carefully. Sort the array chronologically from the earliest event to the latest event.`;

        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 3000,
            temperature: 0.1, // High determination for strict schema alignment
            system: systemPrompt,
            messages: [{ role: "user", content: `Analyze these logs and generate the JSON timeline:\n${combinedLogs}` }]
        });

        // Parse and return the direct JSON structure to the frontend
        const timelineData = JSON.parse(message.content[0].text.trim());
        res.status(200).json({ success: true, data: timelineData });

    } catch (error) {
        console.error("Timeline analysis failure:", error);
        res.status(500).json({ error: 'Failed to analyze incident timeline', details: error.message });
    }
};

module.exports = { analyzeTimeline };