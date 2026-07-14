// background.js — Service Worker (Manifest V3)
// Tugas: relay data dari tab Akulaku ke tab Vercel

// ─── STATE ─────────────────────────────────────────────────────────
let akulakuTabId = null;
let vercelTabId = null;
let latestData = null;
let isConnected = false;

// ─── FUNGSI ────────────────────────────────────────────────────────

function findTabs() {
  chrome.tabs.query({ url: 'https://ec-vendor.akulaku.com/*' }, (tabs) => {
    akulakuTabId = tabs.length > 0 ? tabs[0].id : null;
  });
  chrome.tabs.query({ url: 'https://akulaku-desk-six.vercel.app/*' }, (tabs) => {
    vercelTabId = tabs.length > 0 ? tabs[0].id : null;
  });
  updateConnectionStatus();
}

function updateConnectionStatus() {
  isConnected = !!(akulakuTabId && vercelTabId);
  chrome.storage.local.set({
    bridgeStatus: {
      connected: isConnected,
      akulaku: !!akulakuTabId,
      vercel: !!vercelTabId,
      lastData: latestData?.timestamp || null,
      lastEndpoint: latestData?.endpoint || null
    }
  });
}

function relayToVercel(payload) {
  if (!vercelTabId) {
    console.warn('[AkulakuDesk Bridge] No Vercel tab found');
    return;
  }
  chrome.tabs.sendMessage(vercelTabId, {
    type: 'BRIDGE_DATA',
    payload: payload
  }).catch(err => {
    console.warn('[AkulakuDesk Bridge] Vercel tab not ready:', err.message);
  });
}

// ─── LISTENERS ─────────────────────────────────────────────────────

// 1. Dari content_script_akulaku
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (sender.tab) {
    // Track tab IDs
    const url = sender.tab.url || '';
    if (url.includes('ec-vendor.akulaku.com')) {
      akulakuTabId = sender.tab.id;
    }
    if (url.includes('akulaku-desk-six.vercel.app')) {
      vercelTabId = sender.tab.id;
    }
    updateConnectionStatus();
  }

  switch (msg.type) {

    case 'AKULAKU_DATA':
      latestData = msg.payload;
      // Simpan ke storage buat popup
      chrome.storage.local.set({ latestAkulakuData: msg.payload });
      // Relay ke Vercel tab
      relayToVercel(msg.payload);
      updateConnectionStatus();
      break;

    case 'AKULAKU_READY':
      // Content script di tab Akulaku udah siap
      chrome.storage.local.set({ akulakuReady: true });
      break;

    case 'BRIDGE_GET_STATUS':
      sendResponse({
        connected: isConnected,
        akulakuTab: akulakuTabId,
        vercelTab: vercelTabId,
        latestData: latestData
      });
      break;

    case 'BRIDGE_REQUEST_REFRESH':
      // Minta content script buat refresh data
      if (akulakuTabId) {
        chrome.tabs.sendMessage(akulakuTabId, { type: 'AKULAKU_REFRESH' });
      }
      break;
  }
});

// 2. Tab closed/diubah
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === akulakuTabId) akulakuTabId = null;
  if (tabId === vercelTabId) vercelTabId = null;
  updateConnectionStatus();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    findTabs();
  }
});

// ─── INIT ──────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  findTabs();
});

// Periodic check
setInterval(findTabs, 10000);

console.log('[AkulakuDesk Bridge] Background service worker started');
