// content_script_livechat.js — Berjalan di livechat.akulaku.com
// Tugas: intercept chat data & kirim ke background

(function() {
  'use strict';

  const INJECT_SCRIPT = `
(function() {
  'use strict';

  const ORIG_FETCH = window.fetch.bind(window);

  window.fetch = function(input, init) {
    const url = (typeof input === 'string') ? input : (input?.url || '');
    const shouldIntercept = url.includes('/api/') || url.includes('conversation') || url.includes('message') || url.includes('chat');

    if (!shouldIntercept) {
      return ORIG_FETCH(input, init);
    }

    return ORIG_FETCH(input, init).then(function(response) {
      const clone = response.clone();
      clone.json().then(function(data) {
        window.postMessage({
          source: '__akulaku_bridge_livechat__',
          type: 'CHAT_DATA',
          payload: {
            endpoint: url,
            data: data,
            timestamp: Date.now()
          }
        }, '*');
      }).catch(function() {});
      return response;
    });
  };

  const ORIG_XHR_OPEN = XMLHttpRequest.prototype.open;
  const ORIG_XHR_SEND = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
    this.__akulaku_url = (typeof url === 'string') ? url : (url ? url.href : '');
    return ORIG_XHR_OPEN.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    if (this.__akulaku_url && (this.__akulaku_url.includes('message') || this.__akulaku_url.includes('chat') || this.__akulaku_url.includes('conversation'))) {
      this.addEventListener('load', function() {
        try {
          const data = JSON.parse(this.responseText);
          window.postMessage({
            source: '__akulaku_bridge_livechat__',
            type: 'CHAT_DATA',
            payload: {
              endpoint: this.__akulaku_url,
              data: data,
              timestamp: Date.now()
            }
          }, '*');
        } catch(_) {}
      });
    }
    return ORIG_XHR_SEND.apply(this, arguments);
  };

  console.log('[Akulaku LiveChat Bridge] Inject aktif');

})();
`;

  // Inject main-world
  const script = document.createElement('script');
  script.setAttribute('data-akulaku-livechat', '');
  script.textContent = INJECT_SCRIPT;
  (document.head || document.documentElement).appendChild(script);
  script.remove();

  // Bridge: injected → background
  window.addEventListener('message', function(event) {
    if (event.data?.source !== '__akulaku_bridge_livechat__') return;
    if (event.data.type === 'CHAT_DATA') {
      chrome.runtime.sendMessage({
        type: 'AKULAKU_DATA',
        payload: event.data.payload
      }).catch(function() {});
    }
  });

  // Kirim sinyal siap
  chrome.runtime.sendMessage({
    type: 'AKULAKU_READY',
    payload: { url: window.location.href }
  }).catch(function() {});

  console.log('[AkulakuDesk Bridge] LiveChat content script ready');

})();
