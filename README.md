# AkulakuDesk

## Prerequisites
- Vercel account
- Siapkan Akulaku Developer App (register, dapatkan client_id & client_secret)
- Postgres (Vercel Postgres add-on)

## Setup di Vercel
1. Connect repo ke Vercel
2. Set environment variables:
   - AKULAKU_CLIENT_ID
   - AKULAKU_CLIENT_SECRET
   - AKULAKU_REDIRECT_URI — `https://<project>.vercel.app/api/auth/akulaku/callback`
   - DATABASE_URL (Vercel Postgres add-on akan generate otomatis)
3. Deploy

## Setup di Akulaku Developer
Daftarkan redirect URI: `https://<project>.vercel.app/api/auth/akulaku/callback`

## SQL migration (jalankan di Vercel Postgres via dashboard)
```sql
CREATE TABLE IF NOT EXISTS tokens (
  shop TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT NOT NULL
);
```

## Local dev
```bash
npm i -g vercel
vercel dev
```
