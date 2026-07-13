// BigSeller proxy — reads cookie from DB or query param
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

  // If no token param, try reading from env var (fallback for demo)
  if (!cookie) {
    cookie = process.env.BIGSELLER_COOKIE;
  }

  if (!cookie) return res.status(400).json({ error: 'No cookie. Provide ?token= or set BIGSELLER_COOKIE env var.' });

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
