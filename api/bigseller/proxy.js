import { createPool } from '@vercel/postgres';

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.query.token;
  const shopId = req.query.shopId || 'default';
  const path = req.query.path || '/api/v1/product/listing/akulaku/active.json?orderBy=create_time&desc=true&searchType=productName&inquireType=0&akulakuStatus=1&bsStatus=4&pageNo=1&pageSize=50';
  const body = req.method === 'POST' ? req.body : undefined;

  let cookie = token;

  if (!cookie) {
    try {
      const db = createPool();
      await db.query(`CREATE TABLE IF NOT EXISTS bigseller_cookies (shop_id TEXT PRIMARY KEY, cookie TEXT NOT NULL, updated_at TIMESTAMP DEFAULT NOW())`);
      const { rows } = await db.query('SELECT cookie FROM bigseller_cookies WHERE shop_id=$1', [shopId]);
      if (rows.length) cookie = rows[0].cookie;
    } catch (e) {
      return res.status(500).json({ error: 'db_error', detail: e.message });
    }
  }

  if (!cookie) return res.status(400).json({ error: 'No cookie' });

  const base = 'https://www.bigseller.com';

  try {
    const headers = {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://www.bigseller.com/web/shop/index.htm',
    };
    const resp = await fetch(`${base}${path}`, { method: req.method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await resp.text();
    res.status(resp.status).send(text);
  } catch (err) {
    console.error('BigSeller proxy error', err);
    res.status(502).json({ error: 'proxy_failed', detail: err.message });
  }
};
