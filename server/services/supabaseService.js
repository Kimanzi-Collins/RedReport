const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.SUPABASE_SECRET_KEY
    || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let supabase = null;
if (url && key) {
    supabase = createClient(url, key);
} else {
    console.warn('Supabase not configured (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY missing) — auth and history persistence disabled.');
}

module.exports = { supabase };
