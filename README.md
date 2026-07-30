# Azmayra Linktree + Analitik Supabase

## Langkah Setup

### 1. Buat tabel di Supabase

Buka **Supabase Dashboard → SQL Editor**, jalankan isi file `supabase-setup.sql`.

### 2. Dapatkan kredensial Supabase

Di Supabase Dashboard → **Project Settings → API**:
- Copy `Project URL` → isi ke `SUPABASE_URL` di semua file
- Copy `anon public key` → isi ke `SUPABASE_ANON_KEY` di semua file

### 3. Deploy file

| File | Fungsi |
|------|--------|
| `index.html` | Halaman publik azmayra.com — yang dilihat pengunjung |
| `admin.html` | Panel editor + analitik — khusus kamu |
| `supabase-setup.sql` | SQL untuk membuat tabel di Supabase |

### 4. Upload ke hosting

Upload `index.html` ke root domain `azmayra.com`.
Upload `admin.html` ke `azmayra.com/admin` (proteksi dengan password server jika perlu).

---

## Cara kerja analitik

Setiap kali pengunjung klik link di `index.html`, sistem:
1. Mencatat klik ke tabel `link_clicks` di Supabase (link_id, label, url, jam klik)
2. `admin.html` membaca data nyata dari Supabase dan menampilkan grafik

Data yang dicatat per klik:
- `link_id` — ID link yang diklik
- `link_label` — nama link
- `clicked_at` — waktu klik (timestamp)
- `referrer` — dari mana pengunjung datang
