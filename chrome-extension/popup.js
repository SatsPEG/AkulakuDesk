// popup.js — UI controller untuk popup ekstensi

(function() {
  'use strict';

  const els = {
    dotAkulaku: document.getElementById('dotAkulaku'),
    dotVercel: document.getElementById('dotVercel'),
    statusAkulaku: document.getElementById('statusAkulaku'),
    statusVercel: document.getElementById('statusVercel'),
    bridgeStatus: document.getElementById('bridgeStatus'),
    lastSync: document.getElementById('lastSync'),
    lastEndpoint: document.getElementById('lastEndpoint'),
    dataCount: document.getElementById('dataCount'),
    dataPreview: document.getElementById('dataPreview'),
  };

  // ─── UPDATE UI ──────────────────────────────────────────────────

  function updateUI(status) {
    // Akulaku
    if (status.akulaku) {
      els.dotAkulaku.className = 'status-dot dot-green';
      els.statusAkulaku.textContent = 'Connected';
    } else {
      els.dotAkulaku.className = 'status-dot dot-red';
      els.statusAkulaku.textContent = 'Not detected';
    }

    // Vercel
    if (status.vercel) {
      els.dotVercel.className = 'status-dot dot-green';
      els.statusVercel.textContent = 'Connected';
    } else {
      els.dotVercel.className = 'status-dot dot-red';
      els.statusVercel.textContent = 'Not detected';
    }

    // Bridge status
    if (status.connected) {
      els.bridgeStatus.innerHTML = '<span class="badge badge-ok">✅ ACTIVE</span>';
    } else {
      els.bridgeStatus.innerHTML = '<span class="badge badge-off">⛔ DISCONNECTED</span>';
    }

    // Last data info
    if (status.lastData) {
      const d = new Date(status.lastData);
      els.lastSync.textContent = d.toLocaleTimeString('id-ID');
    } else {
      els.lastSync.textContent = '—';
    }

    if (status.lastEndpoint) {
      els.lastEndpoint.textContent = status.lastEndpoint.split('/').pop();
    } else {
      els.lastEndpoint.textContent = '—';
    }
  }

  function updateDataPreview(data) {
    if (!data) {
      els.dataPreview.textContent = 'No data yet. Open Akulaku Seller Center and browse products...';
      els.dataCount.textContent = '0';
      return;
    }

    const records = data?.data?.records || data?.data?.page?.rows || [];
    const count = Array.isArray(records) ? records.length : 0;
    els.dataCount.textContent = count.toString();

    const preview = JSON.stringify(data, null, 2);
    els.dataPreview.textContent = preview.length > 2000
      ? preview.substring(0, 2000) + '\n\n... (truncated)'
      : preview;
  }

  // ─── FETCH STATUS ───────────────────────────────────────────────

  function refresh() {
    chrome.runtime.sendMessage({ type: 'BRIDGE_GET_STATUS' }, (response) => {
      if (response) {
        updateUI(response);
      }
    });

    chrome.storage.local.get('latestAkulakuData', (result) => {
      if (result.latestAkulakuData) {
        updateDataPreview(result.latestAkulakuData);
      }
    });
  }

  // ─── ACTIONS ────────────────────────────────────────────────────

  document.getElementById('btnRefresh').addEventListener('click', () => {
    els.dataPreview.textContent = '⏳ Refreshing...';
    chrome.runtime.sendMessage({ type: 'BRIDGE_REQUEST_REFRESH' });
    setTimeout(refresh, 1500);
  });

  document.getElementById('btnOpenDashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://akulaku-desk-six.vercel.app/' });
  });

  // ─── INIT ───────────────────────────────────────────────────────

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.latestAkulakuData) {
      updateDataPreview(changes.latestAkulakuData.newValue);
    }
    if (changes.bridgeStatus) {
      updateUI(changes.bridgeStatus.newValue);
    }
  });

  // Initial load
  refresh();

  // Auto refresh every 3s
  setInterval(refresh, 3000);

})();
