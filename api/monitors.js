module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        api_key: 'u3190426-8c741aff25ed31c2d2c8c14c',
        format: 'json',
        all_time_uptime_ratio: '1',
        response_times: '1',
        response_times_limit: '24',
        logs: '1',
        logs_limit: '10'
      }).toString()
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('UptimeRobot non-JSON response:', text.slice(0, 300));
      return res.status(502).json({ error: 'UptimeRobot returned non-JSON', raw: text.slice(0, 300) });
    }

    if (data.stat !== 'ok') {
      console.error('UptimeRobot stat fail:', JSON.stringify(data));
      return res.status(502).json({ error: 'UptimeRobot error', detail: data });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('monitors handler threw:', err.message);
    res.status(500).json({ error: err.message });
  }
};
