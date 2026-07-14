// Akulaku Seller Centre proxy — reads cookie from env var + custom headers
// Endpoints discovered from ec-vendor.akulaku.com internal API

const BASE = 'https://ec-vendor.akulaku.com';
const DEFAULT_COOKIE = process.env.AKULAKU_COOKIE || '';
const DEVICE_UUID = '39a1b39a6f340000a39101fc0fE7ae30ee53714b6ad7473ebbd15c7';

function buildHeaders(cookie) {
  return {
    'Cookie': cookie,
    'country-id': '1',
    'language-id': '123',
    'deviceuuid': DEVICE_UUID,
    'device-time-zone': '7',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Origin': BASE,
    'Referer': BASE + '/ec-vendor',
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
  };
}

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.query.token;
  const endpoint = req.query.endpoint || '/bapi/vendor-goods-biz/goods/list';
  const body = req.body || {};

  let cookie = token;
  if (!cookie) cookie = DEFAULT_COOKIE;
  // Allow overriding via custom cookie header (for frontend-set cookie)
  if (!cookie && req.headers['x-akulaku-cookie']) cookie = req.headers['x-akulaku-cookie'];
  if (!cookie) return res.status(400).json({ error: 'No cookie. Set AKULAKU_COOKIE env var or pass ?token=' });

  try {
    const headers = buildHeaders(cookie);

    const fetchOpts = {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    };

    const resp = await fetch(`${BASE}${endpoint}`, fetchOpts);
    const text = await resp.text();
    res.status(resp.status).send(text);
  } catch (err) {
    console.error('Akulaku proxy error', err);
    res.status(502).json({ error: 'proxy_failed', detail: err.message });
  }
};
