# Backend Live Monitoring Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membersihkan data contoh (dummy), menerapkan database bersih untuk input manual instansi, dan mengaktifkan mesin pemantau backend riil (`LiveMonitor`) yang melakukan pengujian HTTP/HTTPS, pengukuran latensi aktual, ekstraksi tanggal pembaruan konten (RSS/Atom, Sitemap XML, dan HTML metadata), eksekusi batch konkuren, penjadwalan berkala (cron) di waktu WITA, serta dukungan fleksibel untuk SQLite dan MySQL.

**Architecture:** 
1. Database dibersihkan dari 42 instansi dummy dan 14.440 checks contoh. Akun Super Admin `admin@diskominfo.go.id` dan pengaturan sistem dipertahankan.
2. Mesin pengecekan utama (`LiveMonitor`) mengimplementasikan interface `Monitor`. Ia menggunakan Laravel HTTP Client / Guzzle dengan timeout terukur untuk mengecek ketersediaan (uptime & HTTP code) dan latensi (response time ms).
3. Sub-sistem `ContentFreshnessParser` mengekstrak pembaruan tanggal konten dari 3 kanal berurutan: RSS/Atom feed, Sitemap XML (`<lastmod>`), dan fallback HTML metadata (`article:published_time`, `og:updated_time`, JSON-LD, `<time>`).
4. Pengklasifikasian status dilakukan oleh `StatusCalculator` yang telah ada, lalu menyimpan riwayat ke tabel `checks` dan memperbarui ringkasan pada model `Instansi`.
5. Eksekusi massal dijalankan secara konkuren (chunked HTTP pool / Queue Job) agar tombol "Cek Sekarang" dan cron scheduler tidak mengalami bottleneck atau web timeout.

**Tech Stack:** PHP 8.3, Laravel 11/13 HTTP Client (`Illuminate\Support\Facades\Http`), GuzzleHttp, SimpleXML / DOMDocument, CarbonImmutable (WITA timezone), SQLite & MySQL.

---

## Global Constraints

- Waktu dan tanggal pengecekan wajib konsisten dengan zona waktu WITA (`Asia/Makassar`).
- Tidak boleh memblokir web request terlalu lama; pengecekan seluruh instansi harus mendukung batching / concurrency (`Http::pool()` atau Laravel Queue).
- Toleransi terhadap sertifikat SSL instansi pemerintah daerah yang bermasalah (fitur `withoutVerifying()` atau penanganan graceful exception agar tidak langsung fatal crash).
- Tetap mematuhi interface `App\Monitoring\Monitor` sehingga kontroler, seeder, dan middleware yang sudah ada tidak mengalami regresi.
- Seluruh kode backend harus memiliki unit/feature test (Pest/PHPUnit) dengan cakupan skenario sukses, timeout, kegagalan SSL, feed parsing, sitemap parsing, dan command scheduler.

---

## Review Focus

1. **Timeout Jaringan / Host Tidak Ditemukan**: Website yang mati total atau domain kedaluwarsa tidak boleh menggagalkan proses pengecekan instansi lainnya; harus tercatat sebagai status `tidak-aktif` dengan pesan error yang jelas (misal: "Connection timeout setelah 10s").
2. **Format Tanggal RSS / Sitemap yang Tidak Standar**: Feed yang menggunakan format tanggal non-ISO/non-RFC (atau bahasa Indonesia) harus ditangani tanpa memicu uncaught exception.
3. **Eksekusi Batch 40+ Instansi**: Jika seluruh 42 instansi dicek sekaligus lewat tombol "Cek Sekarang", proses tidak boleh terkena `max_execution_time` PHP.
4. **Perubahan Status & Pelacakan `down_since`**: Saat instansi beralih dari Aktif ke Tidak Aktif, `down_since` harus diisi timestamp saat itu; saat kembali pulih, `down_since` harus dibersihkan (`null`).
5. **Dukungan Multi-Database (SQLite & MySQL)**: Query pelaporan dan agregasi tidak boleh menggunakan dialek spesifik yang rusak saat user beralih dari SQLite ke MySQL.

---

