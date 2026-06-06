// api/config-set.js — admin-only write to config table (force_loading, important_banner, force_*, last_bot_ping)
// Requires valid admin token in Authorization header.
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  // ── AUTH ──
  // Accept either a valid admin token (base64 encoded) or the raw password
  // Token format: base64("assistbot-admin:<timestamp>:<password>")
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  let authorized = false;
  if (token) {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const parts = decoded.split(':');
      // parts[0] = 'assistbot-admin', parts[1] = timestamp, parts[2] = password
      if (parts[0] === 'assistbot-admin' && parts[2] === ADMIN_PASSWORD) {
        authorized = true;
      }
    } catch(e) {}
  }

  // Also allow raw password in body for the ?unlock= flow
  if (!authorized && req.body?.password === ADMIN_PASSWORD) {
    authorized = true;
  }

  if (!authorized) {
    return setTimeout(() => {
      if (!res.headersSent) res.status(401).json({ error: 'Unauthorized' });
    }, 800);
  }

  const { key, value } = req.body || {};

  if (req.method === 'DELETE') {
    // Delete a key
    const delKey = req.query.key || key;
    if (!delKey) return res.status(400).json({ error: 'Missing key' });
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/config?key=eq.${encodeURIComponent(delKey)}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      });
      if (!r.ok) throw new Error(await r.text());
      return res.status(200).json({ ok: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST') {
    if (!key) return res.status(400).json({ error: 'Missing key' });
    try {
      // Upsert: delete then insert
      await fetch(`${SUPABASE_URL}/rest/v1/config?key=eq.${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      });
      const r = await fetch(`${SUPABASE_URL}/rest/v1/config`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ key, value: String(value) })
      });
      if (!r.ok) throw new Error(await r.text());
      return res.status(200).json({ ok: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};
