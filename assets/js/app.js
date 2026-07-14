/* =================== LOGIN =================== */
function doLogin(){
  localStorage.setItem('loggedIn', 'true');
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').classList.add('show');
  showBridgeStatus();
  // Listen for bridge data
  startBridgeListener();
  // Auto-load data if extension already sending
  loadDashboard();
  // Poll connection status
  setInterval(checkBridgeConnection, 5000);
}

function showBridgeStatus() {
  const status = document.getElementById('bridgeConnStatus');
  if (status) {
    status.innerHTML = `
      <div class="bridge-pending">
        <div class="bridge-icon">🔌</div>
        <div class="bridge-text">
          <strong>Menunggu Extension...</strong>
          <span>Pastikan Chrome Extension AkulakuDesk Bridge sudah aktif & kamu sudah membuka Akulaku Seller Centre di tab lain.</span>
        </div>
      </div>
    `;
  }
}

let bridgeConnected = false;
let bridgeDataCount = 0;

function checkBridgeConnection() {
  const el = document.getElementById('syncTime');
  if (bridgeConnected) return;
  // Try fetching bridge status via local flag
  if (!bridgeConnected && document.getElementById('statProduk')?.textContent !== '—') {
    bridgeConnected = true;
    document.getElementById('bridgeConnStatus').innerHTML = `
      <div class="bridge-ok">
        <div class="bridge-icon">✅</div>
        <div class="bridge-text">
          <strong>Extension Aktif — Data Mengalir</strong>
          <span>Dashboard otomatis terupdate saat kamu browsing di Akulaku Seller Centre.</span>
        </div>
      </div>
    `;
  }
}

/* =================== NAVIGATION =================== */
const VIEW_META = {
  dashboard:{title:'Dashboard', crumb:'Ringkasan toko dari data Akulaku langsung'},
  chat:{title:'Chat (Live)', crumb:'Percakapan buyer — buka livechat.akulaku.com untuk data real'},
  produk:{title:'Produk', crumb:'Katalog produk real dari Seller Centre'},
  tren:{title:'Analisis Produk', crumb:'Distribusi harga dari katalog real'},
  order:{title:'Order & Settlement', crumb:'Status order & pencairan dari Seller Centre'},
  pengaturan:{title:'Pengaturan', crumb:'Konfigurasi Chrome Extension & koneksi'},
};

function navTo(view){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.querySelector(`.nav-item[data-view="${view}"]`).classList.add('active');
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+view).classList.add('active');
  document.getElementById('pageTitle').textContent = VIEW_META[view].title;
  document.getElementById('pageCrumb').textContent = VIEW_META[view].crumb;
}

document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click', ()=>navTo(item.dataset.view));
});

/* =================== TOAST =================== */
function showToast(text, type='default', title=null){
  const stack = document.getElementById('toastStack');
  const t = document.createElement('div');
  t.className='toast '+type;
  const icon = type==='success'
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
    : type==='info'
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  t.innerHTML = `<div class="ti">${icon}</div><div class="tb"><div class="tt">${title||'Notifikasi'}</div><div class="td">${text}</div></div>`;
  stack.appendChild(t);
  setTimeout(()=>{
    t.style.transition='.3s'; t.style.opacity='0'; t.style.transform='translateX(120%)';
    setTimeout(()=>t.remove(), 300);
  }, 4500);
}

/* =================== DASHBOARD =================== */
let AKULAKU_COOKIE = '';

async function loadDashboard(){
  // Hanya jalan kalo ada data dari bridge
  // Data diisi oleh handleBridgeData()
}

