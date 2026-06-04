module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ error: 'Missing password' });
  }

  // Password lives in Vercel environment variable — never in the HTML
  if (password === process.env.ADMIN_PASSWORD) {
    const token = Buffer.from(
      `assistbot-admin:${Date.now()}:${process.env.ADMIN_PASSWORD}`
    ).toString('base64');
    return res.status(200).json({ success: true, token });
  }

  // Wrong password — small delay to slow brute force attempts
  setTimeout(() => {
    if (!res.headersSent) {
      res.status(401).json({ error: 'Invalid password' });
    }
  }, 800);
};
