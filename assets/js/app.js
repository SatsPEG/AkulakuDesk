/* =================== LOGIN =================== */
function doLogin(){
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').classList.add('show');
  showToast('Berhasil masuk sebagai Demo', 'success');
  startSimulations();
}

/* =================== NAVIGATION =================== */
const VIEW_META = {
  dashboard:{title:'Dashboard', crumb:'Ringkasan aktivitas toko kamu hari ini'},
  chat:{title:'Chat (Live)', crumb:'Pantau percakapan buyer — tanpa mengirim balasan'},
  produk:{title:'Produk', crumb:'Kelola katalog & performa produk'},
  tren:{title:'Tren Kata Kunci', crumb:'Analisis pencarian & momentum pasar'},
  order:{title:'Order & Settlement', crumb:'Status order dan pencairan BNPL'},
  pengaturan:{title:'Pengaturan', crumb:'Konfigurasi aplikasi & integrasi'},
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
async function loadDashboard(){
  try {
    // Fetch product listing from BigSeller (via env cookie)
    const [prodResp, countResp, shopResp] = await Promise.all([
      fetch('/api/bigseller/proxy'),
      fetch('/api/bigseller/proxy?path=/api/v1/product/listing/akulaku/count.json?orderBy=create_time&desc=true&searchType=productName&inquireType=0&akulakuStatus=1&bsStatus=4&pageNo=1&pageSize=50'),
      fetch('/api/bigseller/proxy?path=/api/v1/shop/authShop/list.json?platform=akulaku'),
    ]);
    const prod = await prodResp.json();
    const cnt = await countResp.json();
    const shop = await shopResp.json();

    // Stat cards
    const counts = cnt?.data || {};
    document.getElementById('statChat').textContent = '—';
    document.getElementById('statProduk').textContent = (counts.onsale || '—').toString();
    document.getElementById('statSales').textContent = (counts.allOnlineNum || '—').toString();
    document.getElementById('statSettlement').textContent = counts.soldout !== undefined ? `Habis: ${counts.soldout}` : '—';

    // Top products (ambil dari listing, sort by price desc as proxy for "terlaris")
    const items = prod?.data?.page?.rows || [];
    const top = items.slice(0, 5);
    const list = document.getElementById('dashTopProd');
    list.innerHTML = top.map((p,i) => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-soft)">
        <div style="width:22px;text-align:center;font-weight:800;color:${i===0?'#FF3D57':'var(--text-muted)'};font-size:13px">${i+1}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name || '—'}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Rp ${(p.price||0).toLocaleString('id-ID')} · ${p.stock||0} stok</div>
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:12px;color:var(--success)">${p.sold||0}</div>
      </div>
    `).join('') || '<div style="padding:20px;text-align:center;color:var(--text-muted)">Belum ada produk</div>';

    // Sales chart with real product prices
    renderSalesChart(items.slice(0,14));

  } catch(e){
    console.error('Dashboard load error', e);
    // fallback: keep mock values visible
  }
}

function renderSalesChart(items){
  const svg = document.getElementById('salesChart');
  const W=700, H=240, P=30;
  const count = Math.min(items.length || 14, 14);
  const vals = items.length ? items.map(p => Math.max((p.price||0)/10000, 1)) : [2.1,2.4,1.8,3.2,2.8,3.5,4.1,3.8,4.5,3.9,4.2,5.1,4.8,4.8];
  const maxVal = Math.max(...vals, 6);
  let path='', area='';
  vals.slice(0,14).forEach((v,i)=>{
    const x = P + (i*(W-P*2))/(13);
    const y = H-P - (v/maxVal)*(H-P*2);
    path += (i===0?'M':'L')+x+','+y+' ';
    if(i===0) area = 'M'+x+','+(H-P);
    area += ' L'+x+','+y;
    if(i===vals.length-1 || i===13) area += ' L'+x+','+(H-P)+' Z';
  });
  let grid='';
  for(let i=0;i<=4;i++){
    const y = P + i*(H-P*2)/4;
    grid += `<line x1="${P}" y1="${y}" x2="${W-P}" y2="${y}" stroke="#F0F1F4" stroke-width="1"/>`;
    grid += `<text x="${P-8}" y="${y+4}" text-anchor="end" font-size="10" fill="#8B92A5">${(maxVal - i*(maxVal/4)).toFixed(1)}</text>`;
  }
  let xLabels='';
  for(let i=0;i<14;i+=2){
    const x = P + (i*(W-P*2))/13;
    xLabels += `<text x="${x}" y="${H-P+18}" text-anchor="middle" font-size="10" fill="#8B92A5">${14-i}h</text>`;
  }
  svg.innerHTML = `
    ${grid}
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FF3D57" stop-opacity="0.25"/><stop offset="100%" stop-color="#FF3D57" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#g)"/>
    <path d="${path}" fill="none" stroke="#FF3D57" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${xLabels}
  `;
}

function renderDashChat(){
  // Chat dari BigSeller belum tersedia — fallback mock
  const list = document.getElementById('dashChatList');
  list.innerHTML = CONVERSATIONS.slice(0,4).map(c=>`
    <div style="display:flex;gap:11px;padding:10px 12px;border-radius:9px;cursor:pointer;transition:.15s" onmouseover="this.style.background='#F9FAFB'" onmouseout="this.style.background='transparent'" onclick="navTo('chat')">
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
  // Replaced by loadDashboard() — no-op
}

/* =================== CHAT =================== */
let activeConvId = 1;
function renderConvList(){
  const list = document.getElementById('convList');
  list.innerHTML = CONVERSATIONS.map(c=>`
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
  activeConvId = id;
  const c = CONVERSATIONS.find(x=>x.id===id);
  if(!c) return;
  c.unread = 0;
  document.getElementById('threadAvatar').textContent = c.initial;
  document.getElementById('threadAvatar').style.background = c.color;
  document.getElementById('threadName').innerHTML = c.name + ' <span style="font-size:11px;font-weight:500;color:var(--text-muted)">· Buyer</span>';
  document.querySelector('.thread-buyer .meta').innerHTML = `
    <span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${c.city}</span>
    <span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7"/></svg> Order: ${c.order}</span>
    <span style="color:${c.online?'var(--success)':'var(--text-muted)'};font-weight:600">● ${c.online?'Online':'Offline'}</span>
  `;
  renderConvList();
  renderMessages();
  updateChatBadge();
}

function renderMessages(){
  const c = CONVERSATIONS.find(x=>x.id===activeConvId);
  if(!c) return;
  const box = document.getElementById('threadMessages');
  box.innerHTML = `<div class="msg-day"><span>Hari ini</span></div>` + c.messages.map(m=>{
    const isBuyer = m.from==='buyer';
    return `
      <div class="msg ${isBuyer?'buyer':'seller'}">
        ${isBuyer?`<div class="msg-avatar" style="background:${c.color}">${c.initial}</div>`:''}
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
  const c = CONVERSATIONS.find(x=>x.id===activeConvId);
  c.unread = 0;
  renderConvList();
  updateChatBadge();
  showToast('Percakapan ditandai dibaca. Balasan via app Akulaku.','success','Tandai Dibaca');
}

function updateChatBadge(){
  const total = CONVERSATIONS.reduce((a,c)=>a+c.unread,0);
  const badge = document.getElementById('chatBadge');
  if(total>0){
    badge.style.display='inline-block';
    badge.textContent = total;
  } else {
    badge.style.display='none';
  }
}

function showTyping(){
  const box = document.getElementById('threadMessages');
  if(document.querySelector('.typing-indicator')) return;
  const c = CONVERSATIONS.find(x=>x.id===activeConvId);
  if(!c || !c.online) return;
  const t = document.createElement('div');
  t.className='typing-indicator';
  t.innerHTML='<span></span><span></span><span></span>';
  box.appendChild(t);
  box.scrollTop = box.scrollHeight;
  setTimeout(()=>{
    t.remove();
  }, 2500);
}

function receiveMessage(msg){
  const c = CONVERSATIONS.find(x=>x.id===msg.conv);
  if(!c) return;
  const now = new Date();
  const time = now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  c.messages.push({from:'buyer', text:msg.text, time});
  c.last = msg.text;
  c.time = time;
  if(c.id!==activeConvId) c.unread = (c.unread||0)+1;
  renderConvList();
  if(c.id===activeConvId) renderMessages();
  updateChatBadge();
  showToast(`Pesan baru dari ${c.name}: "${msg.text.substring(0,40)}${msg.text.length>40?'...':''}"`, 'default', 'Chat Masuk');
}

/* =================== PRODUK =================== */
function renderProductTable(){
  const q = document.getElementById('prodSearch').value.toLowerCase();
  const status = document.getElementById('prodStatusFilter').value;
  const sort = document.getElementById('prodSort').value;
  let list = PRODUCTS.filter(p=>{
    if(q && !p.name.toLowerCase().includes(q)) return false;
    if(status!=='all' && p.status!==status) return false;
    return true;
  });
  list.sort((a,b)=>{
    if(sort==='sold') return b.sold-a.sold;
    if(sort==='views') return b.views.reduce((x,y)=>x+y,0)-a.views.reduce((x,y)=>x+y,0);
    if(sort==='price') return b.price-a.price;
    if(sort==='stock') return b.stock-a.stock;
  });
  const tbody = document.getElementById('prodTbody');
  tbody.innerHTML = list.map((p,i)=>{
    const totalViews = p.views.reduce((a,b)=>a+b,0);
    const maxV = Math.max(...p.views);
    const sparkPts = p.views.map((v,i)=>`${(i*60/(p.views.length-1))},${20-(v/maxV)*18}`).join(' ');
    const margin = p.price - p.cost - (p.price*p.fee/100);
    return `
      <tr onclick="openDetail(${p.id})">
        <td style="color:var(--text-muted);font-weight:600">${i+1}</td>
        <td>
          <div class="prod-cell">
            <img class="prod-thumb" src="${PRODUCT_IMG[p.id-1]}">
            <div class="prod-name">${p.name}<small>Margin: Rp ${margin.toLocaleString('id-ID')}</small></div>
          </div>
        </td>
        <td><span class="variant-pill">${p.variant}</span></td>
        <td><span class="price">Rp ${p.price.toLocaleString('id-ID')}</span></td>
        <td><span class="stock ${p.stock===0?'out':p.stock<20?'low':''}">${p.stock===0?'Habis':p.stock}</span></td>
        <td><span class="status-badge ${p.status==='active'?'active':'inactive'}">${p.status==='active'?'Aktif':'Nonaktif'}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <svg width="60" height="22" viewBox="0 0 60 22"><polyline points="${sparkPts}" fill="none" stroke="${p.status==='active'?'#FF3D57':'#8B92A5'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span style="font-size:11px;color:var(--text-muted);font-weight:600">${totalViews}</span>
          </div>
        </td>
        <td style="font-weight:700">${p.sold}</td>
        <td>
          <div class="row-actions" onclick="event.stopPropagation()">
            <button class="row-btn" title="Lihat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
            <button class="row-btn" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          </div>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">Tidak ada produk yang cocok</td></tr>`;
}

function openDetail(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  const fee = Math.round(p.price*p.fee/100);
  const margin = p.price - p.cost - fee;
  const marginPct = ((margin/p.price)*100).toFixed(1);
  const totalViews = p.views.reduce((a,b)=>a+b,0);
  document.getElementById('detailBody').innerHTML = `
    <div class="detail-hero">
      <img src="${PRODUCT_IMG[p.id-1]}">
      <div class="detail-hero-info">
        <h2>${p.name}</h2>
        <div class="price-big">Rp ${p.price.toLocaleString('id-ID')}</div>
        <div style="display:flex;gap:8px;margin-bottom:14px">
          <span class="status-badge ${p.status==='active'?'active':'inactive'}">${p.status==='active'?'Aktif':'Nonaktif'}</span>
          <span class="variant-pill">${p.variant}</span>
        </div>
        <div class="detail-stats">
          <div class="detail-stat"><div class="l">Stok</div><div class="v">${p.stock}</div></div>
          <div class="detail-stat"><div class="l">Terjual</div><div class="v">${p.sold}</div></div>
          <div class="detail-stat"><div class="l">Views 7H</div><div class="v">${totalViews}</div></div>
        </div>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-card">
        <div class="ttl">Harga Modal</div>
        <div class="v">Rp ${p.cost.toLocaleString('id-ID')}</div>
      </div>
      <div class="detail-card">
        <div class="ttl">Fee Akulaku (${p.fee}%)</div>
        <div class="v red">Rp ${fee.toLocaleString('id-ID')}</div>
      </div>
      <div class="detail-card">
        <div class="ttl">Margin / Unit</div>
        <div class="v green">Rp ${margin.toLocaleString('id-ID')} (${marginPct}%)</div>
      </div>
      <div class="detail-card">
        <div class="ttl">Estimasi Profit (sold)</div>
        <div class="v green">Rp ${(margin*p.sold).toLocaleString('id-ID')}</div>
      </div>
    </div>
    <div class="detail-desc">${p.desc}</div>
    <div style="display:flex;gap:10px;margin-top:18px">
      <button class="btn-ghost" style="flex:1;justify-content:center;padding:11px" onclick="showToast('Membuka editor di Akulaku Seller Center','info')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit di Akulaku</button>
      <button class="btn-primary-sm" style="flex:1;justify-content:center;padding:11px" onclick="closeDetail();showToast('Produk disinkronkan','success')">Sinkron Ulang</button>
    </div>
  `;
  document.getElementById('prodDetail').classList.add('show');
}

function closeDetail(){
  document.getElementById('prodDetail').classList.remove('show');
}

function syncProducts(){
  const now = new Date();
  const t = now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  document.getElementById('prodSync').textContent = t;
  showToast('Katalog produk disinkronkan dengan Akulaku Seller Center','success','Sinkron Berhasil');
}

/* =================== TREN =================== */
function renderBarChart(){
  const data = [3200,4100,3800,5200,6100,7400,6800];
  const max = Math.max(...data);
  const labels = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
  const chart = document.getElementById('barChart');
  chart.innerHTML = data.map((v,i)=>{
    const h = (v/max)*100;
    return `
      <div class="bar-col">
        <div class="bar" style="height:${h}%;background:linear-gradient(180deg,${i===5?'#FF3D57':'#FF8C9F'},${i===5?'#E2234B':'#FFA940'})">
          <div class="bar-val">${(v/1000).toFixed(1)}K</div>
        </div>
        <div class="bar-label">${labels[i]}</div>
      </div>
    `;
  }).join('');
}

function renderTrenTop(){
  const list = document.getElementById('trenTopList');
  list.innerHTML = TREND_TOP.map((p,i)=>`
    <div class="tren-item">
      <div class="tren-rank ${i===0?'top1':''}">${i+1}</div>
      <img class="tren-thumb" src="${p.img}">
      <div class="tren-info">
        <div class="nm">${p.name}</div>
        <div class="mt">
          <span class="pr">Rp ${p.price.toLocaleString('id-ID')}</span>
          <span>· ${p.sold} terjual</span>
        </div>
      </div>
      <div class="tren-trend ${p.trend}">
        ${p.trend==='up'?'▲':'▼'} ${p.pct}
        ${p.hot?'<div style="font-size:9px;margin-top:2px;background:#FF3D57;color:#fff;padding:1px 5px;border-radius:3px">HOT</div>':''}
      </div>
    </div>
  `).join('');
}

function renderTags(){
  const list = document.getElementById('tagsList');
  list.innerHTML = RELATED_KEYWORDS.map(k=>`
    <div class="tag" onclick="document.getElementById('trenInput').value='${k.tag}';analyzeKeyword()">
      ${k.tag}
      <span class="v">${k.v}</span>
    </div>
  `).join('');
}

function analyzeKeyword(){
  const kw = document.getElementById('trenInput').value || 'tumbler termal';
  document.getElementById('trenKeyword').textContent = kw;
  renderBarChart();
  showToast(`Menganalisis kata kunci: "${kw}"`,'info','Analisis Tren');
}

/* =================== ORDER =================== */
function renderOrders(){
  const tbody = document.getElementById('orderTbody');
  const statusColor = {
    'Diproses':'warning',
    'Dikirim':'info',
    'Selesai':'success'
  };
  tbody.innerHTML = ORDERS.map(o=>{
    const prod = PRODUCTS.find(p=>p.name.includes(o.product.split(' ')[0])) || PRODUCTS[0];
    return `
      <tr>
        <td><span style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:12px;color:var(--primary)">${o.id}</span></td>
        <td>
          <div class="prod-cell">
            <img class="prod-thumb" src="${PRODUCT_IMG[prod.id-1]}" style="width:36px;height:36px">
            <div class="prod-name" style="font-size:12.5px">${o.product}</div>
          </div>
        </td>
        <td>${o.buyer}</td>
        <td><span class="status-badge ${o.status==='Selesai'?'active':o.status==='Dikirim'?'':'inactive'}" style="${o.status==='Dikirim'?'background:#EFF6FF;color:#1E40AF':''}">${o.status}</span></td>
        <td><span class="variant-pill">${o.cicilan}</span></td>
        <td><span class="settle-badge ${o.settle}">${o.settleText}</span></td>
        <td style="font-size:12px;color:var(--text-muted)">${o.date}</td>
      </tr>
    `;
  }).join('');
}

/* =================== SIMULATIONS =================== */
function startSimulations(){
  // Sinkron time update
  let mins = 0;
  setInterval(()=>{
    mins++;
    const el = document.getElementById('syncTime');
    if(mins<1) el.textContent = 'Tersinkron baru saja';
    else if(mins<60) el.textContent = `Tersinkron ${mins} menit lalu`;
    else el.textContent = `Tersinkron ${Math.floor(mins/60)} jam lalu`;
  }, 60000);

  // Incoming chat
  INCOMING_MESSAGES.forEach((msg,i)=>{
    setTimeout(()=>{
      showTypingFor(msg.conv);
      setTimeout(()=>receiveMessage(msg), 2500);
    }, msg.delay);
  });

  // Random incoming setelah batch pertama selesai
  setTimeout(()=>{
    setInterval(()=>{
      const conv = CONVERSATIONS[Math.floor(Math.random()*CONVERSATIONS.length)];
      const text = BUYER_MSGS_POOL[Math.floor(Math.random()*BUYER_MSGS_POOL.length)];
      showTypingFor(conv.id);
      setTimeout(()=>receiveMessage({conv:conv.id, text}), 2500);
    }, 25000);
  }, 40000);
}

function showTypingFor(convId){
  if(convId!==activeConvId) return;
  showTyping();
}

/* =================== INIT =================== */
window.addEventListener('DOMContentLoaded',()=>{
  renderDashChat();
  renderConvList();
  renderMessages();
  updateChatBadge();
  renderProductTable();
  renderBarChart();
  renderTrenTop();
  renderTags();
  renderOrders();
  // Load BigSeller data async
  loadDashboard();

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

/* =================== BIGSELLER SETTINGS =================== */
let bsCookie = '';
function saveBSCookie(){
  const el = document.getElementById('bsCookie');
  const status = document.getElementById('bsStatus');
  const cookie = el.value.trim();
  if(!cookie) return status.innerHTML = '<span style="color:var(--danger)">⚠️ Cookie kosong</span>';
  status.innerHTML = '<span style="color:var(--text-muted)">⏳ Menyimpan...</span>';
  fetch('/api/bigseller/save-cookie', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({shopId:'default', cookie})
  })
  .then(r=>r.json())
  .then(d=>{
    if(d.success){
      bsCookie = cookie;
      status.innerHTML = '<span style="color:var(--success)">✅ Cookie tersimpan! Coba ambil data di bawah.</span>';
    } else {
      status.innerHTML = '<span style="color:var(--danger)">❌ Gagal: '+(d.error||'unknown')+'</span>';
    }
  })
  .catch(e=>{
    status.innerHTML = '<span style="color:var(--danger)">❌ Error: '+e.message+'</span>';
  });
}
function fetchBS(path){
  const pre = document.getElementById('bsResult');
  const status = document.getElementById('bsStatus');
  pre.textContent = '⏳ Loading...';
  // Try using saved cookie from DB first, fallback to query param
  let url = '/api/bigseller/proxy?path='+encodeURIComponent(path);
  if(bsCookie) url += '&token='+encodeURIComponent(bsCookie);
  fetch(url)
  .then(r=>r.text())
  .then(t=>{
    try{ pre.textContent = JSON.stringify(JSON.parse(t), null, 2); }
    catch(e){ pre.textContent = t; }
  })
  .catch(e=>{
    pre.textContent = 'Error: '+e.message;
  });
}
