# 🛒 Kasir Warung - Panduan Setup Lengkap

## ✅ Daftar File yang Perlu Dibuat

| File | Tipe | Keterangan |
|------|------|-----------|
| `Code.gs` | Script | Entry point utama |
| `Auth.gs` | Script | Autentikasi & sesi |
| `Database.gs` | Script | Manajemen spreadsheet |
| `Dashboard.gs` | Script | Dashboard + semua manager |
| `Menu.gs` | Script | Manajemen menu & kategori |
| `Transaksi.gs` | Script | Transaksi & invoice |
| `Utilities.gs` | Script | Helper functions |
| `index.html` | HTML | Halaman utama app |
| `styles.html` | HTML | CSS (dipanggil dari index) |
| `app_js.html` | HTML | JavaScript frontend |
| `appsscript.json` | Manifest | Konfigurasi project |

---

## 🚀 Langkah-Langkah Setup

### Langkah 1: Buat Google Spreadsheet
1. Buka [sheets.google.com](https://sheets.google.com)
2. Klik **"+ Blank"** untuk buat spreadsheet baru
3. Beri nama: **"Kasir Warung DB"**
4. Catat URL-nya (opsional, bisa digunakan terikat / bound)

### Langkah 2: Buka Google Apps Script
**Cara 1 (Bound ke Spreadsheet - DIREKOMENDASIKAN):**
1. Di spreadsheet yang baru dibuat, klik menu **Ekstensi → Apps Script**
2. Editor GAS akan terbuka otomatis terhubung ke spreadsheet

**Cara 2 (Standalone):**
1. Buka [script.google.com](https://script.google.com)
2. Klik **"New project"**

### Langkah 3: Buat File-File di GAS Editor

**Hapus file default:**
- Hapus isi `Code.gs` yang ada

**Buat/isi file `.gs`:**
1. Klik ikon **"+"** di panel kiri → pilih **Script**
2. Buat file untuk setiap `.gs` berikut:
   - `Code` → paste isi `Code.gs`
   - `Auth` → paste isi `Auth.gs`
   - `Database` → paste isi `Database.gs`
   - `Dashboard` → paste isi `Dashboard.gs`
   - `Menu` → paste isi `Menu.gs`
   - `Transaksi` → paste isi `Transaksi.gs`
   - `Utilities` → paste isi `Utilities.gs`

**Buat file HTML:**
1. Klik **"+"** → pilih **HTML**
2. Buat 3 file HTML:
   - `index` → paste isi `index.html`
   - `styles` → paste isi `styles.html`
   - `app_js` → paste isi `app_js.html`

### Langkah 4: Setup Database
1. Di GAS editor, klik tombol ▶ (Run)
2. Pilih function: **`resetAndSetup`**
3. Klik **Run**
4. Izinkan akses saat diminta (klik "Review permissions" → pilih akun → "Allow")
5. Tunggu hingga selesai — spreadsheet akan otomatis terisi dengan sheet & data contoh

### Langkah 5: Deploy sebagai Web App
1. Klik **Deploy → New deployment**
2. Klik ikon ⚙️ di sebelah "Select type" → pilih **Web app**
3. Isi pengaturan:
   - **Description:** Kasir Warung v1.0
   - **Execute as:** Me (your account)
   - **Who has access:** Anyone (untuk akses publik) atau Anyone with Google account
4. Klik **Deploy**
5. Salin URL Web App yang muncul → ini adalah link aplikasi Anda!

---

## 🔑 Akun Default

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin (akses penuh) |
| `kasir` | `kasir123` | Kasir (transaksi saja) |

> ⚠️ **Segera ganti password** setelah login pertama di menu Profil!

---

## 📱 Install ke Home Screen

**Android (Chrome):**
1. Buka URL Web App di Chrome
2. Ketuk menu **⋮** (tiga titik) → **"Add to Home screen"**
3. Beri nama lalu ketuk **Add**

**iPhone/iPad (Safari):**
1. Buka URL di Safari
2. Ketuk tombol Share **⬆️**
3. Gulir ke bawah → **"Add to Home Screen"**
4. Ketuk **Add**

**Desktop (Chrome/Edge):**
1. Klik ikon install di address bar
2. Atau Menu → **"Install Kasir Warung"**

---

## 🏗️ Struktur Sheet yang Dibuat Otomatis

Setelah `resetAndSetup`, spreadsheet akan memiliki sheet:

| Sheet | Keterangan |
|-------|-----------|
| `Menu` | Data menu dengan 5 contoh |
| `Transaksi` | Riwayat transaksi |
| `DetailTransaksi` | Detail item per transaksi |
| `BahanBaku` | 4 contoh bahan baku |
| `Resep` | Hubungan menu-bahan |
| `Pengeluaran` | Catatan pengeluaran |
| `Supplier` | 2 contoh supplier |
| `Kategori` | 4 kategori (Makanan, Minuman, dll) |
| `User` | Admin & Kasir default |

---

## ⚡ Fitur Lengkap

### Dashboard
- Total penjualan hari ini
- Jumlah transaksi
- Total pengeluaran
- Laba bersih estimasi
- Grafik penjualan 7 hari
- Produk terlaris
- Stok hampir habis
- Bahan baku kritis

### Kasir
- Cari menu realtime
- Filter kategori
- Keranjang belanja
- Diskon nominal
- 3 metode pembayaran (Tunai/QRIS/Transfer)
- Catatan transaksi
- Generate invoice otomatis
- Cetak struk
- Update stok otomatis

### Manajemen Menu
- CRUD lengkap
- Filter & pencarian
- Upload foto via URL
- Status aktif/nonaktif

### Laporan
- Harian / Mingguan / Bulanan / Kustom
- Laba-rugi sederhana
- Breakdown per metode pembayaran
- Export CSV

### Dan masih banyak lagi...
- Bahan Baku + Resep → stok otomatis berkurang
- Pengeluaran dengan filter tanggal
- Manajemen Supplier
- Manajemen User (Admin only)
- Dark mode
- Responsive mobile-first

---

## 🔧 Konfigurasi Opsional

### Jika menggunakan Spreadsheet terpisah (standalone script):
Di `Database.gs`, isi `SPREADSHEET_ID`:
```javascript
const SPREADSHEET_ID = 'ID_SPREADSHEET_ANDA_DISINI';
```
ID ada di URL: `https://docs.google.com/spreadsheets/d/**ID_INI**/edit`

### Timezone:
Di `appsscript.json`, pastikan:
```json
"timeZone": "Asia/Jakarta"
```

---

## ❓ Troubleshooting

**Q: "Script function not found"**
A: Pastikan semua file .gs sudah dibuat dan tidak ada typo nama fungsi.

**Q: Tidak bisa login**
A: Jalankan `resetAndSetup` dulu untuk membuat user default.

**Q: Data tidak tersimpan**
A: Pastikan script punya izin akses spreadsheet. Jalankan `setupDatabase` manual dulu.

**Q: Gambar menu tidak muncul**
A: Gunakan URL gambar yang bisa diakses publik (Google Drive public link, Imgur, dll).

**Q: Session timeout / harus login berulang**
A: Normal, sesi berlaku 6 jam. Login kembali dengan credentials yang sama.

---

## 📞 Dukungan

Aplikasi ini dibuat dengan Google Apps Script (gratis, tanpa hosting tambahan).
Data tersimpan aman di Google Spreadsheet akun Anda sendiri.

**Performa:** GAS memiliki quota free tier yang cukup untuk warung skala kecil-menengah (ratusan transaksi per hari).
