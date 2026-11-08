# Panduan Konfigurasi Database (SQLite & MySQL) dan Mesin Monitoring Riil

Aplikasi **Monitoring Website Dinas — Diskominfo Kabupaten Hulu Sungai Utara (Amuntai)** mendukung penuh penyimpanan data menggunakan **SQLite** (aktif secara bawaan untuk kemudahan jalan instan) maupun **MySQL / MariaDB** (Laragon / XAMPP / Server Produksi).

---

## 1. Beralih dari SQLite ke MySQL (Laragon / Server)

1. Buat database baru di MySQL (misalnya melalui phpMyAdmin, HeidiSQL, atau terminal MySQL):
   ```sql
   CREATE DATABASE monitoring_website_dinas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Buka file `.env` di direktori utama proyek, lalu ubah bagian koneksi database menjadi:
   ```dotenv
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=monitoring_website_dinas
   DB_USERNAME=root
   DB_PASSWORD=
   ```

3. Jalankan migrasi dan seeder produksi bersih (tanpa data contoh):
   ```bash
   php artisan migrate:fresh --seed
   ```

---

## 2. Akun Login Super Admin Bawaan

Setelah menjalankan `php artisan migrate:fresh --seed`, tabel `instansi` dan `checks` akan **kosong bersih** (0 data contoh) sehingga Anda dapat langsung menginput website instansi secara manual melalui tombol **+ Tambah Instansi**.

Akun Super Admin yang tersedia:
- **Email**: `admin@diskominfo.go.id` (atau `admin@diskominfo.test`)
- **Password**: `password`

*(Disarankan segera mengganti kata sandi melalui menu **Pengaturan** setelah login pertama).*

---

## 3. Konfigurasi Mesin Pemantau Riil (`LiveMonitor`)

Variabel lingkungan opsional yang dapat disesuaikan di `.env`:

```dotenv
# Driver pemantauan: "live" (koneksi HTTP riil) atau "fake" (simulasi)
MONITOR_DRIVER=live

# Batas waktu tunggu per website (detik)
MONITOR_TIMEOUT=10
MONITOR_CONNECT_TIMEOUT=5

# Verifikasi sertifikat SSL (false = tetap memantau meskipun sertifikat SSL pemda kedaluwarsa/self-signed)
MONITOR_VERIFY_SSL=false

# Jumlah website yang dicek secara paralel bersamaan dalam satu gelombang
MONITOR_CONCURRENCY=8
```

---

## 4. Perintah Terminal (Artisan CLI) & Penjadwalan Otomatis (Cron WITA)

- **Mengecek seluruh website instansi sekaligus via terminal**:
  ```bash
  php artisan monitor:run
  ```
- **Mengirim pengecekan seluruh instansi ke antrean background (Queue)**:
  ```bash
  php artisan monitor:run --queue
  ```
- **Mengecek satu instansi spesifik (berdasarkan ID atau URL)**:
  ```bash
  php artisan monitor:check 1
  php artisan monitor:check https://diskominfo.hsu.go.id
  ```
- **Menjalankan penjadwal otomatis (berjalan pukul 02:00, 08:00, 14:00, dan 20:00 WITA)**:
  ```bash
  php artisan schedule:work
  ```
