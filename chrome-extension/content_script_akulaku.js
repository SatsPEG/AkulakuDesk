// content_script_akulaku.js
// Berjalan di https://ec-vendor.akulaku.com/*
// Tugas: intercept data dari API internal Akulaku & kirim ke background

(function() {
  'use strict';

  // ─── 1. INTERCEPT FETCH / XHR ─────────────────────────────────────

  const AKULAKU_API_PATTERNS = [
    '/bapi/vendor-goods-biz/goods/list',
    '/bapi/vendor-orders-biz/order/queryOrders',
    '/bapi/vendor/desk/statistics',
    '/bapi/vendor-goods-biz/goods/shop/quota',
    '/bapi/vendor-goods-biz/goods/statistics',
  ];

  // Simpan data terakhir yg sukses
  let cachedData = {};

  // Intercept global fetch
  const origFetch = window.fetch;
  window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const isTarget = AKULAKU_API_PATTERNS.some(p => url.includes(p));

    return origFetch.apply(this, args).then(async response => {
      if (!isTarget) return response;

      // Clone biar bisa dibaca tanpa consume stream asli
      const clone = response.clone();
      try {
        const json = await clone.json();
        if (json && json.success) {
          // Simpan berdasarkan endpoint
          const key = url.split('/bapi')[1] || url;
          cachedData[key] = json;

          // Kirim ke background
          chrome.runtime.sendMessage({
            type: 'AKULAKU_DATA',
            payload: {
              endpoint: key,
              data: json,
              timestamp: Date.now()
            }
          }).catch(() => {
            // Background mungkin belum siap — skip
          });
        }
      } catch (_) {
        // Bukan JSON — skip
      }
      return response;
    });
  };

  // ─── 2. MANUAL SCRAPE (fallback untuk data yg udah di-render) ────

  function scrapeProductTable() {
    const rows = document.querySelectorAll('table tbody tr');
    const products = [];
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 5) return;
      products.push({
        name: cells[0]?.textContent?.trim() || '',
        price: cells[2]?.textContent?.trim() || '',
        stock: cells[3]?.textContent?.trim() || '',
        status: cells[4]?.textContent?.trim() || '',
      });
    });
    return products;
  }

  // ─── 3. GETTER FUNCTIONS (dipanggil dari popup/background) ───────

  function getAllData() {
    return {
      cachedData,
      scrapedProducts: scrapeProductTable(),
      cookies: document.cookie,
      url: window.location.href
    };
  }

  // ─── 4. LISTENER (dari popup) ─────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'AKULAKU_GET_DATA') {
      sendResponse(getAllData());
    }
    if (msg.type === 'AKULAKU_REFRESH') {
      cachedData = {};
      window.location.reload();
    }
  });

  // ─── 5. INIT: kirim sinyal siap ───────────────────────────────────

  chrome.runtime.sendMessage({
    type: 'AKULAKU_READY',
    payload: { url: window.location.href }
  }).catch(() => {});

  console.log('[AkulakuDesk Bridge] Content script loaded & intercepting API');

})();
