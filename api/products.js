import { createPool } from '@vercel/postgres';

export default async (req, res) => {
  const shop = req.query.shop || 'default';
  const db = createPool();

  const { rows } = await db.query('SELECT access_token, expires_at FROM tokens WHERE shop=$1', [shop]);
  if (!rows.length) return res.status(401).json({ error: 'not_connected' });

  const t = rows[0];
  if (Date.now() > t.expires_at) {
    // TODO: refresh token flow
    return res.status(401).json({ error: 'token_expired' });
  }

  try {
    // Replace with actual Akulaku API endpoint when available
    const apiUrl = process.env.AKULAKU_API_BASE || 'https://api.akulaku.com/seller/products';
    const resp = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${t.access_token}` },
    });
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('fetch products failed', err);
    res.status(502).json({ error: 'upstream_failed' });
  }
};
