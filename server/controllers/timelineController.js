// server/controllers/timelineController.js
const { generateWithFailover } = require('../services/llmService');

const analyzeTimeline = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No data files provided for timeline analysis.' });
        }

        const preferredProvider = req.body.provider || 'gemini';

        let combinedLogs = '';
        req.files.forEach(file => {
            combinedLogs += `\n--- File: ${file.originalname} ---\n${file.buffer.toString('utf-8')}\n`;
        });

        console.log(`Analyzing timeline with preferred provider: ${preferredProvider}`);

        const systemPrompt = `You are an expert Incident Response Analyst and Digital Forensics specialist. Your task is to process security logs and construct a clean, chronological timeline of the security incident.

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

        const userPrompt = `Analyze these logs and generate the JSON timeline:\n${combinedLogs}`;

        const rawData = await generateWithFailover(systemPrompt, userPrompt, preferredProvider);
        
        // Clean up any accidental markdown wrappers from the LLM
        const cleanJsonString = rawData.replace(/```json|```/g, '').trim();
        const timelineData = JSON.parse(cleanJsonString);
        
        res.status(200).json({ success: true, data: timelineData });

    } catch (error) {
        console.error("Timeline analysis failure:", error);
        res.status(500).json({ error: 'Failed to analyze incident timeline', details: error.message });
    }
};

// THIS IS THE CRITICAL LINE THAT WAS FAILING
module.exports = { analyzeTimeline };