## Task Decomposition (6 Tasks)

### Task 1: Pembersihan Data Contoh & Inisialisasi Database Bersih (Clean Slate)
Mengosongkan 42 instansi contoh dan seluruh log check dummy, mempertahankan akun Super Admin (`admin@diskominfo.go.id`) dan pengaturan sistem, serta menghapus badge "Data contoh" dari UI.

**Files:**
- Create: `database/seeders/CleanProductionSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`
- Modify: `app/Http/Middleware/HandleInertiaRequests.php`
- Test: `tests/Feature/CleanProductionDatabaseTest.php`

- [ ] **Step 1: Buat test `CleanProductionDatabaseTest` untuk memastikan data instansi kosong dan user admin aktif**
- [ ] **Step 2: Implementasikan `CleanProductionSeeder` yang hanya membuat akun Super Admin dan default Settings**
- [ ] **Step 3: Update `DatabaseSeeder` agar menjalankan seeder bersih**
- [ ] **Step 4: Update `HandleInertiaRequests` agar badge `isSampleData` false saat di mode produksi**
- [ ] **Step 5: Jalankan migrasi dan seeder bersih (`php artisan migrate:fresh --seed`)**
- [ ] **Step 6: Jalankan test dan commit perubahan Task 1**

---

### Task 2: Parser Pembaruan Konten (`ContentFreshnessParser`)
Membangun parser multi-kanal untuk mendeteksi tanggal pembaruan konten terbaru dari RSS, Sitemap XML, dan HTML metadata.

**Files:**
- Create: `app/Monitoring/Parsers/ContentFreshnessParser.php`
- Create: `app/Monitoring/Parsers/FeedParser.php`
- Create: `app/Monitoring/Parsers/SitemapParser.php`
- Create: `app/Monitoring/Parsers/HtmlMetaParser.php`
- Test: `tests/Unit/Monitoring/ContentFreshnessParserTest.php`

**Interfaces:**
- Produces: `ContentFreshnessParser::parse(string $htmlOrXml, ?string $feedUrl = null, array $headers = []): ?CarbonImmutable`

- [ ] **Step 1: Tulis unit test untuk FeedParser, SitemapParser, dan HtmlMetaParser**
- [ ] **Step 2: Jalankan test untuk memastikan test gagal (Red)**
- [ ] **Step 3: Implementasikan `FeedParser` (RSS & Atom XML parsing)**
- [ ] **Step 4: Implementasikan `SitemapParser` (Sitemap XML `<lastmod>` extraction)**
- [ ] **Step 5: Implementasikan `HtmlMetaParser` (OpenGraph, Article metadata, JSON-LD, Last-Modified header)**
- [ ] **Step 6: Implementasikan `ContentFreshnessParser` sebagai orchestrator strategi deteksi**
- [ ] **Step 7: Jalankan test kembali dan pastikan seluruh test lulus (Green)**
- [ ] **Step 8: Commit perubahan Task 2**

---

### Task 3: Mesin Pemantau HTTP Riil (`LiveMonitor`)
Mengimplementasikan interface `Monitor` dengan panggilan HTTP aktual, pengukuran latensi millisecond, penanganan timeout & kegagalan koneksi, serta update status instansi.

**Files:**
- Create: `app/Monitoring/LiveMonitor.php`
- Test: `tests/Unit/Monitoring/LiveMonitorTest.php`
- Modify: `app/Providers/AppServiceProvider.php`
- Create: `config/monitoring.php`

**Interfaces:**
- Consumes: `App\Monitoring\Monitor`, `App\Monitoring\Parsers\ContentFreshnessParser`, `App\Monitoring\StatusCalculator`
- Produces: `LiveMonitor::check(Instansi $instansi, ?CarbonInterface $at = null): Check`

