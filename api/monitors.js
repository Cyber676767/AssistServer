export default async function handler(req, res) {
  const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      api_key: 'u3190426-8c741aff25ed31c2d2c8c14c',
      format: 'json',
      all_time_uptime_ratio: '1',
      response_times: '1',
      response_times_limit: '1'
    })
  });
  const data = await response.json();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(data);
}
