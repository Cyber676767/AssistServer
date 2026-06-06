// api/updates-set.js — admin-only insert/delete on updates table
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  // ── AUTH ── same token validation as config-set.js
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  let authorized = false;
  if (token) {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const parts = decoded.split(':');
      if (parts[0] === 'assistbot-admin' && parts[2] === ADMIN_PASSWORD) {
        authorized = true;
      }
    } catch(e) {}
  }

  if (!authorized) {
    return setTimeout(() => {
      if (!res.headersSent) res.status(401).json({ error: 'Unauthorized' });
    }, 800);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/updates?id=eq.${encodeURIComponent(id)}`, {
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
    const { id, title, type, body, service, date, parent_id } = req.body || {};
    if (!body) return res.status(400).json({ error: 'Missing body' });
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/updates`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ id, title, type, body, service, date, parent_id: parent_id || null })
      });
      if (!r.ok) throw new Error(await r.text());
      return res.status(200).json({ ok: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};
