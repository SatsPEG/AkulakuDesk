import { createPool } from '@vercel/postgres';

export default async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('Missing code');

  let shop = 'default';
  try { shop = JSON.parse(Buffer.from(state, 'base64').toString()).shop; } catch (e) {}

  const CLIENT_ID = process.env.AKULAKU_CLIENT_ID;
  const CLIENT_SECRET = process.env.AKULAKU_CLIENT_SECRET;
  const REDIRECT_URI = process.env.AKULAKU_REDIRECT_URI;

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
    });

    const tokenResp = await fetch('https://developer.akulaku.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const t = await tokenResp.json();
    const expires_at = Date.now() + (t.expires_in || 3600) * 1000;

    const db = createPool();
    await db.query(
      `INSERT INTO tokens (shop, access_token, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (shop) DO UPDATE SET access_token=$2, refresh_token=$3, expires_at=$4`,
      [shop, t.access_token, t.refresh_token, expires_at]
    );

    res.send(`<h2>Connected Akulaku for shop ${shop}</h2><p>close this window and return to app.</p>`);
  } catch (err) {
    console.error('token exchange failed', err);
    res.status(500).send('Token exchange failed');
  }
};
