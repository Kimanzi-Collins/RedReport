// server/controllers/mitreController.js
const { generateWithFailover } = require('../services/llmService');

const mapMitreAttack = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No data files provided for MITRE mapping.' });
        }

        const preferredProvider = req.body.provider || 'claude';

        let combinedLogs = '';
        req.files.forEach(file => {
            combinedLogs += `\n--- File: ${file.originalname} ---\n${file.buffer.toString('utf-8')}\n`;
        });

        console.log(`Mapping MITRE ATT&CK with preferred provider: ${preferredProvider}`);

        const systemPrompt = `You are a Cyber Threat Intelligence specialist. Analyze the provided exploitation logs and map the adversary actions directly to the MITRE ATT&CK enterprise framework.

        Output your analysis strictly as a JSON object matching the exact format below. Do not include introductory text, explanations, or code block formatting tags.

        {
          "mappedTechniques": [
            {
              "tactic": "Initial Access | Execution | Persistence | Privilege Escalation | Defense Evasion | Credential Access | Discovery | Lateral Movement",
              "techniqueId": "e.g., T1190 or T1059",
              "techniqueName": "e.g., Exploit Public-Facing Application",
              "confidence": "High | Medium | Low",
              "justification": "Explain exactly what indicators or commands in the log match this specific MITRE technique."
            }
          ]
        }`;

        const userPrompt = `Map the following log markers to MITRE ATT&CK:\n${combinedLogs}`;

        const rawData = await generateWithFailover(systemPrompt, userPrompt, preferredProvider);
        
        const cleanJsonString = rawData.replace(/```json|```/g, '').trim();
        const mitreData = JSON.parse(cleanJsonString);
        
        res.status(200).json({ success: true, data: mitreData });

    } catch (error) {
        console.error("MITRE mapping failure:", error);
        res.status(500).json({ error: 'Failed to complete MITRE ATT&CK mapping', details: error.message });
    }
};

module.exports = { mapMitreAttack };