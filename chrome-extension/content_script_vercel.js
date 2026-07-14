// content_script_vercel.js
// Berjalan di https://akulaku-desk-six.vercel.app/*
// Tugas: terima data dari background & kirim ke halaman via postMessage + global callback

(function() {
  'use strict';

  // ─── 1. LISTENER DARI BACKGROUND ─────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'BRIDGE_DATA') {
      const payload = msg.payload;

      // ─── a. Dispatch event ke window ──────────────────────────
      window.dispatchEvent(new CustomEvent('akulaku-bridge-data', {
        detail: payload
      }));

      // ─── b. postMessage (buat React/Vue state management) ─────
      window.postMessage({
        source: 'akulaku-bridge',
        type: 'BRIDGE_DATA',
        payload: payload
      }, 'https://akulaku-desk-six.vercel.app');

      // ─── c. Simpan ke window.__AKULAKU_BRIDGE_DATA ───────────
      if (!window.__AKULAKU_BRIDGE_DATA) {
        window.__AKULAKU_BRIDGE_DATA = [];
      }
      window.__AKULAKU_BRIDGE_DATA.push(payload);
      // Keep only last 50
      if (window.__AKULAKU_BRIDGE_DATA.length > 50) {
        window.__AKULAKU_BRIDGE_DATA.shift();
      }

      // ─── d. Trigger callback kalo ada ─────────────────────────
      if (window.__onAkulakuBridgeData) {
        try {
          window.__onAkulakuBridgeData(payload);
        } catch(e) {
          console.error('[AkulakuDesk Bridge] Callback error:', e);
        }
      }

      console.log('[AkulakuDesk Bridge] Data received & dispatched:', payload.endpoint);
    }
  });

  // ─── 2. KIRIM SINYAL SIAP KE BACKGROUND ─────────────────────────

  chrome.runtime.sendMessage({
    type: 'BRIDGE_READY',
    payload: { url: window.location.href }
  }).catch(() => {});

  console.log('[AkulakuDesk Bridge] Vercel content script loaded');

})();