- [ ] **Step 1: Tulis test `LiveMonitorTest` menggunakan `Http::fake()` untuk simulasi HTTP 200, HTTP 500, Timeout, dan SSL Exception**
- [ ] **Step 2: Jalankan test dan pastikan gagal**
- [ ] **Step 3: Buat konfigurasi `config/monitoring.php` untuk timeout, driver default, user-agent Diskominfo, dan opsi SSL**
- [ ] **Step 4: Implementasikan `LiveMonitor` lengkap dengan timer respon, try-catch connection exceptions, parsing tanggal konten, dan persistensi ke tabel `checks` & `instansi`**
- [ ] **Step 5: Daftarkan driver di `AppServiceProvider` berdasarkan `config('monitoring.driver')` (default `live`)**
- [ ] **Step 6: Jalankan test dan pastikan semua skenario lulus**
- [ ] **Step 7: Commit perubahan Task 3**

---

### Task 4: Eksekutor Batch Konkuren & Queue Job
Mencegah request blocking saat pengecekan banyak instansi sekaligus menggunakan `Http::pool()` dan Queue Job.

**Files:**
- Create: `app/Jobs/CheckInstansiJob.php`
- Create: `app/Monitoring/BatchMonitorRunner.php`
- Modify: `app/Http/Controllers/InstansiCheckController.php`
- Test: `tests/Feature/BatchMonitoringTest.php`

**Interfaces:**
- Produces: `BatchMonitorRunner::runAll(bool $async = false): int`
- Consumes: `App\Jobs\CheckInstansiJob`, `App\Monitoring\LiveMonitor`

- [ ] **Step 1: Tulis feature test untuk pengecekan satu instansi dan seluruh instansi secara paralel/antrean**
- [ ] **Step 2: Implementasikan `CheckInstansiJob` untuk pemrosesan asynchronous di background worker**
- [ ] **Step 3: Implementasikan `BatchMonitorRunner` yang dapat mengecek pool instansi secara chunked concurrent**
- [ ] **Step 4: Perbarui `InstansiCheckController` untuk menggunakan `BatchMonitorRunner` sehingga klik "Cek Sekarang" di UI merespons cepat tanpa timeout**
- [ ] **Step 5: Jalankan test dan pastikan seluruh test lulus**
- [ ] **Step 6: Commit perubahan Task 4**

---

### Task 5: Artisan Command & Penjadwalan Otomatis (Cron WITA)
Menyediakan perintah CLI untuk monitoring dan mendaftarkan jadwal rutin sesuai zona waktu WITA.

**Files:**
- Create: `app/Console/Commands/RunMonitoringCheck.php`
- Modify: `routes/console.php`
- Test: `tests/Feature/Console/RunMonitoringCheckCommandTest.php`

**Interfaces:**
- Produces: `php artisan monitor:check {instansi_id?}` dan `php artisan monitor:run`

- [ ] **Step 1: Tulis test untuk command `monitor:run` dan `monitor:check`**
- [ ] **Step 2: Implementasikan command `RunMonitoringCheck` dengan progress bar dan ringkasan status di CLI terminal**
- [ ] **Step 3: Daftarkan jadwal di `routes/console.php` yang berjalan sesuai interval pengaturan (`Setting::get('check_interval_hours')` atau jam 02:00, 08:00, 14:00, 20:00 WITA)**
- [ ] **Step 4: Jalankan test dan uji coba command via artisan**
- [ ] **Step 5: Commit perubahan Task 5**

---

### Task 6: Panduan Konfigurasi Database (MySQL & SQLite) dan Uji Akhir Integrasi
Memastikan kompatibilitas penuh skema database saat user ingin beralih dari SQLite ke MySQL, serta verifikasi end-to-end seluruh sistem backend.

**Files:**
- Create: `docs/DATABASE_SETUP.md`
- Modify: `.env.example`
- Test: `tests/Feature/EndToEndLiveMonitoringTest.php`

- [ ] **Step 1: Tulis dokumentasi langkah-langkah pengaturan database MySQL di `docs/DATABASE_SETUP.md`**
- [ ] **Step 2: Pastikan file `.env.example` memiliki konfigurasi database dan monitoring yang jelas**
- [ ] **Step 3: Tulis pengujian integrasi akhir `EndToEndLiveMonitoringTest`**
- [ ] **Step 4: Jalankan seluruh test suite (`php artisan test` & frontend test)**
- [ ] **Step 5: Commit perubahan Task 6**
