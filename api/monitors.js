module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Each monitor has its own specific API key — avoids name-matching ambiguity
  const MONITOR_KEYS = [
    { name: 'Assistbot',    key: 'm803038901-de5f8200e02d0175f3623542' },
    { name: 'Assistmusic',  key: 'm803138290-466db08e8901a7e49b6ac3d5' },
    { name: 'AssistServer', key: 'm803183133-1f3331868c8b0d7b5937f984' },
    { name: 'Dashboard',    key: 'm803121772-30a8ddf61c429ebddfca1ac0' },
  ];

  try {
    const results = await Promise.all(
      MONITOR_KEYS.map(async ({ name, key }) => {
        try {
          const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              api_key: key,
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
          try { data = JSON.parse(text); } catch(e) {
            console.error(`[${name}] Non-JSON response:`, text.slice(0, 200));
            return null;
          }

          if (data.stat !== 'ok' || !data.monitors?.length) {
            console.error(`[${name}] Bad response:`, JSON.stringify(data).slice(0, 200));
            return null;
          }

          const mon = data.monitors[0];
          mon.friendly_name = name; // normalize to our display name
          return mon;
        } catch(e) {
          console.error(`[${name}] Fetch failed:`, e.message);
          return null;
        }
      })
    );

    const monitors = results.filter(Boolean);
    if (!monitors.length) {
      return res.status(502).json({ error: 'All monitor fetches failed' });
    }

    res.status(200).json({ stat: 'ok', monitors });
  } catch (err) {
    console.error('monitors handler threw:', err.message);
    res.status(500).json({ error: err.message });
  }
};
