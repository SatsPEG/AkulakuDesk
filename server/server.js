// AkulakuDesk — real backend. Zero-dependency (node:http + node:sqlite + node:crypto).
// Run: node server/server.js   (from project root)
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { scryptSync, randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const PORT = process.env.PORT || 8137;
const JWT_SECRET = process.env.JWT_SECRET || 'akulakudesk-dev-secret-change-me';
const DB_PATH = join(__dirname, 'data.db');

/* ============ AUTH ============ */
function hashPassword(pw) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pw, salt, 64).toString('hex');
  return { salt, hash };
}
function verifyPassword(pw, salt, hash) {
  const h = scryptSync(pw, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hash, 'hex'));
}
function b64url(buf) { return Buffer.from(buf).toString('base64url'); }
function signJWT(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const pl = b64url(JSON.stringify({ ...payload, iat: Date.now() }));
  const sig = b64url(createHmac('sha256', JWT_SECRET).update(`${header}.${pl}`).digest());
  return `${header}.${pl}.${sig}`;
}
function verifyJWT(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const sig = b64url(createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest());
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(s))) return null;
  try {
    const pl = JSON.parse(Buffer.from(p, 'base64url').toString());
    if (pl.exp && pl.exp < Date.now()) return null;
    return pl;
  } catch { return null; }
}

/* ============ DB ============ */
const db = new DatabaseSync(DB_PATH);
db.exec(`PRAGMA journal_mode = WAL;`);
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  shop_name TEXT,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  variant TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  fee REAL NOT NULL DEFAULT 5,
  cost INTEGER NOT NULL DEFAULT 0,
  views TEXT NOT NULL DEFAULT '[]',
  sold INTEGER NOT NULL DEFAULT 0,
  desc TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  order_id TEXT NOT NULL,
  product TEXT,
  buyer TEXT,
  status TEXT,
  cicilan TEXT,
  settle TEXT,
  settle_text TEXT,
  date TEXT
);
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  order_no TEXT,
  color TEXT,
  initial TEXT,
  online INTEGER NOT NULL DEFAULT 0,
  unread INTEGER NOT NULL DEFAULT 0,
  last TEXT,
  time TEXT
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  from_who TEXT NOT NULL,
  text TEXT NOT NULL,
  time TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  keyword TEXT NOT NULL,
  category TEXT,
  result TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

const q = (sql, params = []) => db.prepare(sql).all(params);
const run = (sql, params = []) => db.prepare(sql).run(params);
const get = (sql, params = []) => db.prepare(sql).get(params);

/* ============ SEED (demo user) ============ */
function seedUser(email, password, name, shop) {
  if (get('SELECT id FROM users WHERE email = ?', [email])) return;
  const { salt, hash } = hashPassword(password);
  const res = run(
    'INSERT INTO users (email,name,shop_name,password_salt,password_hash) VALUES (?,?,?,?,?)',
    [email, name, shop, salt, hash]
  );
  const uid = res.lastInsertRowid;
  seedData(uid);
}

