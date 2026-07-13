// BigSeller proxy endpoint
// token diambil dari query param atau header Authorization

export default async (req, res) => {
  // Enable CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.query.token || (req.headers.authorization || '').replace('Bearer ', '');
  const path = req.query.path || '';
  const body = req.method === 'POST' ? req.body : undefined;

  if (!token) return res.status(400).json({ error: 'Missing BigSeller token (query: ?token=xxx)' });

  const base = 'https://www.bigseller.com';
  const target = path || '/web/shop/api/getShopInfo.htm?go=akulaku';

  try {
    const headers = {
      'Cookie': token.includes(';') ? token : `SESSION=${token}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://www.bigseller.com/web/shop/index.htm',
    };
    const resp = await fetch(`${base}${target}`, { method: req.method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await resp.text();
    res.status(resp.status).send(text);
  } catch (err) {
    console.error('BigSeller proxy error', err);
    res.status(502).json({ error: 'proxy_failed', detail: err.message });
  }
};
