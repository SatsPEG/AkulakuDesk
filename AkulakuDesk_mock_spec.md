# AKULAKUDESK — INTERACTIVE MOCKUP SPEC (for chat.z.ai)

Tujuan: Buatkan 1 file HTML/CSS/JS **interaktif (mock, TANPA backend sungguhan)** yang mensimulasikan aplikasi desktop untuk seller/dropshipper Akulaku. Gunakan data contoh (FAKE) yang realistis. Bahasa UI: Indonesia. Tampilan rapi, profesional, seperti aplikasi desktop SaaS beneran (bukan terlihat seperti prototype mentah).

Nama App: **AkulakuDesk**
Tagline: "Pusat kendali toko Akulaku kamu — chat, produk, tren, & settlement dalam satu app."

---

## LAYOUT UTAMA
- **Sidebar kiri**: Logo "AkulakuDesk" + menu navigasi: Dashboard, Chat (Live), Produk, Tren Kata Kunci, Order & Settlement, Pengaturan
- **Top bar**: indikator "Session: ONLINE" (dot hijau), waktu sinkron terakhir, kotak search global
- **Konten utama**: berubah sesuai menu yang dipilih (klik navigasi = ganti view, tanpa reload)
- Tema: clean, light atau dark, font sans-serif, spasi rapi. Lebar layar desktop (misal 1200–1400px).

---

## MODUL 1 — LOGIN / SESSION
- Layar login: input Email + Kata Sandi + tombol "Login ke Akulaku Seller Center"
- Setelah "login" (mock): muncul indikator status **LIVE / ONLINE** (dot hijau berdenyut) di top bar.
- Keterangan: aplikasi MENAHAN session login agar status chat seller tetap "online" terus.
- Mock: klik Login → langsung masuk ke Dashboard (fake connected).

---

## MODUL 2 — CHAT (LIVE) — MONITOR SAJA, TIDAK AUTO-BALAS
- Layout: daftar percakapan di kiri, thread chat di kanan.
- Tiap percakapan: nama buyer, preview pesan terakhir, badge belum dibaca, waktu.
- Thread: bubble chat (buyer kiri, seller kanan), timestamp tiap pesan.
- Atas thread: info buyer (nama, kota, ref order).
- Banner jelas: "Auto-reply Aktif (bawaan Akulaku) — AkulakuDesk HANYA memantau, tidak mengirim."
- Indikator "Keep Online" berdenyut.
- **Flow simulasi**: setiap beberapa detik, muncul 1 pesan masuk baru dari buyer (mock) → notifikasi di daftar → seller bisa baca. Tidak ada tombol kirim otomatis.
- Tombol (mock/info): "Buka di Akulaku", "Tandai Dibaca".

---

## MODUL 3 — PRODUK (PRODUCT LIST)
- Tabel/grid kolom: # | Gambar | Nama Produk | Varian | Harga Jual | Stok | Status | Views | Terjual | Aksi
- Filter: search nama, filter Status (Aktif/Nonaktif), sort by Terjual / Views.
- Tiap baris: badge status (Hijau=Aktif, Abu=Nonaktif), angka stok, sparkline kecil untuk Views.
- Klik baris → panel detail: deskripsi, harga jual, fee Akulaku (mock %), margin (mock).
- Tombol "Sinkron" + teks "Terakhir sinkron: HH:MM".

---

## MODUL 4 — TREN KATA KUNCI (TREND KEYWORD)
- Input: text keyword + dropdown pilih kategori.
- Output:
  - List "Top Produk" untuk keyword tersebut: nama, harga, terjual, badge Naik/Turun (%).
  - Badge "Sedang Naik" untuk item tren naik.
  - Bar chart sederhana volume pencarian 7 hari terakhir.
  - Rekomendasi kata kunci terkait (tags).
- Mock: data tren sudah terisi (precomputed sample).

---

## MODUL 5 — ORDER & SETTLEMENT (BONUS)
- Tabel: Order ID | Produk | Buyer | Status | Cicilan | Uang Cair | Tanggal
- Kartu ringkasan: Total Pending, Total Cair, Estimasi Cashflow.
- Kolom "Uang Cair": status settlement BNPL (Belum Cair / Cair bulan X).
- Mock: beberapa order "Pending", beberapa "Cair".

---

## CATATAN UNTUK SIMULASI
- Semua data adalah CONTOH (fake), tapi harus terlihat realistis (nama produk, harga dalam Rp, dll).
- Interaktif: klik navigasi ganti view; klik baris produk buka detail; simulasi pesan chat masuk berjalan sendiri.
- Sertakan area "placeholder" / "segera hadir" untuk fitur yang belum final, agar mudah terlihat apa yang masih kurang.
- Hasil akhir: 1 file HTML mandiri (bisa dibuka di browser), tanpa perlu server.

## YANG INGIN DILIHAT DARI MOCK INI
Kami pakai mock ini hanya untuk melihat tampilan & alur, lalu mengevaluasi apa yang kurang / perlu diubah SEBELUM membangun aplikasi sungguhan. Jadi prioritaskan kejelasan alur (flow) antar modul dan kemudahan membaca informasi.