function seedData(uid) {
  const products = [
    { name: 'Tumbler Termal Vacuum 500ml', variant: 'Hitam · 500ml', price: 89000, stock: 142, status: 'active', fee: 5, cost: 55000, views: [120,180,150,220,280,310,290], sold: 312, desc: 'Tumbler termal double wall vacuum. Menjaga suhu dingin 24 jam, panas 12 jam. Stainless steel 304 food grade.' },
    { name: 'Headset Bluetooth Pro Bass TWS', variant: 'Putih · Pro', price: 245000, stock: 23, status: 'active', fee: 7, cost: 140000, views: [80,95,110,140,180,220,260], sold: 178, desc: 'Headset TWS driver 13mm, noise cancelling, baterai 36 jam. Bluetooth 5.3, IPX5.' },
    { name: 'Sepatu Sneakers Casual Pria', variant: '42 · Abu', price: 320000, stock: 8, status: 'active', fee: 6, cost: 180000, views: [60,75,90,85,100,130,160], sold: 94, desc: 'Sneakers casual upper canvas premium, sol karet anti-slip.' },
    { name: 'Power Bank 20000mAh Fast Charging', variant: '20K · Hitam', price: 179000, stock: 0, status: 'inactive', fee: 6, cost: 95000, views: [200,240,210,260,290,310,280], sold: 421, desc: 'Power bank 20000mAh PD 22.5W fast charging, LED display.' },
    { name: 'Jam Tangan Pria Sport Anti Air', variant: 'Hitam · 44mm', price: 215000, stock: 67, status: 'active', fee: 6, cost: 110000, views: [110,130,120,155,180,200,220], sold: 156, desc: 'Jam tangan sporty layar digital, chronograph, tahan air 50M.' },
    { name: 'Tas Selempang Wanita Canvas', variant: 'Krem · L', price: 135000, stock: 34, status: 'active', fee: 5, cost: 68000, views: [70,85,95,110,125,140,165], sold: 88, desc: 'Tas selempang canvas premium, tali adjustable, 3 kompartimen.' },
    { name: 'Keyboard Mechanical RGB 87 Keys', variant: 'Blue Switch', price: 425000, stock: 12, status: 'active', fee: 7, cost: 260000, views: [50,65,80,95,110,130,150], sold: 67, desc: 'Keyboard mechanical 87 keys, blue switch, RGB 19 mode.' },
    { name: 'Lampu Meja LED Touch Dimmable', variant: 'Putih', price: 95000, stock: 89, status: 'active', fee: 5, cost: 48000, views: [40,55,70,80,95,115,135], sold: 134, desc: 'Lampu meja LED touch, 3 mode warna, 5 level brightness.' },
  ];
  for (const p of products) {
    run('INSERT INTO products (user_id,name,variant,price,stock,status,fee,cost,views,sold,desc) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [uid, p.name, p.variant, p.price, p.stock, p.status, p.fee, p.cost, JSON.stringify(p.views), p.sold, p.desc]);
  }
  const orders = [
    ['AKL-2410-88213','Tumbler Termal 500ml','Dewi Wulandari','Diproses','3x','pending','Belum Cair','24 Okt 2024'],
    ['AKL-2410-88109','Headset Bluetooth TWS','Budi Santoso','Dikirim','6x','partial','Cair 50% · Nov','22 Okt 2024'],
    ['AKL-2410-87954','Sepatu Sneakers 42','Siti Rahmawati','Selesai','3x','cair','Cair · 22 Okt','15 Okt 2024'],
    ['AKL-2410-87890','Power Bank 20000mAh','Andi Pratama','Diproses','12x','pending','Belum Cair','24 Okt 2024'],
    ['AKL-2410-87765','Jam Tangan Sport 44mm','Maya Sari','Dikirim','6x','partial','Cair 50% · Nov','20 Okt 2024'],
    ['AKL-2410-87654','Tas Selempang Canvas','Rizki Firmansyah','Selesai','3x','cair','Cair · 18 Okt','12 Okt 2024'],
    ['AKL-2410-87543','Keyboard Mechanical RGB','Joko Widodo','Dikirim','6x','partial','Cair 50% · Nov','19 Okt 2024'],
    ['AKL-2410-87432','Lampu Meja LED Touch','Citra Lestari','Selesai','3x','cair','Cair · 14 Okt','10 Okt 2024'],
    ['AKL-2410-87321','Tumbler Termal 500ml','Hendra Wijaya','Diproses','3x','pending','Belum Cair','24 Okt 2024'],
    ['AKL-2410-87210','Headset Bluetooth TWS','Lina Marlina','Dikirim','12x','pending','Belum Cair','23 Okt 2024'],
  ];
  for (const o of orders) {
    run('INSERT INTO orders (user_id,order_id,product,buyer,status,cicilan,settle,settle_text,date) VALUES (?,?,?,?,?,?,?,?,?)',
      [uid, ...o]);
  }
  const convs = [
    { name: 'Dewi Wulandari', city: 'Bandung', order_no: 'AKL-2410-88213', color: '#FF6B7E', initial: 'DW', online: 1, unread: 2, last: 'Kak, tumbler yang hitam masih ready?', time: '14:32', msgs: [['buyer','Halo kak, saya mau tanya tumbler termal 500ml','14:28'],['seller','Halo kak Dewi, ada yang bisa dibantu? 😊','14:29'],['buyer','Yang warna hitam masih ready stoknya?','14:32']] },
    { name: 'Budi Santoso', city: 'Jakarta', order_no: 'AKL-2410-88109', color: '#5B8DEF', initial: 'BS', online: 0, unread: 1, last: 'Orderan saya kok belum dikirim ya?', time: '14:15', msgs: [['buyer','Selamat siang','14:10'],['buyer','Orderan saya kok belum dikirim ya?','14:15']] },
    { name: 'Siti Rahmawati', city: 'Surabaya', order_no: 'AKL-2410-87954', color: '#A78BFA', initial: 'SR', online: 1, unread: 0, last: 'Sudah kak, terima kasih 🙏', time: '13:48', msgs: [['buyer','Kak, headset TWS nya ada garansi?','13:40'],['seller','Ada kak, garansi 1 tahun resmi','13:42'],['buyer','Sudah kak, terima kasih 🙏','13:48']] },
    { name: 'Andi Pratama', city: 'Medan', order_no: 'AKL-2410-87890', color: '#10B981', initial: 'AP', online: 0, unread: 0, last: 'Oke ditunggu ya kak', time: '12:30', msgs: [['buyer','Kak powerbank 20000mAh restock belum?','12:20'],['seller','Dalam proses restock kak, estimasi 3 hari lagi','12:25'],['buyer','Oke ditunggu ya kak','12:30']] },
    { name: 'Maya Sari', city: 'Yogyakarta', order_no: 'AKL-2410-87765', color: '#F59E0B', initial: 'MS', online: 1, unread: 0, last: 'Bisa COD area Jogja?', time: '11:45', msgs: [['buyer','Bisa COD area Jogja?','11:45']] },
    { name: 'Rizki Firmansyah', city: 'Semarang', order_no: 'AKL-2410-87654', color: '#EC4899', initial: 'RF', online: 0, unread: 0, last: 'Terima kasih infonya kak', time: '10:22', msgs: [['buyer','Sepatu size 42 restock kapan?','10:15'],['seller','Sudah ready kak, silakan dipesan','10:20'],['buyer','Terima kasih infonya kak','10:22']] },
  ];
  for (const c of convs) {
    const r = run('INSERT INTO conversations (user_id,name,city,order_no,color,initial,online,unread,last,time) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [uid, c.name, c.city, c.order_no, c.color, c.initial, c.online, c.unread, c.last, c.time]);
    const cid = r.lastInsertRowid;
    for (const m of c.msgs) run('INSERT INTO messages (conversation_id,from_who,text,time) VALUES (?,?,?,?)', [cid, ...m]);
  }
}
seedUser('seller@tokoandaya.com', 'mockpassword', 'Rani Amelia', 'Toko Andaya');

/* ============ HELPERS ============ */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function analyzeKeyword(kw, category) {
  let h = 0; for (let i = 0; i < kw.length; i++) h = (h * 31 + kw.charCodeAt(i)) >>> 0;
  const rnd = mulberry32(h || 1);
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const bars = days.map(() => Math.floor(1800 + rnd() * 6200));
  const total = bars.reduce((a, b) => a + b, 0);
  const volume = (total / 1000).toFixed(1) + 'K';
  const names = [
    `${kw} Vacuum 500ml`, `${kw} Estetik 350ml`, `${kw} Anak Karakter 400ml`,
    `${kw} Lipat Mini 250ml`, `${kw} Charger Genggam`,
  ];
  const top = names.map((n) => {
    const price = Math.floor(45000 + rnd() * 120000);
    const sold = Math.floor(80 + rnd() * 320);
    const up = rnd() > 0.3;
    const pct = '+' + Math.floor(5 + rnd() * 45) + '%';
    const down = '-' + Math.floor(3 + rnd() * 12) + '%';
    return { name: n, price, sold, trend: up ? 'up' : 'down', pct: up ? pct : down, hot: rnd() > 0.6, img: `assets/img/tumbler.svg` };
  }).sort((a, b) => b.sold - a.sold);
  const base = ['estetik', 'botol minum termal', 'anak', 'termos vacuum', 'custom', 'murah', 'flask'];
  const related = base.map((b) => ({ tag: `${kw} ${b}`.trim(), vol: (1 + rnd() * 12).toFixed(1) + 'K' }));
  return { keyword: kw, category: category || 'Semua Kategori', bars: bars.map((v, i) => ({ label: days[i], value: v })), total: volume, top, related };
}

const IMG_CYCLE = ['tumbler','headset','sepatu','powerbank','jam','tas','keyboard','lampu'];
function productImg(i) { return `assets/img/${IMG_CYCLE[i % IMG_CYCLE.length]}.svg`; }

function rowToProduct(r) {
  return { id: r.id, name: r.name, variant: r.variant, price: r.price, stock: r.stock, status: r.status,
    fee: r.fee, cost: r.cost, views: JSON.parse(r.views || '[]'), sold: r.sold, desc: r.desc,
    img: productImg(r.id - 1), margin: r.price - r.cost - Math.round(r.price * r.fee / 100) };
}
function convWithMessages(c) {
  const msgs = q('SELECT from_who as from, text, time FROM messages WHERE conversation_id = ? ORDER BY id', [c.id]);
  return { id: c.id, name: c.name, city: c.city, order: c.order_no, color: c.color, initial: c.initial,
    online: !!c.online, unread: c.unread, last: c.last, time: c.time, messages: msgs };
}

/* ============ REQUEST HANDLING ============ */
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.json':'application/json', '.ico':'image/x-icon' };

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
  });
}
function getToken(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}
function authUserId(req) {
  const pl = verifyJWT(getToken(req));
  return pl ? pl.uid : null;
}

