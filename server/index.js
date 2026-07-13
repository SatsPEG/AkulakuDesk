require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const axios = require('axios');
const { Low, JSONFile } = require('lowdb');

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// serve static frontend
app.use('/', express.static(path.join(__dirname, '..')));

// setup DB (lowdb json file)
const adapter = new JSONFile(path.join(__dirname, 'data.json'));
const db = new Low(adapter);
// ensure file initialized
(async()=>{ await db.read(); db.data = db.data || { tokens: [] }; await db.write(); })();

// config
const AKU_AUTHORIZE = 'https://developer.akulaku.com/login';
const AKU_TOKEN = 'https://developer.akulaku.com/oauth/token';
const CLIENT_ID = process.env.AKULAKU_CLIENT_ID;
const CLIENT_SECRET = process.env.AKULAKU_CLIENT_SECRET;
const REDIRECT_URI = process.env.AKULAKU_REDIRECT_URI || 'http://localhost:8137/auth/akulaku/callback';

if(!CLIENT_ID) console.warn('AKULAKU_CLIENT_ID not set — OAuth redirect will include clientId placeholder.');

app.get('/auth/akulaku', (req,res)=>{
  const shop = req.query.shop || 'default';
  const state = Buffer.from(JSON.stringify({shop, ts:Date.now()})).toString('base64');
  const redirect = `${AKU_AUTHORIZE}?siteName=ec&clientId=${encodeURIComponent(CLIENT_ID||'')}&responseType=code&scope=all&redirectUri=${encodeURIComponent(REDIRECT_URI)}&state=${encodeURIComponent(state)}`;
  res.redirect(redirect);
});

app.get('/auth/akulaku/callback', async (req,res)=>{
  const { code, state } = req.query;
  let shop = 'default';
  try{ shop = JSON.parse(Buffer.from(state,'base64').toString()).shop }catch(e){}
  if(!code){ return res.status(400).send('Missing code'); }
  try{
    const tokenResp = await axios.post(AKU_TOKEN, new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
    }).toString(), {
      headers:{ 'Content-Type':'application/x-www-form-urlencoded' }
    });
    const t = tokenResp.data;
    const expires_at = Date.now() + (t.expires_in||3600)*1000;
    // upsert token into lowdb
    db.data.tokens = db.data.tokens || [];
    const exist = db.data.tokens.find(x=>x.shop===shop);
    if(exist){ exist.access_token = t.access_token; exist.refresh_token = t.refresh_token; exist.expires_at = expires_at; }
    else { db.data.tokens.push({shop, access_token: t.access_token, refresh_token: t.refresh_token, expires_at}); }
    await db.write();
    return res.send(`<h2>Connected Akulaku for shop ${shop}</h2><p>close this window and return to app.</p>`);
  }catch(err){
    console.error('token exchange failed', err.response?err.response.data:err.message);
    return res.status(500).send('Token exchange failed');
  }
});

// helper to get token for shop
function getToken(shop='default'){
  if(!db.data) return null;
  const row = (db.data.tokens||[]).find(r=>r.shop===shop);
  if(!row) return null;
  return row;
}

// simple proxy endpoint example: fetch products (requires actual Akulaku API endpoint, using placeholder)
app.get('/api/products', async (req,res)=>{
  const shop = req.query.shop || 'default';
  const t = getToken(shop);
  if(!t) return res.status(401).json({error:'not_connected'});
  try{
    // TODO: real Akulaku API url for products
    const resp = await axios.get('https://api.akulaku.com/seller/products', { headers:{ Authorization: 'Bearer '+t.access_token } });
    return res.json(resp.data);
  }catch(err){
    console.error('fetch products failed', err.response?err.response.data:err.message);
    return res.status(502).json({error:'upstream_failed'});
  }
});

// fallback: expose local mock data if API not available
app.get('/api/mock/products', (req,res)=>{
  const fs = require('fs');
  try{
    const raw = fs.readFileSync(path.join(__dirname,'..','assets/js/data.js'),'utf8');
    return res.type('application/javascript').send(raw);
  }catch(e){
    return res.status(500).json({error:'mock_not_found'});
  }
});

const PORT = process.env.PORT || 8137;
app.listen(PORT, ()=>console.log('Server running on', PORT));
