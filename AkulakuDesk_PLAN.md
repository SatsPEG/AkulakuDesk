# AKULAKUDESK — PLAN PROYEK

## TUJUAN
Bikin aplikasi desktop (WPF/C#) untuk seller/dropshipper Akulaku.
Posisioning: **MELENGKAPI BigSeller**, bukan mengganti.
- BigSeller sudah urus listing/upload lintas platform (termasuk auto-upload ke Akulaku: scrape Shopee → edit gambar/harga → upload Akulaku).
- AkulakuDesk fokus ke hal yang BigSeller TIDAK kasih untuk Akulaku.

## TARGET USER
Akulaku dropshipper (tidak pegang stok). Loop bisnis:
Akulaku order → manual beli di Shopee (buru voucher buat margin) → supplier kirim → relay resi ke Akulaku → Akulaku cairkan duit setelah buyer lunasi cicilan (BNPL).

## MODUL (isi app)
1. **Login / Session** — embedded webview login ke ec-vendor.akulaku.com; app tahan session (cookie) agar chat tetap "online". Session terenkripsi lokal, password tidak di-cache.
2. **Chat (Live) — MONITOR SAJA** — daftar percakapan + thread realtime; indikator keep-online. TIDAK auto-kirim (Akulaku sudah punya native auto-reply). App hanya pantau & tampilkan pesan masuk.
3. **Produk** — dashboard read-only: nama, varian, harga, stok, status, views, terjual. (Bukan upload — itu urusan BigSeller.)
4. **Tren Kata Kunci** — scrape search Akulaku: top produk, naik/turun %, volume 7 hari, rekomendasi keyword.
5. **Order & Settlement (bonus)** — list order + status "uang cair" BNPL (Pending/Cair) + ringkasan cashflow.

## ARSITEKTUR
- WPF + WebView2/Playwright, session login ke ec-vendor.akulaku.com (pola sama kayak AWBDesktop).
- SQLite lokal untuk cache data.
- "Realtime" = polling tiap N detik (Akulaku tidak punya websocket publik).
- TIDAK ada API resmi Akulaku → pakai web scraping.

## RISIKO & MITIGASI
- Scraping = gray area / bisa langgar ToS Akulaku → akun bisa di-ban. Mitigasi: app lokal-only (tidak ada exfil data), polling pelan (mirip manusia), disclaimer ke pembeli.
- Keamanan: session terenkripsi, password tidak disimpan plaintext (penting karena dijual ke pembeli awam).

## FILE & STATUS
- Mock spec: /mnt/c/Users/AISHWA/Downloads/AkulakuDesk_mock_spec.md
- Mock HTML (belum dibuat): minta chat.z.ai generate dari spec di atas.

## NEXT STEPS (saat kembali)
1. Kirim AkulakuDesk_mock_spec.md ke chat.z.ai → minta 1 file HTML mockup interaktif.
2. Buka mock di browser, evaluasi alur & tampilan, catat yang kurang.
3. Balik ke Hermes → revisi spec / langsung build app sungguhan.
4. Urutan build: Modul 2 (Produk, paling gampang) atau Modul 1 (Chat, paling diinginkan).

## KEPUTUSAN KUNCI (sudah disepakati)
- Chat = monitor-only, auto-reply biarkan native Akulaku.
- TIDAK full-auto order routing (voucher hunting adalah strategi margin, tetap di tangan user).
- AkulakuDesk = semi-auto assistant (extract order → prefill Shopee) + real-margin calculator termasuk voucher — sebagai IDE terpisah, bukan inti dashboard.
