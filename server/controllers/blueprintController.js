// server/controllers/blueprintController.js
const { Anthropic } = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const generateBlueprint = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No data files provided for defensive orchestration.' });
        }

        let combinedLogs = '';
        req.files.forEach(file => {
            combinedLogs += `\n--- File: ${file.originalname} ---\n${file.buffer.toString('utf-8')}\n`;
        });

        const systemPrompt = `You are an elite DevSecOps Engineer and Secure Infrastructure Architect. Analyze the technical breaches shown in the logs and generate concrete, production-grade defensive orchestration files.

        Your output must be a well-structured Markdown document containing structural engineering directives. Organize it exactly as follows:

        # Automated Hardening Blueprint

        ## 1. Network Perimeter Rules
        Provide the exact shell/firewall commands required to immediately drop malicious traffic or close unauthorized entry points identified in the logs (e.g., iptables, UFW, or AWS Security Group configurations).

        ## 2. Host Hardening Configurations
        Provide explicit config file modifications to block the exploit path. This must include code blocks showing the exact lines to change (e.g., /etc/ssh/sshd_config parameters, sysctl.conf kernel hardening, or Apache/Nginx site configs).

        ## 3. Automation Playbook
        Provide a complete, syntax-valid Ansible Playbook or Terraform snippet that automates the deployment of these specific remediation tasks. Ensure all variables are clearly commented.`;

        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 3500,
            temperature: 0.3, // Slightly higher for flexible engineering design output
            system: systemPrompt,
            messages: [{ role: "user", content: `Generate infrastructure remediation scripts based on these logs:\n${combinedLogs}` }]
        });

        res.status(200).json({
            success: true,
            blueprintContent: message.content[0].text
        });

    } catch (error) {
        console.error("Defensive blueprint failure:", error);
        res.status(500).json({ error: 'Failed to construct engineering blueprints', details: error.message });
    }
};

module.exports = { generateBlueprint };