function renderTopProducts(items){
  if (!items || !items.length) return;
  const list = document.getElementById('dashTopProd');
  list.innerHTML = items.map((p,i) => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-soft)">
      <div style="width:22px;text-align:center;font-weight:800;color:${i===0?'#FF3D57':'var(--text-muted)'};font-size:13px">${i+1}</div>
      <img src="${p.indexImage || ''}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;background:#f0f0f0" onerror="this.style.display='none'">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.spuName || '—'}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Rp ${(p.minPrice||0).toLocaleString('id-ID')} · ${p.qty||0} terjual</div>
      </div>
    </div>
  `).join('');
}

function renderRealOrders(orders){
  if (!orders || !orders.length) return;
  let totalPending = 0, totalCair = 0, pendingCount = 0;
  orders.forEach(o => {
    const amount = o.orderItems?.[0]?.orderItemAmount || 0;
    if (o.orderStatus === 'cancel' || o.orderStatus === 'complete') {
      totalCair += amount;
    } else {
      totalPending += amount;
      pendingCount++;
    }
  });
  document.querySelector('#view-order .sum-card.pending .val').textContent = `Rp ${totalPending.toLocaleString('id-ID')}`;
  document.querySelector('#view-order .sum-card.pending .meta').textContent = `${pendingCount} order · dari Akulaku`; 
  document.querySelector('#view-order .sum-card.cair .val').textContent = `Rp ${totalCair.toLocaleString('id-ID')}`;

  const tbody = document.getElementById('orderTbody');
  tbody.innerHTML = orders.map(o => {
    const item = o.orderItems?.[0] || {};
    const statusMap = {0:'Diproses',1:'Dikirim',2:'Selesai',3:'Cancel'};
    const status = statusMap[item.deliveryStatus] || 'Diproses';
    const amount = item.orderItemAmount || 0;
    const buyerName = o.orderAddressInfo?.buyerName || o.userName || 'Pembeli';
    const date = o.createTime ? new Date(o.createTime * 1000).toLocaleDateString('id-ID') : '—';
    return `
      <tr>
        <td><span style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:12px;color:var(--primary)">${o.orderCode?.slice(-8) || o.orderId}</span></td>
        <td>${item.skuName || 'Produk'}</td>
        <td>${buyerName}</td>
        <td><span class="status-badge ${status==='Selesai'?'active':''}">${status}</span></td>
        <td><span class="variant-pill">BNPL</span></td>
        <td><span class="settle-badge">Rp ${amount.toLocaleString('id-ID')}</span></td>
        <td style="font-size:12px;color:var(--text-muted)">${date}</td>
      </tr>
    `;
  }).join('');
}

/* =================== PRODUK =================== */
async function renderProductTable(){
  // Hanya render kalo ada data — fired by handleBridgeData
  const tbody = document.getElementById('prodTbody');
  // Keep showing "Menunggu data" if no products
  if (!window.__akulakuProducts || !window.__akulakuProducts.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:60px 20px;color:var(--text-muted)"><div style="font-size:28px;margin-bottom:10px">🔌</div><div style="font-weight:600;font-size:15px;margin-bottom:4px">Menunggu data dari Extension</div><div style="font-size:12px">Buka Akulaku Seller Centre & klik menu Produk — data akan muncul otomatis</div></td></tr>';
    return;
  }
  // ... render dari window.__akulakuProducts
}

function syncProducts(){
  const now = new Date();
  const t = now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  document.getElementById('prodSync').textContent = t;
  showToast('Data produk dari Akulaku Seller Centre','success','Bridge');
}

/* =================== TREN =================== */
function renderBarChart(){
  // No data yet
}

function renderTrenTop(){
  // No data yet
}

function renderTags(){
  // No-op
}

/* =================== ORDER =================== */
async function renderOrders(){
  // Orders data from bridge only
  const tbody = document.getElementById('orderTbody');
  if (!window.__akulakuOrders) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:60px 20px;color:var(--text-muted)"><div style="font-size:28px;margin-bottom:10px">🔌</div><div style="font-weight:600;font-size:15px;margin-bottom:4px">Menunggu data dari Extension</div><div style="font-size:12px">Buka menu Order di Akulaku Seller Centre — data akan muncul otomatis</div></td></tr>';
  }
}

/* =================== CHAT =================== */
let activeConvId = 1;

function renderConvList(){
  const list = document.getElementById('convList');
  if (!window.__akulakuChats || !window.__akulakuChats.length) {
    list.innerHTML = '<div style="padding:40px 20px;text-align:center;color:var(--text-muted);font-size:12px">🔌 Buka Live Chat di Akulaku Seller Centre untuk melihat percakapan</div>';
    return;
  }
  list.innerHTML = window.__akulakuChats.map(c=>`
    <div class="conv ${c.id===activeConvId?'active':''}" onclick="openConv(${c.id})">
      <div class="conv-avatar" style="background:${c.color}">${c.initial}${c.online?'<div class="online"></div>':''}</div>
      <div class="conv-body">
        <div class="conv-top">
          <div class="conv-name">${c.name}</div>
          <div class="conv-time">${c.time}</div>
        </div>
        <div class="conv-msg">${c.last}</div>
        <div class="conv-foot">
          ${c.unread?`<div class="conv-badge">${c.unread}</div>`:'<div></div>'}
          <div class="conv-tag">${c.order}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function openConv(id){
  if (!window.__akulakuChats) return;
  activeConvId = id;
  const c = window.__akulakuChats.find(x=>x.id===id);
  if(!c) return;
  c.unread = 0;
  renderConvList();
  updateChatBadge();
  if(c.messages) renderMessages(c);
}

