// Save BigSeller cookie — in production persist to DB

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { shopId, cookie } = req.body || {};
  if (!shopId || !cookie) return res.status(400).json({ error: 'shopId and cookie required' });

  res.json({ 
    success: true, 
    message: 'Cookie received. Set BIGSELLER_COOKIE env var in Vercel for persistence.'
  });
};
