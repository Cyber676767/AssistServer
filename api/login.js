export default function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Missing password' });
  }

  // Password lives in Vercel environment variable — never in the HTML
  if (password === process.env.ADMIN_PASSWORD) {
    // Generate a simple session token (timestamp + secret combo)
    const token = Buffer.from(
      `assistbot-admin:${Date.now()}:${process.env.ADMIN_PASSWORD}`
    ).toString('base64');

    return res.status(200).json({ success: true, token });
  }

  // Wrong password — add a small delay to slow down brute force attempts
  setTimeout(() => {
    res.status(401).json({ error: 'Invalid password' });
  }, 800);
}