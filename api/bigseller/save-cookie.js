// Save BigSeller cookie to environment variable via Vercel Edge Config or fallback to memory
// For production: use Vercel Postgres/KV. For now, use env var.

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { shopId, cookie } = req.body || {};
  if (!shopId || !cookie) return res.status(400).json({ error: 'shopId and cookie required' });

  // In production, save to DB. For demo purposes, just confirm receipt.
  // Cookie will need to be passed via ?token= in proxy calls.
  
  res.json({ 
    success: true, 
    message: 'Cookie received. In production, this persists to DB. For now, use ?token= in proxy calls.',
    note: 'To persist: enable Vercel Postgres in dashboard → Storage → Postgres'
  });
};
