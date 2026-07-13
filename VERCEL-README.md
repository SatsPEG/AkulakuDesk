# AkulakuDesk — Vercel deployment notes

This project is an Akulaku seller dashboard prototype. We're converting it to a full Vercel deployment with OAuth integration to Akulaku.

Environment variables (set these in Vercel Dashboard):
- AKULAKU_CLIENT_ID
- AKULAKU_CLIENT_SECRET
- AKULAKU_REDIRECT_URI (e.g. https://<your-vercel-project>.vercel.app/api/auth/akulaku/callback)

Deployment notes:
- Frontend is static served from root.
- Serverless API endpoints live under /api/* (Vercel Functions).
- Persistent storage: Vercel Postgres recommended for tokens. Configure via Vercel add-on and set DATABASE_URL.

Local development:
- Install Vercel CLI: npm i -g vercel
- Run locally with: npm run dev

Next steps for me:
- Implement Serverless functions for /api/auth/akulaku and /api/auth/akulaku/callback (code flow)
- Replace lowdb (dev) storage with Vercel Postgres access layer (migration SQL + helper)
- Add verification & README for Vercel secrets
