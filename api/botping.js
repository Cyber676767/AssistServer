module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  try {
    const r = await fetch('https://assist-discord-bot--realc5454.replit.app/api/bot-ping');
    const data = await r.json();
    res.status(200).json(data);
  } catch(e) {
    res.status(200).json({ ping: null });
  }
};
