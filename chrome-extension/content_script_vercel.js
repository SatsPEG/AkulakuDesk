// content_script_vercel.js — Isolated world
// Tugas: terima data dari background + relay remote config ke background
// + kasih tau halaman kalo extension aktif

(function() {
  'use strict';

  function isDashboard() {
    return window.location.hostname === 'akulaku-desk-six.vercel.app';
  }

  // ─── 0. SINYAL EXTENSION AKTIF ──────────────────────────────────
  // Langsung kirim sinyal ke halaman begitu script jalan
  function announceActive() {
    window.postMessage({
      source: 'akulaku-bridge',
      type: 'EXTENSION_ACTIVE',
      payload: {
        version: '1.0.0',
        url: window.location.href,
        timestamp: Date.now()
      }
    }, 'https://akulaku-desk-six.vercel.app');

    // CustomEvent juga
    window.dispatchEvent(new CustomEvent('akulaku-bridge-active', {
      detail: { active: true, timestamp: Date.now() }
    }));
  }

  // Announce setelah halaman siap
  if (document.readyState === 'complete') {
    announceActive();
  } else {
    window.addEventListener('load', announceActive);
  }

  // ─── 1. LISTENER DARI BACKGROUND ─────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'BRIDGE_DATA') {
      const payload = msg.payload;

      // Dispatch ke halaman via 3 kanal
      window.dispatchEvent(new CustomEvent('akulaku-bridge-data', { detail: payload }));

      window.postMessage({
        source: 'akulaku-bridge',
        type: 'BRIDGE_DATA',
        payload: payload
      }, 'https://akulaku-desk-six.vercel.app');

      // Global storage
      if (!window.__AKULAKU_BRIDGE_DATA) window.__AKULAKU_BRIDGE_DATA = [];
      window.__AKULAKU_BRIDGE_DATA.push(payload);
      if (window.__AKULAKU_BRIDGE_DATA.length > 50) window.__AKULAKU_BRIDGE_DATA.shift();

      if (window.__onAkulakuBridgeData) {
        try { window.__onAkulakuBridgeData(payload); } catch(e) {}
      }
    }
  });

  // ─── 2. REMOTE CONFIG: dari dashboard → background ─────────────

  // Dashboard bisa kirim config baru via postMessage
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data?.source !== 'akulaku-dashboard') return;

    // Kirim ke background
    chrome.runtime.sendMessage({
      type: 'REMOTE_CONFIG',
      payload: event.data.payload
    }).catch(() => {});
  });

  // ─── 3. SINYAL SIAP KE BACKGROUND ─────────────────────────────

  chrome.runtime.sendMessage({
    type: 'BRIDGE_READY',
    payload: { url: window.location.href }
  }).catch(() => {});

  console.log('[AkulakuDesk Bridge] Vercel content script ready');

})();