function renderMessages(conv){
  const box = document.getElementById('threadMessages');
  if (!conv || !conv.messages) {
    box.innerHTML = '<div style="padding:60px 20px;text-align:center;color:var(--text-muted);font-size:12px">💬 Buka Live Chat untuk lihat percakapan</div>';
    return;
  }
  box.innerHTML = `<div class="msg-day"><span>Hari ini</span></div>` + conv.messages.map(m=>{
    const isBuyer = m.from==='buyer';
    return `
      <div class="msg ${isBuyer?'buyer':'seller'}">
        ${isBuyer?`<div class="msg-avatar" style="background:${conv.color}">${conv.initial}</div>`:''}
        <div>
          <div class="msg-bubble">${m.text}</div>
          <div class="msg-time">${m.time}</div>
        </div>
      </div>
    `;
  }).join('');
  box.scrollTop = box.scrollHeight;
}

function markRead(){
  showToast('Balasan via app Akulaku Seller Centre','success','Chat');
}

function updateChatBadge(){
  const badge = document.getElementById('chatBadge');
  const unread = window.__akulakuUnread || 0;
  if(unread>0){
    badge.style.display='inline-block';
    badge.textContent = unread;
  } else {
    badge.style.display='none';
  }
}

function renderDashChat(){
  const list = document.getElementById('dashChatList');
  if (!window.__akulakuChats || !window.__akulakuChats.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px">🔌 Buka Live Chat di Akulaku</div>';
    return;
  }
  list.innerHTML = window.__akulakuChats.slice(0,4).map(c=>`
    <div style="display:flex;gap:11px;padding:10px 12px;border-radius:9px;cursor:pointer" onclick="navTo('chat')">
      <div class="conv-avatar" style="background:${c.color};width:36px;height:36px;font-size:12px">${c.initial}${c.online?'<div class="online"></div>':''}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:13px;font-weight:600">${c.name}</div>
          <div style="font-size:10px;color:var(--text-muted)">${c.time}</div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">${c.last}</div>
      </div>
      ${c.unread?`<div class="conv-badge" style="align-self:center">${c.unread}</div>`:''}
    </div>
  `).join('');
}

function renderDashTopProd(){
  // No-op — rendered by loadDashboard
}

