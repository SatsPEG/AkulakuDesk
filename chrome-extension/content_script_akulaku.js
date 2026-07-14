// content_script_akulaku.js — Isolated world
// Tugas: inject main-world script + bridge postMessage ↔ runtime

(function() {
  'use strict';

  // ─── 1. INJEKSI MAIN-WORLD SCRIPT ───────────────────────────────

  // Baca kode injeksi sebagai string (inline biar gak dependensi file eksternal)
  const INJECT_SCRIPT = `

(function() {
  'use strict';

  // ─── KONFIGURASI DINAMIS ──────────────────────────────────────────
  // Default endpoint: semua yg mengandung pattern ini akan di-intercept
  let TARGET_PATTERNS = [
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

  // Bisa di-update dari luar via pesan
  window.__akulakuBridgeSetTargets = function(patterns) {
    if (Array.isArray(patterns)) TARGET_PATTERNS = patterns;
  };

  function shouldIntercept(url) {
    return TARGET_PATTERNS.some(p => url.includes(p));
  }

  function getEndpointName(url) {
    const match = url.match(/\\/bapi\\/[^?#]+/);
    return match ? match[0] : url;
  }

  // ─── 2. FETCH MONKEY-PATCH ───────────────────────────────────────
  // Menyadap semua panggilan fetch, clone response, kirim data ke content script

  const ORIGINAL_FETCH = window.fetch.bind(window);

  window.fetch = function(input, init) {
    const url = (typeof input === 'string') ? input : (input?.url || '');

    if (!shouldIntercept(url)) {
      return ORIGINAL_FETCH(input, init);
    }

    return ORIGINAL_FETCH(input, init).then(function(response) {
      // Clone biar stream gak ke-consum
      const clone = response.clone();
      clone.text().then(function(text) {
        try {
          const data = JSON.parse(text);
          if (data && data.success !== undefined) {
            window.postMessage({
              source: '__akulaku_bridge_inject__',
              type: 'API_DATA',
              payload: {
                endpoint: getEndpointName(url),
                data: data,
                url: url,
                timestamp: Date.now()
              }
            }, '*');
          }
        } catch(_) { /* Not JSON — skip */ }
      }).catch(function() {});
      return response;
    });
  };

  // ─── 3. XMLHttpRequest MONKEY-PATCH ──────────────────────────────
  // Backup buat nangkep endpoint yg pake XHR (kalo ada)

  const ORIGINAL_XHR_OPEN = XMLHttpRequest.prototype.open;
  const ORIGINAL_XHR_SEND = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
    this.__akulaku_url = (typeof url === 'string') ? url : (url ? url.href : '');
    this.__akulaku_method = method;
    return ORIGINAL_XHR_OPEN.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    if (this.__akulaku_url && shouldIntercept(this.__akulaku_url)) {
      this.addEventListener('load', function() {
        try {
          const data = JSON.parse(this.responseText);
          if (data && data.success !== undefined) {
            window.postMessage({
              source: '__akulaku_bridge_inject__',
              type: 'API_DATA',
              payload: {
                endpoint: getEndpointName(this.__akulaku_url),
                data: data,
                url: this.__akulaku_url,
                timestamp: Date.now()
              }
            }, '*');
          }
        } catch(_) {}
      });
    }
    return ORIGINAL_XHR_SEND.apply(this, arguments);
  };

  // ─── 4. HEARTBEAT BALASAN ────────────────────────────────────────
  // Content script ngirim ping, kita balas pong

  window.addEventListener('message', function(event) {
    if (event.data && event.data.source === '__akulaku_bridge_cs__') {
      if (event.data.type === 'PING') {
        window.postMessage({
          source: '__akulaku_bridge_inject__',
          type: 'PONG',
          payload: { ts: Date.now() }
        }, '*');
      }
      if (event.data.type === 'SET_TARGETS') {
        window.__akulakuBridgeSetTargets(event.data.payload);
        window.postMessage({
          source: '__akulaku_bridge_inject__',
          type: 'TARGETS_UPDATED',
          payload: { patterns: event.data.payload }
        }, '*');
      }
    }
  });

  console.log('[Akulaku Bridge Inject] Main-world script loaded. Intercepting fetch & XHR.');

})();

`;

  // ─── 2. INJECT KE PAGE ───────────────────────────────────────────

  function injectMainWorld() {
    // Cegah double inject
    if (document.querySelector('script[data-akulaku-bridge]')) return;

    const script = document.createElement('script');
    script.setAttribute('data-akulaku-bridge', '');
    script.textContent = INJECT_SCRIPT;
    (document.head || document.documentElement).appendChild(script);
    script.remove(); // Bersihin setelah jalan
  }

  // ─── 3. BRIDGE: postMessage (dari injected) → runtime (ke background) ──

  window.addEventListener('message', function(event) {
    // Hanya terima dari injected script kita
    if (event.data?.source !== '__akulaku_bridge_inject__') return;

    const msg = event.data;

    // Forward API_DATA ke background
    if (msg.type === 'API_DATA') {
      chrome.runtime.sendMessage({
        type: 'AKULAKU_DATA',
        payload: msg.payload
      }).catch(function() {
        // Background mungkin belum ready — skip
      });
    }

    // Forward PONG ke background
    if (msg.type === 'PONG') {
      chrome.runtime.sendMessage({
        type: 'PONG',
        payload: msg.payload
      }).catch(function() {});
    }
  });

  // ─── 4. BRIDGE: runtime (dari background) → postMessage (ke injected) ──

  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    // PING dari background — forward ke injected world
    if (msg.type === 'PING') {
      window.postMessage({
        source: '__akulaku_bridge_cs__',
        type: 'PING'
      }, '*');
      sendResponse({ forwarded: true });
      return true;
    }

    // Remote config update — forward ke injected world
    if (msg.type === 'SET_TARGETS') {
      window.postMessage({
        source: '__akulaku_bridge_cs__',
        type: 'SET_TARGETS',
        payload: msg.payload
      }, '*');
      sendResponse({ forwarded: true });
      return true;
    }

    // Get status dari injected world
    if (msg.type === 'GET_STATUS') {
      sendResponse({
        injected: !!document.querySelector('script[data-akulaku-bridge]'),
        url: window.location.href,
        ready: true
      });
      return true;
    }
  });

  // ─── 5. EKSEKUSI ─────────────────────────────────────────────────

  // Inject setelah DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMainWorld);
  } else {
    injectMainWorld();
  }

  // Kirim sinyal siap ke background
  chrome.runtime.sendMessage({
    type: 'AKULAKU_READY',
    payload: { url: window.location.href }
  }).catch(function() {});

  console.log('[AkulakuDesk Bridge] Content script injected & listening');

})();
