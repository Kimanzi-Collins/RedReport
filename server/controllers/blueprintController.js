const { generateWithFailover } = require('../services/llmService');

const generateBlueprint = async (req, res) => {
    try {
        const preferredProvider = req.body.provider || 'claude';
        let combinedLogs = '';

        // SPEED OPTIMIZATION 1: Payload Truncation
        // We slice the buffer to 15,000 characters. The LLM only needs the critical 
        // vulnerability signatures to generate a patch, not the entire 50MB haystack.
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const rawText = file.buffer.toString('utf-8');
                combinedLogs += `\n--- File: ${file.originalname} ---\n${rawText.substring(0, 15000)}\n`;
            });
        }

        const systemPrompt = `You are Jarvis, an elite Infrastructure as Code (IaC) and DevSecOps expert. 
        Your task is to read the provided vulnerability logs and generate a strict, deployable defensive blueprint to patch the vulnerabilities.
        
        CRITICAL DIRECTIVES:
        1. Output ONLY valid Markdown containing code blocks. Do NOT include conversational greetings.
        2. First, provide a Terraform configuration (\`main.tf\`) for network/firewall rules to block the threat vectors.
        3. Second, provide an Ansible playbook (\`patch.yml\`) for server-level remediations and OS patching.`;

        const userPrompt = combinedLogs 
            ? `Generate mitigation scripts for these logs:\n${combinedLogs}` 
            : `Generate a baseline secure infrastructure blueprint for a standard web server environment.`;

        const reportContent = await generateWithFailover(systemPrompt, userPrompt, preferredProvider);
        
        // Return exactly what the MitigationView.tsx is looking for
        res.status(200).json({ success: true, reportContent: reportContent });

    } catch (error) {
        console.error("Blueprint generation failure:", error);
        res.status(500).json({ error: 'Failed to generate blueprint', details: error.message });
    }
};

module.exports = { generateBlueprint };