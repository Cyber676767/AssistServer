module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const MONITOR_KEYS = [
    { name: 'Assistbot',    key: 'm803038901-de5f8200e02d0175f3623542' },
    { name: 'Assistmusic',  key: 'm803138290-466db08e8901a7e49b6ac3d5' },
    { name: 'AssistServer', key: 'm803183133-1f3331868c8b0d7b5937f984' },
    { name: 'Dashboard',    key: 'm803121772-30a8ddf61c429ebddfca1ac0' },
  ];

  async function fetchMonitor(name, key) {
    const body = new URLSearchParams({
      api_key: key, format: 'json',
      all_time_uptime_ratio: '1', response_times: '1',
      response_times_limit: '24', logs: '1', logs_limit: '10'
    }).toString();

    const r = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const data = await r.json();
    if (data.stat !== 'ok' || !data.monitors?.length) return null;
    const mon = data.monitors[0];
    mon.friendly_name = name;
    return mon;
  }

  try {
    // First pass — fetch all in parallel
    let results = await Promise.all(
      MONITOR_KEYS.map(async ({ name, key }) => {
        try { return await fetchMonitor(name, key); }
        catch(e) { return null; }
      })
    );

    // Second pass — retry any that came back status:0 (paused/rate-limited)
    // 500ms delay before retry to let UptimeRobot recover
    const needsRetry = results.map((mon, i) => mon?.status === 0 || mon === null ? i : -1).filter(i => i >= 0);
    if (needsRetry.length > 0) {
      await new Promise(r => setTimeout(r, 500));
      await Promise.all(needsRetry.map(async i => {
        try {
          const retry = await fetchMonitor(MONITOR_KEYS[i].name, MONITOR_KEYS[i].key);
          if (retry && retry.status !== 0) results[i] = retry;
        } catch(e) {}
      }));
    }

    const monitors = results.filter(Boolean);
    if (!monitors.length) return res.status(502).json({ error: 'All monitor fetches failed' });
    res.status(200).json({ stat: 'ok', monitors });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};
