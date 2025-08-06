const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supbaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supbaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

module.exports = supabase;