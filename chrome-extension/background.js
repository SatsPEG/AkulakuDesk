// background.js — Service Worker (Manifest V3)
// Tugas: relay data, heartbeat keep-alive, remote config via Vercel

// ─── STATE ─────────────────────────────────────────────────────────
let akulakuTabId = null;
let vercelTabId = null;
let latestData = null;
let isConnected = false;
let heartbeatCount = 0;
let missedPongs = 0;
const MAX_MISSED_PONGS = 3;
const HEARTBEAT_INTERVAL_MS = 20000; // 20 detik

// ─── FUNGSI ────────────────────────────────────────────────────────

function findTabs() {
  chrome.tabs.query({ url: 'https://ec-vendor.akulaku.com/*' }, (tabs) => {
    akulakuTabId = tabs.length > 0 ? tabs[0].id : null;
  });
  chrome.tabs.query({ url: 'https://akulaku-desk-six.vercel.app/*' }, (tabs) => {
    vercelTabId = tabs.length > 0 ? tabs[0].id : null;
  });
  updateStatus();
}

function updateStatus() {
  isConnected = !!(akulakuTabId && vercelTabId);
  const data = {
    connected: isConnected,
    akulaku: !!akulakuTabId,
    vercel: !!vercelTabId,
    heartbeat: heartbeatCount,
    lastData: latestData?.timestamp || null,
    lastEndpoint: latestData?.endpoint || null,
    missedPongs: missedPongs
  };
  chrome.storage.local.set({ bridgeStatus: data });
  return data;
}

function relayToVercel(payload) {
  if (!vercelTabId) return false;
  chrome.tabs.sendMessage(vercelTabId, {
    type: 'BRIDGE_DATA',
    payload: payload
  }).catch(() => false);
  return true;
}

// ─── 1. HEARTBEAT (Keep-Alive) ─────────────────────────────────────

// chrome.alarms lebih reliable daripada setInterval di Service Worker
chrome.alarms.create('heartbeat-ping', {
  periodInMinutes: 1/3  // ~20 detik
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'heartbeat-ping') return;

  heartbeatCount++;

  if (akulakuTabId) {
    chrome.tabs.sendMessage(akulakuTabId, { type: 'PING' })
      .then(() => {
        missedPongs = 0;
      })
      .catch(() => {
        missedPongs++;
        if (missedPongs >= MAX_MISSED_PONGS) {
          // Content script mungkin gak responsif — coba inject ulang dengan refresh
          akulakuTabId = null;
          findTabs();
        }
      });
  }

  updateStatus();
});

// ─── 2. REMOTE CONFIG ──────────────────────────────────────────────

// Menerima konfigurasi dari Vercel dashboard, diteruskan ke
// content_script_akulaku untuk update daftar endpoint yg di-intercept.
// Data config disimpan di storage agar persisten.

const DEFAULT_TARGETS = [
  '/bapi/vendor-goods-biz/goods/list',
  '/bapi/vendor-orders-biz/order/queryOrders',
  '/bapi/vendor/desk/statistics',
  '/bapi/vendor-goods-biz/goods/shop/quota',
  '/bapi/vendor-goods-biz/goods/statistics',
  '/bapi/vendor-goods-biz/goods/shop/quota/query',
  '/bapi/vendor-orders-biz/order/countVendorOrder',
  '/bapi/vendor/shop/getShopInfo',
  '/bapi/vendor/chat/message/vendorTotalUnreadNumByAccount',
  '/bapi/vendor-asset-biz/shop/fund/settlementType',
  '/bapi/vendor-orders-biz/refundOrder/countProcessRefundOrder',
  '/bapi/vendor-orders-biz/refundOrder/queryRefundOrderPageList',
  '/bapi/vendor-goods-biz/goods/tiny-sku/list',
];

// Init default config saat install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ targetPatterns: DEFAULT_TARGETS });
  findTabs();
});

function pushConfigToAkulaku() {
  if (!akulakuTabId) return;
  chrome.storage.local.get('targetPatterns', (result) => {
    const patterns = result.targetPatterns || DEFAULT_TARGETS;
    chrome.tabs.sendMessage(akulakuTabId, {
      type: 'SET_TARGETS',
      payload: patterns
    }).catch(() => {});
  });
}

// Terima config baru dari Vercel tab
function handleRemoteConfig(patterns) {
  chrome.storage.local.set({ targetPatterns: patterns });
  pushConfigToAkulaku();
}

// ─── 3. LISTENERS ──────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Track tab IDs
  if (sender.tab) {
    const url = sender.tab.url || '';
    if (url.includes('ec-vendor.akulaku.com')) akulakuTabId = sender.tab.id;
    if (url.includes('akulaku-desk-six.vercel.app')) vercelTabId = sender.tab.id;
    updateStatus();
  }

  switch (msg.type) {

    // ── Data dari Akulaku ──
    case 'AKULAKU_DATA':
      latestData = msg.payload;
      chrome.storage.local.set({ latestAkulakuData: msg.payload });
      relayToVercel(msg.payload);
      updateStatus();
      break;

    // ── PONG dari content script (balasan heartbeat) ──
    case 'PONG':
      missedPongs = 0;
      break;

    // ── AKULAKU_READY (content script baru di-load) ──
    case 'AKULAKU_READY':
      chrome.storage.local.set({ akulakuReady: true });
      // Kirim config terbaru
      pushConfigToAkulaku();
      break;

    // ── BRIDGE_READY dari Vercel tab ──
    case 'BRIDGE_READY':
      // Kirim data terakhir kalo ada
      if (latestData) {
        relayToVercel(latestData);
      }
      break;

    // ── GET_STATUS (dari popup) ──
    case 'BRIDGE_GET_STATUS':
      sendResponse(updateStatus());
      return true;

    // ── REQUEST_REFRESH (dari popup) ──
    case 'BRIDGE_REQUEST_REFRESH':
      if (akulakuTabId) {
        chrome.tabs.sendMessage(akulakuTabId, { type: 'GET_STATUS' })
          .catch(() => {});
      }
      sendResponse({ refreshed: true });
      return true;

    // ── REMOTE_CONFIG dari Vercel (dashboard → extension) ──
    case 'REMOTE_CONFIG':
      if (msg.payload?.targetPatterns) {
        handleRemoteConfig(msg.payload.targetPatterns);
      }
      sendResponse({ applied: true });
      return true;
  }
});

// ─── 4. TAB TRACKING ───────────────────────────────────────────────

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === akulakuTabId) { akulakuTabId = null; missedPongs = 0; }
  if (tabId === vercelTabId) vercelTabId = null;
  updateStatus();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) findTabs();
  // Re-push config kalo tab akulaku selesai di-refresh
  if (tabId === akulakuTabId && changeInfo.status === 'complete') {
    setTimeout(pushConfigToAkulaku, 2000);
  }
});

// Periodic fallback check (selain alarms)
setInterval(findTabs, 15000);

console.log('[AkulakuDesk Bridge] Background worker started');
