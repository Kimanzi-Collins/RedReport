const { supabase } = require('../services/supabaseService');

const createSession = async (req, res) => {
    try {
        const username = (req.body?.username || '').trim();
        if (!username) return res.status(400).json({ error: 'Username is required.' });

        if (!supabase) {
            return res.status(200).json({ id: null, username });
        }

        const { data, error } = await supabase
            .from('users')
            .upsert({ username, last_seen_at: new Date().toISOString() }, { onConflict: 'username' })
            .select('id, username')
            .single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error('Session creation failure:', error);
        res.status(500).json({ error: 'Failed to create session', details: error.message });
    }
};

module.exports = { createSession };
