# AZMAYRA Link Bio

Halaman publik: `https://linkbio-azmayra-azmayra.vercel.app/`  
Editor: `https://linkbio-azmayra-azmayra.vercel.app/admin.html`

Alias `https://linkbio-azmayra-git-main-azmayra.vercel.app/` dialihkan ke alamat publik utama melalui `vercel.json`.

## Yang dapat diedit

Masuk ke editor, lalu untuk setiap link isi nama, URL, dan jenis tujuan. Pilih WhatsApp, landing page, Shopee, atau link lain. Untuk kartu Shopee, isi URL foto produk atau unggah gambar; foto yang diunggah diperkecil sebelum disimpan. Klik **Simpan Link Ini** pada setiap kartu. Hanya URL `https://` atau `http://` yang diterima. URL tanpa awalan akan diberi `https://`.

Tombol **Link Shopee** di halaman utama membuka `/shopee.html`. Di editor, klik **Tambah Produk Shopee**, isi nama produk, URL Shopee langsung, dan satu foto produk. Setiap entri Shopee muncul sebagai kartu foto tersendiri di halaman itu. Klik kartu membuka URL Shopee pada tab baru. Kartu awal **Toko Shopee AZMAYRA** memakai gambar logo dan tautan toko sebagai contoh yang dapat diganti.

Disiapkan **10 slot Shopee**: kartu toko aktif sementara dan sembilan draf produk. Draf tidak tampil ke pengunjung. Edit slot pertama menjadi produk pertama jika sudah ada foto dan URL produk, lalu aktifkan draf lainnya satu per satu. Editor mewajibkan URL serta foto sebelum sebuah produk Shopee boleh ditampilkan dan membatasi total kartu Shopee menjadi sepuluh.

## Pengaturan Vercel

Tambahkan variabel berikut pada project `linkbio-azmayra`, untuk Production dan Preview, lalu deploy ulang:

| Variabel | Isi |
| --- | --- |
| `LINKBIO_ADMIN_PASSWORD` | Kata sandi kuat khusus editor Link Bio |
| `SUPABASE_SERVICE_ROLE_KEY` | Kunci rahasia service role dari project Supabase **Azmayra Link Bio**; jangan taruh di HTML/GitHub |
| `SUPABASE_URL` | `https://lqhfdkggkmlorufswmhv.supabase.co` (opsional) |
| `META_PIXEL_ID` | ID dataset/pixel website yang ingin dipakai, hanya angka |
| `META_CAPI_ACCESS_TOKEN` | Token Conversions API untuk dataset/pixel yang sama, simpan hanya di Vercel |

Editor memerlukan dua variabel pertama. Tanpa `META_PIXEL_ID`, Pixel tidak memuat. Tanpa `META_CAPI_ACCESS_TOKEN`, event browser masih berjalan dan pengiriman server dinonaktifkan. Jangan memakai token Meta Social atau Meta Ads sebagai pengganti token CAPI.

## Logo dan warna

Logo AZMAYRA hijau sage dari gambar referensi disimpan di `assets/azmayra-mark.png`. Latar awal memakai warna turunan logo `#425941` dan `#718765` dari warna utama `#93A56F`. Di editor, unggah logo baru atau pilih emoji, lalu klik **Simpan Profil**. Pilih salah satu palet sage atau atur dua warna sendiri, periksa pratinjau, lalu klik **Simpan Wallpaper**. Foto background juga tetap bisa diunggah. Logo tampil pada bidang terang dan teks pada bidang gelap transparan agar terbaca di berbagai pilihan warna.

Project Supabase `lqhfdkggkmlorufswmhv` harus berstatus aktif. Migrasi `supabase-setup.sql` menambah jenis link dan foto produk serta menutup pembacaan analitik dari publik. Terapkan migrasi satu kali jika menyiapkan project baru.

## Peta event

| Aksi pengunjung | Meta event | Detail |
| --- | --- | --- |
| Buka halaman Link Bio | `PageView` browser | Tampilan halaman |
| Klik tombol WhatsApp | `Contact` browser + CAPI | Niat menghubungi, belum tentu percakapan terjadi |
| Klik link landing page | `LinkBioClick` browser + CAPI | Parameter `destination: lp` |
| Klik produk Shopee | `LinkBioClick` browser + CAPI | Parameter `destination: shopee`, belum tentu pembelian |
| Klik Link Shopee di halaman utama | `ShopeeCatalogOpen` browser + CAPI | Membuka halaman pilihan produk |
| Klik link lain | `LinkBioClick` browser + CAPI | Parameter `destination: other` |

Pixel dan CAPI memakai `event_id` yang sama pada satu klik agar Meta dapat menghapus duplikasi. Di Events Manager → Test Events, klik masing-masing jenis tautan dan pastikan event browser dan server muncul sebagai satu peristiwa. Untuk laporan terpisah, buat Custom Conversion dari `LinkBioClick` dengan aturan `destination = lp` atau `destination = shopee`. `Purchase` hanya dikirim saat transaksi benar-benar terkonfirmasi oleh sistem pesanan.

Kontrol akses editor ada pada endpoint `/api/admin`. Kunci service role dan token Meta hanya dibaca di server; browser hanya melihat ID Pixel yang bersifat publik.
