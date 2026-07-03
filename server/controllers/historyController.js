const { supabase } = require('../services/supabaseService');

const VALID_SECTIONS = ['analysis', 'mitigation', 'telemetry'];

async function findUserId(username) {
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();
    if (error) throw error;
    return data?.id || null;
}

async function findOrCreateUserId(username) {
    const existing = await findUserId(username);
    if (existing) return existing;

    const { data, error } = await supabase
        .from('users')
        .upsert({ username, last_seen_at: new Date().toISOString() }, { onConflict: 'username' })
        .select('id')
        .single();
    if (error) throw error;
    return data.id;
}

const getHistory = async (req, res) => {
    try {
        const { section } = req.params;
        const username = (req.query.username || '').trim();
        if (!VALID_SECTIONS.includes(section)) return res.status(400).json({ error: 'Invalid section.' });
        if (!username) return res.status(400).json({ error: 'Username is required.' });

        if (!supabase) return res.status(200).json({ messages: [] });

        const userId = await findUserId(username);
        if (!userId) return res.status(200).json({ messages: [] });

        const { data, error } = await supabase
            .from('chat_messages')
            .select('client_id, role, content, files, metadata, created_at')
            .eq('user_id', userId)
            .eq('section', section)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const messages = data.map((row) => ({
            id: row.client_id,
            role: row.role,
            content: row.content,
            files: row.files || undefined,
            metadata: row.metadata || undefined,
        }));

        res.status(200).json({ messages });
    } catch (error) {
        console.error('Fetch history failure:', error);
        res.status(500).json({ error: 'Failed to fetch history', details: error.message });
    }
};

const postHistory = async (req, res) => {
    try {
        const { username, section, role, content, files, metadata, clientId } = req.body || {};
        if (!username || !section || !role || !clientId) {
            return res.status(400).json({ error: 'username, section, role, and clientId are required.' });
        }
        if (!VALID_SECTIONS.includes(section)) return res.status(400).json({ error: 'Invalid section.' });

        if (!supabase) return res.status(200).json({ success: true, persisted: false });

        const userId = await findOrCreateUserId(username);

        const { error } = await supabase
            .from('chat_messages')
            .upsert({
                user_id: userId,
                section,
                role,
                content: content || '',
                files: files || null,
                metadata: metadata || null,
                client_id: clientId,
            }, { onConflict: 'user_id,client_id' });

        if (error) throw error;
        res.status(200).json({ success: true, persisted: true });
    } catch (error) {
        console.error('Persist history failure:', error);
        res.status(500).json({ error: 'Failed to persist message', details: error.message });
    }
};

const deleteHistory = async (req, res) => {
    try {
        const { section } = req.params;
        const username = (req.query.username || '').trim();
        if (!VALID_SECTIONS.includes(section)) return res.status(400).json({ error: 'Invalid section.' });
        if (!username) return res.status(400).json({ error: 'Username is required.' });
        if (!supabase) return res.status(200).json({ success: true });

        const userId = await findUserId(username);
        if (!userId) return res.status(200).json({ success: true });

        const { error } = await supabase
            .from('chat_messages')
            .delete()
            .eq('user_id', userId)
            .eq('section', section);

        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Delete history failure:', error);
        res.status(500).json({ error: 'Failed to delete history', details: error.message });
    }
};

const getReports = async (req, res) => {
    try {
        const username = (req.query.username || '').trim();
        if (!username) return res.status(400).json({ error: 'Username is required.' });
        if (!supabase) return res.status(200).json({ reports: [] });

        const userId = await findUserId(username);
        if (!userId) return res.status(200).json({ reports: [] });

        const { data, error } = await supabase
            .from('chat_messages')
            .select('client_id, content, created_at')
            .eq('user_id', userId)
            .eq('section', 'analysis')
            .eq('role', 'jarvis')
            .ilike('content', '%Your PDF is ready Sir.%')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const reports = data.map((row) => ({
            id: row.client_id,
            date: row.created_at,
            title: `Threat Intel: ${new Date(row.created_at).toLocaleTimeString()}`,
            content: row.content,
        }));

        res.status(200).json({ reports });
    } catch (error) {
        console.error('Fetch reports failure:', error);
        res.status(500).json({ error: 'Failed to fetch reports', details: error.message });
    }
};

module.exports = { getHistory, postHistory, deleteHistory, getReports };
