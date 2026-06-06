// api/config-get.js — public read of config keys (force_loading, important_banner, last_bot_ping, force_*)
// No auth needed — reads are public. Supabase credentials stay server-side.
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { key } = req.query;
  if (!key) return res.status(400).json({ error: 'Missing key param' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  try {
    // Support exact match (?key=force_loading) and prefix match (?key=force_*)
    const isPrefix = key.endsWith('*');
    const endpoint = isPrefix
      ? `${SUPABASE_URL}/rest/v1/config?key=like.${encodeURIComponent(key)}`
      : `${SUPABASE_URL}/rest/v1/config?key=eq.${encodeURIComponent(key)}`;

    const r = await fetch(endpoint, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    if (!r.ok) throw new Error(await r.text());
    const rows = await r.json();
    res.status(200).json({ rows });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