async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['api', ...]
  const seg = parts.slice(1); // after /api

  /* ---- AUTH (public) ---- */
  if (seg[0] === 'auth') {
    if (seg[1] === 'register' && req.method === 'POST') {
      const b = await readBody(req);
      if (!b.email || !b.password) return sendJSON(res, 400, { error: 'Email & password wajib' });
      if (get('SELECT id FROM users WHERE email = ?', [b.email])) return sendJSON(res, 409, { error: 'Email sudah terdaftar' });
      const { salt, hash } = hashPassword(b.password);
      const r = run('INSERT INTO users (email,name,shop_name,password_salt,password_hash) VALUES (?,?,?,?,?)',
        [b.email, b.name || b.email.split('@')[0], b.shop_name || '', salt, hash]);
      const uid = r.lastInsertRowid;
      seedData(uid);
      const token = signJWT({ uid, email: b.email, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
      return sendJSON(res, 201, { token, user: { id: uid, email: b.email, name: b.name, shop_name: b.shop_name } });
    }
    if (seg[1] === 'login' && req.method === 'POST') {
      const b = await readBody(req);
      const u = get('SELECT * FROM users WHERE email = ?', [b.email]);
      if (!u || !verifyPassword(b.password || '', u.password_salt, u.password_hash))
        return sendJSON(res, 401, { error: 'Email atau password salah' });
      const token = signJWT({ uid: u.id, email: u.email, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
      return sendJSON(res, 200, { token, user: { id: u.id, email: u.email, name: u.name, shop_name: u.shop_name } });
    }
    if (seg[1] === 'me' && req.method === 'GET') {
      const uid = authUserId(req);
      if (!uid) return sendJSON(res, 401, { error: 'Unauthorized' });
      const u = get('SELECT id,email,name,shop_name FROM users WHERE id = ?', [uid]);
      return sendJSON(res, 200, { user: u });
    }
  }

  /* ---- AUTH REQUIRED BELOW ---- */
  const uid = authUserId(req);
  if (!uid) return sendJSON(res, 401, { error: 'Unauthorized' });

  /* ---- PRODUCTS ---- */
  if (seg[0] === 'products') {
    if (req.method === 'GET') {
      const rows = q('SELECT * FROM products WHERE user_id = ? ORDER BY sold DESC', [uid]);
      return sendJSON(res, 200, rows.map(rowToProduct));
    }
    if (req.method === 'POST') {
      const b = await readBody(req);
      if (!b.name) return sendJSON(res, 400, { error: 'Nama produk wajib' });
      const r = run('INSERT INTO products (user_id,name,variant,price,stock,status,fee,cost,views,sold,desc) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [uid, b.name, b.variant || '', b.price || 0, b.stock || 0, b.status || 'active', b.fee || 5, b.cost || 0, JSON.stringify(b.views || []), b.sold || 0, b.desc || '']);
      const row = get('SELECT * FROM products WHERE id = ?', [r.lastInsertRowid]);
      return sendJSON(res, 201, rowToProduct(row));
    }
    if (req.method === 'PUT' && seg[1]) {
      const b = await readBody(req);
      const cur = get('SELECT * FROM products WHERE id = ? AND user_id = ?', [seg[1], uid]);
      if (!cur) return sendJSON(res, 404, { error: 'Produk tidak ditemukan' });
      const name = b.name ?? cur.name, variant = b.variant ?? cur.variant, price = b.price ?? cur.price,
        stock = b.stock ?? cur.stock, status = b.status ?? cur.status, fee = b.fee ?? cur.fee,
        cost = b.cost ?? cur.cost, sold = b.sold ?? cur.sold, desc = b.desc ?? cur.desc,
        views = b.views ? JSON.stringify(b.views) : cur.views;
      run('UPDATE products SET name=?,variant=?,price=?,stock=?,status=?,fee=?,cost=?,views=?,sold=?,desc=? WHERE id=? AND user_id=?',
        [name, variant, price, stock, status, fee, cost, views, sold, desc, seg[1], uid]);
      return sendJSON(res, 200, rowToProduct(get('SELECT * FROM products WHERE id = ?', [seg[1]])));
    }
    if (req.method === 'DELETE' && seg[1]) {
      const r = run('DELETE FROM products WHERE id = ? AND user_id = ?', [seg[1], uid]);
      return sendJSON(res, 200, { deleted: r.changes });
    }
  }

  /* ---- ORDERS ---- */
  if (seg[0] === 'orders') {
    if (req.method === 'GET') {
      const rows = q('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [uid]);
      return sendJSON(res, 200, rows);
    }
    if (req.method === 'POST') {
      const b = await readBody(req);
      const r = run('INSERT INTO orders (user_id,order_id,product,buyer,status,cicilan,settle,settle_text,date) VALUES (?,?,?,?,?,?,?,?,?)',
        [uid, b.order_id || ('AKL-' + Date.now()), b.product || '', b.buyer || '', b.status || 'Diproses', b.cicilan || '-', b.settle || 'pending', b.settle_text || 'Belum Cair', b.date || new Date().toLocaleDateString('id-ID')]);
      return sendJSON(res, 201, get('SELECT * FROM orders WHERE id = ?', [r.lastInsertRowid]));
    }
  }

  /* ---- CONVERSATIONS ---- */
  if (seg[0] === 'conversations') {
    if (req.method === 'GET' && !seg[1]) {
      const rows = q('SELECT * FROM conversations WHERE user_id = ? ORDER BY id', [uid]);
      return sendJSON(res, 200, rows.map(convWithMessages));
    }
    if (seg[1] && seg[2] === 'messages' && req.method === 'POST') {
      const b = await readBody(req);
      if (!b.text) return sendJSON(res, 400, { error: 'Pesan kosong' });
      const cur = get('SELECT * FROM conversations WHERE id = ? AND user_id = ?', [seg[1], uid]);
      if (!cur) return sendJSON(res, 404, { error: 'Percakapan tidak ditemukan' });
      const now = new Date();
      const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      run('INSERT INTO messages (conversation_id,from_who,text,time) VALUES (?,?,?,?)', [seg[1], b.from || 'buyer', b.text, time]);
      run('UPDATE conversations SET last=?, time=?, unread=? WHERE id=?',
        [b.text, time, b.from === 'buyer' ? cur.unread + 1 : cur.unread, seg[1]]);
      return sendJSON(res, 201, { ok: true });
    }
    if (seg[1] && req.method === 'PATCH') {
      const b = await readBody(req);
      const cur = get('SELECT * FROM conversations WHERE id = ? AND user_id = ?', [seg[1], uid]);
      if (!cur) return sendJSON(res, 404, { error: 'Percakapan tidak ditemukan' });
      const unread = b.unread ?? 0;
      run('UPDATE conversations SET unread=? WHERE id=?', [unread, seg[1]]);
      return sendJSON(res, 200, { ok: true });
    }
  }

  /* ---- KEYWORDS / TREN ---- */
  if (seg[0] === 'keywords') {
    if (req.method === 'GET') {
      const rows = q('SELECT * FROM keywords WHERE user_id = ? ORDER BY id DESC', [uid]);
      return sendJSON(res, 200, rows.map((r) => ({ id: r.id, keyword: r.keyword, category: r.category, result: JSON.parse(r.result), created_at: r.created_at })));
    }
    if (seg[1] === 'analyze' && req.method === 'POST') {
      const b = await readBody(req);
      const kw = (b.keyword || '').trim();
      if (!kw) return sendJSON(res, 400, { error: 'Kata kunci wajib' });
      const result = analyzeKeyword(kw, b.category);
      const r = run('INSERT INTO keywords (user_id,keyword,category,result) VALUES (?,?,?,?)',
        [uid, kw, b.category || 'Semua Kategori', JSON.stringify(result)]);
      return sendJSON(res, 201, { id: r.lastInsertRowid, ...result });
    }
    if (seg[1] && req.method === 'DELETE') {
      const r = run('DELETE FROM keywords WHERE id = ? AND user_id = ?', [seg[1], uid]);
      return sendJSON(res, 200, { deleted: r.changes });
    }
  }

  /* ---- STATUS / KEEP-ONLINE ---- */
  if (seg[0] === 'status' && req.method === 'GET') {
    return sendJSON(res, 200, {
      session: 'ONLINE', uptime: '99.8%', lastLogin: 'Hari ini, 08:14',
      reconnects: 2, autoReply: 'Aktif', monitorMode: 'Aktif',
    });
  }

  return sendJSON(res, 404, { error: 'Not found' });
}

/* ============ STATIC + ROUTER ============ */
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) {
      const out = await handleApi(req, res, url);
      if (out !== undefined) sendJSON(res, 200, out);
      return;
    }
    // static
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';
    const filePath = normalize(join(PUBLIC_DIR, pathname));
    if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
    try {
      const data = await readFile(filePath);
      const ext = extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    } catch {
      // SPA fallback
      const data = await readFile(join(PUBLIC_DIR, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  } catch (e) {
    console.error(e);
    if (!res.headersSent) sendJSON(res, 500, { error: 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`AkulakuDesk running at http://localhost:${PORT}`);
});
