import { createPool } from '@vercel/postgres';

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  
  const { shopId, cookie } = req.body || {};
  if (!shopId || !cookie) return res.status(400).json({ error: 'shopId and cookie required' });

  try {
    const db = createPool();
    // Create table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS bigseller_cookies (
        shop_id TEXT PRIMARY KEY,
        cookie TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.query(
      `INSERT INTO bigseller_cookies (shop_id, cookie, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (shop_id) DO UPDATE SET cookie=$2, updated_at=NOW()`,
      [String(shopId), cookie]
    );
    res.json({ success: true, message: 'Cookie saved' });
  } catch (err) {
    console.error('save-cookie error', err);
    res.status(500).json({ error: 'db_error', detail: err.message });
  }
};