/* =================== INIT =================== */
window.addEventListener('DOMContentLoaded',()=>{
  // Render empty states
  renderDashChat();
  renderConvList();
  updateChatBadge();
  renderProductTable();
  renderBarChart();
  renderTrenTop();
  renderTags();
  renderOrders();

  // Demo hint: klik di luar panel detail menutupnya
  document.getElementById('prodDetail').addEventListener('click',(e)=>{
    if(e.target.id==='prodDetail') closeDetail();
  });

  // Keyboard shortcut
  document.addEventListener('keydown',(e)=>{
    if((e.metaKey||e.ctrlKey) && e.key==='k'){
      e.preventDefault();
      document.querySelector('.search-global input').focus();
    }
    if(e.key==='Escape') closeDetail();
  });
});

/* =================== CHROME BRIDGE =================== */
function startBridgeListener() {
  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    if (e.data?.source !== 'akulaku-bridge' || e.data?.type !== 'BRIDGE_DATA') return;
    handleBridgeData(e.data.payload);
  });

  window.addEventListener('akulaku-bridge-data', (e) => {
    handleBridgeData(e.detail);
  });

  window.__onAkulakuBridgeData = (payload) => {
    handleBridgeData(payload);
  };

  window.__bridgeSendConfig = (patterns) => {
    window.postMessage({
      source: 'akulaku-dashboard',
      payload: { targetPatterns: patterns }
    }, '*');
  };

  console.log('[Dashboard] Bridge listener aktif');
}

function handleBridgeData(payload) {
  if (!payload || !payload.data) return;
  const data = payload.data;
  const endpoint = payload.endpoint || '';
  if (!data.success) return;

  bridgeConnected = true;
  bridgeDataCount++;

  // Update connection status
  document.getElementById('bridgeConnStatus').innerHTML = `
    <div class="bridge-ok">
      <div class="bridge-icon">✅</div>
      <div class="bridge-text">
        <strong>Connected — Live Data</strong>
        <span>${bridgeDataCount} data packet diterima sejak dashboard dibuka.</span>
      </div>
    </div>
  `;

  const syncEl = document.getElementById('syncTime');
  syncEl.textContent = `Live @ ${new Date(payload.timestamp).toLocaleTimeString('id-ID')}`;

  // Products
  if (endpoint.includes('goods/list') || endpoint.includes('goods/statistics')) {
    document.getElementById('statProduk').textContent = data.data?.currGoodsQuota || data.data?.enable || '—';
    if (data.data?.records) {
      window.__akulakuProducts = data.data.records;
      renderTopProducts(data.data.records.slice(0, 5));
    }
  }

  // Dashboard stats
  if (endpoint.includes('desk/statistics')) {
    const todo = data.data?.toDoList || {};
    document.getElementById('statChat').textContent = todo.refundingCount || '0';
    document.getElementById('statSales').textContent = todo.waitDeliverCount !== undefined ? `${todo.waitDeliverCount} pesanan` : '—';
    document.getElementById('statSettlement').textContent = todo.waitPayCount !== undefined ? `${todo.waitPayCount} pending` : '—';
  }

  // Orders
  if (endpoint.includes('queryOrders')) {
    if (data.data?.records) {
      window.__akulakuOrders = data.data.records;
      renderRealOrders(data.data.records);
    }
  }

  // Chat unread
  if (endpoint.includes('vendorTotalUnreadNumByAccount')) {
    window.__akulakuUnread = parseInt(data.data) || 0;
    updateChatBadge();
    document.getElementById('statChat').textContent = (data.data || '0').toString();
  }

  // Chat messages (dari livechat)
  if (endpoint.includes('chat') || endpoint.includes('message') || endpoint.includes('conversation')) {
    if (data.data && Array.isArray(data.data)) {
      window.__akulakuChats = data.data;
      renderConvList();
      renderDashChat();
    }
  }

  showToast(`📡 ${endpoint.split('/').pop()}`, 'success', 'Bridge');
}

/* =================== PENGATURAN =================== */
function saveAkulakuCookie(){
  showToast('Extension Bridge lebih praktis! Install Chrome Extension dari repo.','info','Cookie');
}
