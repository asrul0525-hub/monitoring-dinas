# Frontend & Navigasi Monitoring Website Dinas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun seluruh antarmuka (Login, Dashboard, Instansi, Detail, Laporan + export, Log, Pengaturan) di atas Laravel + Inertia + React dengan database berisi data contoh dan service monitor tiruan, sehingga fase backend cukup mengganti `FakeMonitor`.

**Architecture:** Tiga layar inti didesain dulu di Stitch dan dirangkum ke `DESIGN.md` (ada gerbang review user). Setelah itu, Laravel React starter kit menjadi kerangka. Controller membaca database lalu mengirim props Inertia yang sudah terfilter di server. Status dihitung di backend oleh `StatusCalculator`, sedangkan data riwayat dibuat oleh `FakeMonitor` lewat interface `Monitor`.

**Tech Stack:** Laravel (versi terbaru dari `laravel new --react`), Inertia, React + TypeScript, Tailwind, Recharts, TanStack Table, date-fns (locale `id`), barryvdh/laravel-dompdf, maatwebsite/excel, Pest (PHP), Vitest + Testing Library (TS).

**Spec:** `docs/superpowers/specs/2026-11-07-frontend-ui-navigation-design.md`

## Global Constraints

- Bahasa antarmuka: Bahasa Indonesia.
- Desktop saja, lebar minimum 1366px. Tidak ada breakpoint mobile.
- Tiga status dengan nilai string tetap: `aktif`, `kurang-aktif`, `tidak-aktif`. Instansi yang belum pernah dicek berstatus `null` dan ditampilkan sebagai "Menunggu cek pertama" (abu-abu).
- Label status: "Aktif" (hijau), "Kurang Aktif" (kuning), "Tidak Aktif" (merah). Warna selalu disertai label teks.
- Ambang freshness default 30 hari, bisa diubah di Pengaturan.
- Frontend tidak menghitung status. Status datang dari props.
- Filter, pencarian, dan paginasi dikerjakan di server lewat query string: `/instansi?status=&q=`, `/laporan?instansi[]=&dari=&sampai=&status=`.
- Efek kaca hanya di top bar, rail kiri, tab status bawah, dan panel form. Tabel Instansi/Laporan/Log memakai panel hampir solid.
- Teks kontras ≥ 4.5:1, segmen chart dan warna status ≥ 3:1 terhadap latar.
- Nama instansi data contoh: "Dinas Contoh 01" … "Dinas Contoh 40". Tidak memakai nama SKPD asli.
- Penanda "Data contoh" tampil di top bar selama `Monitor` di-bind ke `FakeMonitor`.
- Tidak ada registrasi, reset password, atau verifikasi email.

## Review Focus

1. **Instansi baru tanpa riwayat cek:** status `null` harus tampil "Menunggu cek pertama" di semua halaman, tidak dihitung di doughnut, dan tidak membuat halaman crash. Tes ada di Task 6, 7, 8, dan 9.
2. **Database kosong (pertama kali dipakai):** Dashboard dan Instansi menampilkan empty state berisi tombol Tambah, bukan error atau chart kosong. Tes ada di Task 6 dan 7.
3. **URL tanpa skema / duplikat:** `dinas.go.id` dinormalisasi menjadi `https://dinas.go.id`, dan URL yang sudah terdaftar ditolak dengan pesan berbahasa Indonesia. Tes ada di Task 7.
4. **Rentang tanggal Laporan terbalik (`dari` > `sampai`):** ditolak dengan pesan validasi. Untuk filter yang tidak menghasilkan baris, export tetap menghasilkan file berisi header dan keterangan "Tidak ada data". Tes ada di Task 9 dan 10.
5. **Hapus instansi:** riwayat ceknya ikut terhapus (cascade), dan halaman Detail untuk id tersebut mengembalikan 404. Tes ada di Task 7.

---

## File Structure

```
app/
  Enums/Status.php                      enum string: Aktif, KurangAktif, TidakAktif
  Enums/ContentSource.php               enum string: Sitemap, Rss, Dom
  Models/Instansi.php, Check.php, Setting.php
  Monitoring/Monitor.php                interface
  Monitoring/FakeMonitor.php            implementasi tiruan
  Monitoring/StatusCalculator.php       aturan 3 status
  Monitoring/RecalculateStatuses.php    hitung ulang semua instansi dari check terakhir
  Reports/ReportQuery.php               agregasi Laporan
  Exports/ReportExport.php              Excel
  Http/Controllers/{Dashboard,Instansi,InstansiCheck,Report,ReportExport,Log,MonitorSettings,AlertSeen}Controller.php
  Http/Requests/{InstansiRequest,ReportFilterRequest}.php
  Http/Middleware/HandleInertiaRequests.php   (modify: shared props)
database/migrations/…, factories/…, seeders/DatabaseSeeder.php, SampleDataSeeder.php
resources/views/reports/pdf.blade.php    layout cetak PDF
resources/js/
  types/monitoring.ts                   tipe props bersama
  lib/format.ts                         formatRelativeId, formatMs
  components/shell/{AppShell,TopBar,RailNav,StatusTabs,AlertBell,ThemeToggle}.tsx
  components/status/{StatusBadge,FreshnessText}.tsx
  components/instansi/{InstansiTable,InstansiFormPanel,DeleteInstansiDialog}.tsx
  components/charts/{StatusDoughnut,ResponseTimeLine}.tsx
  pages/{dashboard,laporan,log,pengaturan}.tsx, pages/instansi/{index,show}.tsx
  styles/tokens.css                     design token dark + light
DESIGN.md
```

## Shared Interfaces (dipakai banyak task)

PHP:
- `enum App\Enums\Status: string { case Aktif = 'aktif'; case KurangAktif = 'kurang-aktif'; case TidakAktif = 'tidak-aktif'; public function label(): string; }`
- `interface App\Monitoring\Monitor { public function check(Instansi $instansi): Check; }`, yang membuat, menyimpan, dan mengembalikan `Check` lalu memperbarui kolom ringkasan di `Instansi`.
- `Setting::get(string $key, mixed $default = null): mixed`, `Setting::put(string $key, mixed $value): void`. Key yang dipakai: `freshness_days` (int, default 30) dan `check_interval_hours` (int, default 6).

TypeScript (`resources/js/types/monitoring.ts`):
```ts
export type StatusKey = 'aktif' | 'kurang-aktif' | 'tidak-aktif';
export interface InstansiRow {
  id: number; nama: string; url: string; feedUrl: string | null;
  status: StatusKey | null; lastContentAt: string | null; lastCheckedAt: string | null;
  lastResponseMs: number | null; lastHttpCode: number | null;
  contentSource: 'sitemap' | 'rss' | 'dom' | null; downSince: string | null;
}
export interface StatusCounts { aktif: number; 'kurang-aktif': number; 'tidak-aktif': number; menunggu: number; }
export interface SharedProps { auth: { user: { name: string } }; schedule: { lastCheckAt: string | null; nextCheckAt: string | null };
  alerts: { count: number; items: Pick<InstansiRow, 'id' | 'nama' | 'downSince'>[] }; isSampleData: boolean; statusCounts: StatusCounts; }
```
Serialisasi PHP→TS dibuat lewat `Instansi::toRow(): array`, dengan key camelCase persis seperti `InstansiRow`.

---

## Phase 0 — Desain di Stitch

### Task 1: Project Stitch, 3 layar inti, dan `DESIGN.md` (GERBANG REVIEW)

**Files:**
- Create: `DESIGN.md`
- Create: `docs/design/stitch/{dashboard,instansi,laporan}.png` (screenshot hasil Stitch)

- [ ] **Step 1:** Baca skill `stitch::generate-design` dan `enhance-prompt`. Buat project Stitch "Monitoring Website Dinas". Sertakan gambar referensi milik user (`.user_uploaded/media_1794052649643_2c415ee6.jpg` di folder brain) sebagai acuan gaya: top bar pill, rail ikon vertikal, tab pill bawah, dalam dark mode dengan latar gradien navy ke hampir hitam.
- [ ] **Step 2:** Generate layar **Dashboard** sesuai spec §6.2. Kartu: doughnut "Status 40 dari 42 website per cek terakhir", "Perlu perhatian", Top 5 tercepat, Top 5 paling usang, ringkasan jadwal. Tab status di bawah. Isi teks memakai "Dinas Contoh NN".
- [ ] **Step 3:** Generate layar **Instansi** sesuai spec §6.3, dengan panel form terbuka di kanan. Generate juga layar **Laporan** sesuai spec §6.5. Gunakan design system yang sama.
- [ ] **Step 4:** Baca skill `design-md`, lalu tulis `DESIGN.md`. Isinya: palet (netral, satu aksen, tiga warna status beserta rasio kontrasnya), aturan kaca (hanya di empat elemen shell), radius (pill / sedang / kecil), tipografi beserta alasannya, elevasi, dan token light mode sebagai pasangan nilai.
- [ ] **Step 5:** Verifikasi kontras warna status dan teks dengan contrast checker dari skill `antislop-human`. Hasil yang diharapkan: semua pasangan memenuhi batas di Global Constraints.
- [ ] **Step 6:** Simpan screenshot, lalu commit `DESIGN.md` dan `docs/design/`.
- [ ] **Step 7: BERHENTI.** Tunjukkan 3 layar dan `DESIGN.md` ke user. Lanjut ke Task 2 hanya setelah user menyetujui. Revisi dikerjakan di Stitch sebelum lanjut.

---

## Phase 1 — Kerangka & Data

### Task 2: Scaffold starter kit, repo sendiri, dan auth satu akun

**Files:**
- Create: seluruh scaffold Laravel di root project (`c:\Users\ASUS\Music\monitoring-website-dinas`)
- Modify: route/konfigurasi auth bawaan kit (Fortify features atau `routes/auth.php`, tergantung yang dipakai kit)
- Test: `tests/Feature/AuthTest.php`

**Interfaces:**
- Produces: user Super Admin dari seeder (`admin@diskominfo.test` / password dari `.env` `ADMIN_PASSWORD`, default `password` untuk lokal), route `login`, `logout`, `dashboard` (`/`).

- [ ] **Step 1:** Jalankan `git init` di folder project. Wajib dilakukan karena repo di `C:\Users\ASUS` tidak boleh tersentuh. Pastikan `git rev-parse --show-toplevel` menghasilkan path project.
- [ ] **Step 2:** Scaffold dengan `laravel new` memakai React starter kit, Pest, dan SQLite, di folder sementara, lalu pindahkan isinya ke root project tanpa menimpa `docs/` dan `DESIGN.md`. Catat versi Laravel dan mekanisme auth kit di `docs/superpowers/notes.md`.
- [ ] **Step 3:** Tulis tes yang gagal:
```php
it('tidak menyediakan registrasi', fn () => $this->get('/register')->assertNotFound());
it('tidak menyediakan reset password', fn () => $this->get('/forgot-password')->assertNotFound());
it('mengarahkan tamu ke login', fn () => $this->get('/')->assertRedirect('/login'));
it('admin bisa login dan masuk dashboard', function () {
    $user = User::factory()->create();
    $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect('/');
});
```
- [ ] **Step 4:** Jalankan `php artisan test --filter=AuthTest`. Hasil yang diharapkan: tes registrasi dan reset FAIL.
- [ ] **Step 5:** Matikan registrasi, reset password, dan verifikasi email. Hapus juga halaman React terkait beserta linknya. Pindahkan dashboard ke `/`.
- [ ] **Step 6:** Jalankan ulang tes, hasil yang diharapkan PASS. Jalankan juga `php artisan test` dan pastikan seluruh tes kit yang tersisa PASS. Tes kit untuk fitur yang dihapus ikut dihapus.
- [ ] **Step 7:** Commit `chore: scaffold laravel react kit, auth satu akun`.

### Task 3: Skema, model, dan data contoh

**Files:**
- Create: migrasi `instansi`, `checks`, `settings`, kolom `users.alerts_seen_at`; `app/Enums/Status.php`, `ContentSource.php`; `app/Models/Instansi.php`, `Check.php`, `Setting.php`; factory; `database/seeders/SampleDataSeeder.php`
- Test: `tests/Feature/SchemaTest.php`

**Interfaces:**
- Produces:
  - Tabel `instansi`: `id`, `nama` (string), `url` (string, unique), `feed_url` (nullable), `status` (nullable, cast `Status`), `last_checked_at`, `last_content_at`, `last_response_ms`, `last_http_code`, `content_source` (cast `ContentSource`), `down_since` (semua nullable), timestamps.
  - Tabel `checks`: `id`, `instansi_id` (FK cascade on delete), `checked_at`, `http_code` (nullable, null = timeout), `response_ms` (nullable), `content_date` (nullable), `content_source` (nullable), `status` (cast `Status`), `error` (nullable string). Index `(instansi_id, checked_at)`.
  - `settings`: `key` (primary), `value` (json).
  - Relasi `Instansi::checks(): HasMany` dan `Instansi::toRow(): array`.

- [ ] **Step 1:** Tulis tes yang gagal:
```php
it('menghapus riwayat saat instansi dihapus', function () {
    $i = Instansi::factory()->has(Check::factory()->count(3))->create();
    $i->delete();
    expect(Check::count())->toBe(0);
});
it('toRow memakai key camelCase dan status null untuk instansi baru', function () {
    $row = Instansi::factory()->create(['status' => null])->toRow();
    expect($row)->toHaveKeys(['id','nama','url','feedUrl','status','lastContentAt','lastCheckedAt','lastResponseMs','lastHttpCode','contentSource','downSince'])
        ->and($row['status'])->toBeNull();
});
it('Setting::get mengembalikan default 30 untuk freshness_days', fn () => expect(Setting::get('freshness_days', 30))->toBe(30));
```
- [ ] **Step 2:** Jalankan tes, hasil yang diharapkan FAIL.
- [ ] **Step 3:** Implementasikan migrasi, enum, model, dan factory. `Status::label()` mengembalikan "Aktif", "Kurang Aktif", atau "Tidak Aktif".
- [ ] **Step 4:** Jalankan tes, hasil yang diharapkan PASS.
- [ ] **Step 5:** Commit `feat: skema instansi, checks, settings`. Seeder data contoh dibuat di Task 4 karena membutuhkan `FakeMonitor`.

### Task 4: StatusCalculator, FakeMonitor, dan hitung ulang

**Files:**
- Create: `app/Monitoring/{Monitor,FakeMonitor,StatusCalculator,RecalculateStatuses}.php`; `app/Http/Controllers/InstansiCheckController.php`
- Modify: `app/Providers/AppServiceProvider.php` (bind `Monitor` → `FakeMonitor`), `routes/web.php`
- Test: `tests/Unit/StatusCalculatorTest.php`, `tests/Feature/MonitorTest.php`

**Interfaces:**
- Produces:
  - `StatusCalculator::classify(?int $httpCode, ?CarbonInterface $contentDate, CarbonInterface $now, int $freshnessDays): Status`
  - `FakeMonitor::check(Instansi $instansi, ?CarbonInterface $at = null): Check`. Parameter `$at` dipakai seeder.
  - `RecalculateStatuses::__invoke(): void`
  - Route `POST /instansi/{instansi}/cek` → `instansi.cek` dan `POST /cek-semua` → `cek.semua`. Keduanya redirect back dengan flash `status`.

- [ ] **Step 1:** Tulis tes unit yang gagal (`$now = 2026-11-07`, ambang 30):
```php
it('aktif bila 200 dan konten 30 hari lalu', fn () => expect(classify(200, $now->subDays(30)))->toBe(Status::Aktif));
it('kurang aktif bila 200 dan konten 31 hari lalu', fn () => expect(classify(200, $now->subDays(31)))->toBe(Status::KurangAktif));
it('kurang aktif bila 200 dan tanggal konten tidak ditemukan', fn () => expect(classify(200, null))->toBe(Status::KurangAktif));
it('tidak aktif untuk 404, 500, 502, timeout', fn ($code) => expect(classify($code, $now))->toBe(Status::TidakAktif))->with([404, 500, 502, null]);
it('memakai ambang dari parameter', fn () => expect(classify(200, $now->subDays(10), freshnessDays: 7))->toBe(Status::KurangAktif));
```
Catatan keputusan: konten tidak ditemukan + HTTP 200 = Kurang Aktif. Ini keputusan sementara untuk fase ini dan bisa diubah di fase backend.
- [ ] **Step 2:** Jalankan tes, hasil yang diharapkan FAIL. Implementasikan `classify`, lalu jalankan ulang dan pastikan PASS.
- [ ] **Step 3:** Tulis tes feature yang gagal: `POST /instansi/{id}/cek` membuat tepat 1 `Check` baru, memperbarui `last_checked_at`, dan mengisi `down_since` saat status berubah ke `tidak-aktif` (dikosongkan saat pulih). `RecalculateStatuses` setelah `Setting::put('freshness_days', 7)` mengubah instansi berkonten 10 hari menjadi `kurang-aktif`. Tamu yang memanggil `POST /cek-semua` diarahkan ke login.
- [ ] **Step 4:** Implementasikan `FakeMonitor`. Distribusi acak yang di-seed per instansi supaya stabil: kira-kira 70% instansi cenderung aktif, 20% usang, dan 10% sering down. Response time 150–3000 ms dan timeout = `http_code` null dengan `error` "Timeout 30 detik". Jalankan tes, hasil yang diharapkan PASS.
- [ ] **Step 5:** Tulis `SampleDataSeeder`. Isinya admin, 40 instansi "Dinas Contoh 01–40" dengan URL `https://dinas-contoh-NN.go.id`, dan riwayat cek setiap 6 jam selama 90 hari ke belakang yang dibuat lewat `FakeMonitor::check($i, $at)`. Tambahkan juga 2 instansi tanpa riwayat (status `null`). `DatabaseSeeder` memanggilnya. Jalankan `php artisan migrate:fresh --seed`, hasil yang diharapkan sukses dan `Instansi::count() === 42`.
- [ ] **Step 6:** Commit `feat: status calculator, fake monitor, cek manual, data contoh`.

---

## Phase 2 — Shell & Halaman

### Task 5: Design token, App Shell, dan shared props

**Files:**
- Create: `resources/js/styles/tokens.css`, `resources/js/components/shell/*`, `resources/js/components/status/{StatusBadge,FreshnessText}.tsx`, `resources/js/lib/format.ts`, `resources/js/types/monitoring.ts`
- Modify: `app/Http/Middleware/HandleInertiaRequests.php`, layout kit (ganti sidebar kit dengan `AppShell`)
- Test: `tests/Feature/SharedPropsTest.php`, `resources/js/lib/format.test.ts`, `resources/js/components/status/StatusBadge.test.tsx`

**Interfaces:**
- Consumes: `Status`, `Setting`, `Instansi` (Task 3)
- Produces: `SharedProps` (lihat Shared Interfaces), `formatRelativeId(iso: string, now?: Date): string`, `formatMs(ms: number | null): string`, `<StatusBadge status={StatusKey | null} />`, `<FreshnessText row={InstansiRow} />`, `<AppShell title: string, showStatusTabs?: boolean>`

- [ ] **Step 1:** Pasang Vitest + Testing Library + jsdom dan script `npm run test`. Tulis tes yang gagal:
```ts
expect(formatRelativeId('2026-11-05T10:00:00Z', new Date('2026-11-07T10:00:00Z'))).toBe('2 hari yang lalu');
expect(formatRelativeId('2026-07-07T10:00:00Z', new Date('2026-11-07T10:00:00Z'))).toBe('4 bulan yang lalu');
expect(formatMs(null)).toBe('—');
// StatusBadge
render(<StatusBadge status={null} />); expect(screen.getByText('Menunggu cek pertama')).toBeInTheDocument();
render(<StatusBadge status="kurang-aktif" />); expect(screen.getByText('Kurang Aktif')).toBeInTheDocument();
```
`FreshnessText` menampilkan "Terakhir update: {relatif}". Jika status `tidak-aktif`, isinya "Down sejak {relatif}". Jika `lastContentAt` null dan sudah pernah dicek, isinya "Tanggal konten tidak ditemukan".
- [ ] **Step 2:** Tulis tes PHP yang gagal: shared props `statusCounts` untuk 42 instansi seed (2 menunggu) berjumlah total 42 dengan `menunggu === 2`. `isSampleData` bernilai true saat `Monitor` di-bind ke `FakeMonitor`. `alerts.items` hanya berisi instansi dengan `down_since > users.alerts_seen_at` (null = semua yang sedang down).
- [ ] **Step 3:** Jalankan `npm run test` dan `php artisan test`, hasil yang diharapkan FAIL. Implementasikan, lalu jalankan ulang dan pastikan PASS.
- [ ] **Step 4:** Bangun `AppShell` dari `DESIGN.md`. `TopBar` berisi sapaan, pencarian instansi (submit ke `/instansi?q=`), "Cek terakhir · berikutnya", tombol Cek Sekarang (`cek.semua`, berubah menjadi "Mengecek…" dan nonaktif saat request berjalan), `ThemeToggle`, `AlertBell`, menu akun berisi Logout, dan badge "Data contoh". `RailNav` berisi 5 item dengan tooltip dan `aria-current`. `StatusTabs` berisi 4 tab dengan hitungan dari `statusCounts`. `tokens.css` memuat variabel dark sebagai default dan `.light` untuk light mode (nilai dari `DESIGN.md`). Preferensi tema disimpan di `localStorage`. Halaman Login bawaan kit juga diganti tampilannya: satu kartu kaca di tengah di atas latar gradien, berisi email, password, tombol Masuk, dan error inline "Kredensial salah", tanpa link daftar atau lupa password.
- [ ] **Step 5:** Verifikasi manual dengan `composer run dev`, buka `/` pada lebar 1366px dan 1920px. Shell harus tampil tanpa scroll horizontal, rail bisa dinavigasi dengan keyboard (Tab + Enter), dan fokus terlihat jelas.
- [ ] **Step 6:** Commit `feat: app shell, design tokens, shared props`.

### Task 6: Dashboard

**Files:**
- Create: `app/Http/Controllers/DashboardController.php`, `resources/js/components/charts/StatusDoughnut.tsx`, `resources/js/pages/dashboard.tsx`
- Test: `tests/Feature/DashboardTest.php`

**Interfaces:**
- Produces props: `{ attention: InstansiRow[] /* tidak-aktif dulu (down_since terlama dulu), lalu kurang-aktif (konten terlama dulu), maksimal 10 */, fastest: InstansiRow[] /* 5, status bukan tidak-aktif, last_response_ms asc */, stalest: InstansiRow[] /* 5, last_content_at asc, null terakhir */ }`

- [ ] **Step 1:** Tulis tes yang gagal: urutan `attention` sesuai aturan di atas, `fastest` tidak memuat instansi `tidak-aktif` atau `null`, dan database kosong menghasilkan semua array kosong dengan status 200.
- [ ] **Step 2:** Jalankan tes, hasil yang diharapkan FAIL. Implementasikan controller, lalu pastikan PASS.
- [ ] **Step 3:** Bangun halaman sesuai layar Stitch. Klik segmen doughnut mengarah ke `router.visit('/instansi?status=…')`. Subjudul doughnut "Status {dicek} dari {total} website per cek terakhir". Item Top 5 dan "Perlu perhatian" mengarah ke Detail. Kartu ringkasan jadwal memakai `schedule` dari shared props dan jumlah cek gagal pada siklus terakhir (tambahkan `failedLastCycle: int` ke props Dashboard beserta tesnya di Step 1). Saat `statusCounts` totalnya 0, tampilkan empty state "Belum ada instansi yang dipantau. Tambahkan instansi pertama." dengan tombol ke `/instansi?tambah=1`.
- [ ] **Step 4:** Verifikasi manual: klik setiap segmen dan setiap tab menuju daftar yang terfilter dengan benar, lalu cek empty state setelah `migrate:fresh` tanpa seed (hanya admin).
- [ ] **Step 5:** Commit `feat: dashboard`.

### Task 7: Instansi (daftar, panel form, hapus)

**Files:**
- Create: `app/Http/Controllers/InstansiController.php`, `app/Http/Requests/InstansiRequest.php`, `resources/js/pages/instansi/index.tsx`, `resources/js/components/instansi/{InstansiTable,InstansiFormPanel,DeleteInstansiDialog}.tsx`
- Test: `tests/Feature/InstansiTest.php`

**Interfaces:**
- Produces routes: resource `instansi` (index, store, update, destroy, show). Props index: `{ rows: Paginated<InstansiRow> /* 25 per halaman */, filters: { status: StatusKey | null, q: string } }`. Query `?tambah=1` membuka panel.

- [ ] **Step 1:** Tulis tes yang gagal:
```php
it('memfilter status dan nama', ...);           // ?status=kurang-aktif&q=05 hanya mengembalikan baris yang cocok
it('mengabaikan status tidak dikenal', ...);     // ?status=hijau → 200, filters.status === null, semua baris
it('menormalisasi url tanpa skema', ...);        // url 'dinas.go.id' tersimpan 'https://dinas.go.id'
it('menolak url duplikat', ...);                 // error 'URL ini sudah terdaftar.'
it('wajib nama dan url', ...);                   // pesan 'Nama instansi wajib diisi.' / 'URL website wajib diisi.'
it('instansi baru berstatus null', ...);
it('hapus juga menghapus riwayat dan detailnya jadi 404', ...);
```
- [ ] **Step 2:** Jalankan tes, hasil yang diharapkan FAIL. Implementasikan dengan normalisasi di `InstansiRequest::prepareForValidation()`: tambahkan `https://` jika tidak ada skema dan buang garis miring di akhir. Jalankan ulang, hasil yang diharapkan PASS.
- [ ] **Step 3:** Bangun UI. Urutan kolom tabel: Status, Nama Instansi, Freshness, Response time, HTTP terakhir, URL, Sumber konten, Aksi. Panel form geser dari kanan dengan 3 isian dan error inline. Dialog hapus berisi "Hapus {nama}? Riwayat monitoringnya ikut terhapus.". Filter tanpa hasil menampilkan "Tidak ada instansi berstatus {label}." beserta tombol Reset filter.
- [ ] **Step 4:** Verifikasi manual alur tambah, ubah, hapus, filter, dan cari. Pastikan tombol Back browser mengembalikan filter sebelumnya.
- [ ] **Step 5:** Commit `feat: manajemen instansi`.

### Task 8: Detail Instansi

**Files:**
- Create: `resources/js/pages/instansi/show.tsx`, `resources/js/components/charts/ResponseTimeLine.tsx`
- Modify: `InstansiController::show`
- Test: tambahan di `tests/Feature/InstansiTest.php`

**Interfaces:**
- Produces props: `{ instansi: InstansiRow, series: { date: string; avgMs: number | null }[] /* 30 hari, harian */, uptime: { d7: number | null; d30: number | null } /* persen 1 desimal, null bila tak ada cek */, checks: Paginated<{ checkedAt; httpCode; responseMs; contentDate; status; error }> /* 20 per halaman, terbaru dulu */ }`

- [ ] **Step 1:** Tulis tes yang gagal: uptime d7 = persentase cek dengan `http_code` 200 dalam 7 hari (fixture 4 cek, 3 berhasil → 75.0), dan instansi tanpa cek menghasilkan `uptime.d7 === null`, `series` berisi 30 entri dengan `avgMs` null, serta status 200.
- [ ] **Step 2:** Jalankan tes, hasil yang diharapkan FAIL. Implementasikan, lalu pastikan PASS.
- [ ] **Step 3:** Bangun halaman sesuai spec §6.4. Header berisi badge besar, FreshnessText, Cek Sekarang (`instansi.cek`), Ubah (membuka panel yang sama), dan link "Lihat di laporan" ke `/laporan?instansi[]={id}`.
- [ ] **Step 4:** Commit `feat: detail instansi`.

### Task 9: Laporan

**Files:**
- Create: `app/Reports/ReportQuery.php`, `app/Http/Requests/ReportFilterRequest.php`, `app/Http/Controllers/ReportController.php`, `resources/js/pages/laporan.tsx`
- Test: `tests/Unit/ReportQueryTest.php`, `tests/Feature/ReportTest.php`

**Interfaces:**
- Produces: `ReportQuery::summarize(array $instansiIds, CarbonInterface $dari, CarbonInterface $sampai, ?Status $status): Collection<ReportRow>`. `ReportRow` adalah array `{ instansiId, nama, uptimePct: ?float, downtimeCount: int, avgResponseMs: ?int, daysSinceUpdate: ?int, endStatus: ?Status }`. `endStatus` diambil dari cek terakhir ≤ `sampai`, filter `$status` dicocokkan ke `endStatus`, dan `daysSinceUpdate` dihitung dari `content_date` terakhir ≤ `sampai` terhadap `sampai`.
- Default filter: bulan berjalan, semua instansi, semua status.

- [ ] **Step 1:** Tulis tes unit yang gagal dengan fixture 1 instansi: 4 cek dalam periode (1 timeout) menghasilkan `uptimePct = 75.0` dan `downtimeCount = 1`. `endStatus` mengikuti cek terakhir dalam periode, bukan status sekarang. Filter `tidak-aktif` membuang instansi yang `endStatus`-nya aktif.
- [ ] **Step 2:** Tulis tes feature yang gagal: `dari` > `sampai` menghasilkan error validasi "Tanggal awal harus sebelum tanggal akhir.", dan tanpa query, default yang dipakai adalah bulan berjalan.
- [ ] **Step 3:** Jalankan tes, hasil yang diharapkan FAIL. Implementasikan, lalu pastikan PASS.
- [ ] **Step 4:** Bangun halaman: bar filter (multi-select instansi; preset Bulan ini / Kuartal ini / Kustom; status), tabel TanStack dengan font lebih besar dan panel solid, tombol Export PDF dan Export Excel yang mengarah ke route Task 10 dengan query yang sama.
- [ ] **Step 5:** Commit `feat: laporan`.

### Task 10: Export PDF & Excel

**Files:**
- Create: `app/Http/Controllers/ReportExportController.php`, `app/Exports/ReportExport.php`, `resources/views/reports/pdf.blade.php`
- Test: `tests/Feature/ReportExportTest.php`

**Interfaces:**
- Consumes: `ReportQuery::summarize`, `ReportFilterRequest`
- Produces: `GET /laporan/export/pdf` dan `GET /laporan/export/excel`. Nama file `laporan-monitoring-{dari}_{sampai}.{pdf|xlsx}`.

- [ ] **Step 1:** `composer require barryvdh/laravel-dompdf maatwebsite/excel`.
- [ ] **Step 2:** Tulis tes yang gagal: `Excel::fake()` lalu GET excel dengan filter, assert `Excel::assertDownloaded('laporan-monitoring-2026-10-01_2026-10-31.xlsx')` dengan jumlah baris sama dengan `summarize`. PDF mengembalikan `Content-Type: application/pdf`. Filter tanpa hasil tetap 200, dengan baris "Tidak ada data" di Excel dan teks yang sama di HTML PDF (uji lewat render view). Tamu diarahkan ke login.
- [ ] **Step 3:** Jalankan tes, hasil yang diharapkan FAIL. Implementasikan, lalu pastikan PASS. Layout PDF berupa A4 landscape berisi judul, periode, filter aktif, tanggal cetak, dan tabel. Status ditulis sebagai teks (tidak bergantung warna) supaya terbaca dalam hitam-putih.
- [ ] **Step 4:** Verifikasi manual: unduh kedua file dari UI, buka, dan cocokkan isinya dengan tabel di layar.
- [ ] **Step 5:** Commit `feat: export laporan pdf & excel`.

### Task 11: Log Monitoring

**Files:**
- Create: `app/Http/Controllers/LogController.php`, `resources/js/pages/log.tsx`
- Test: `tests/Feature/LogTest.php`

**Interfaces:**
- Produces props: `{ rows: Paginated<{ id; checkedAt; instansi: { id; nama }; httpCode; responseMs; status; error }> /* 50 per halaman, terbaru dulu */, filters: { instansi: number | null; hasil: 'sukses' | 'gagal' | null } }`. `gagal` berarti `http_code` ≠ 200 atau null.

- [ ] **Step 1:** Tulis tes yang gagal untuk filter `hasil=gagal` (hanya memuat non-200 dan timeout) dan urutan terbaru dulu.
- [ ] **Step 2:** Jalankan tes, hasil yang diharapkan FAIL. Implementasikan controller dan halaman, lalu pastikan PASS.
- [ ] **Step 3:** Commit `feat: log monitoring`.

### Task 12: Pengaturan & lonceng notifikasi

**Files:**
- Create: `app/Http/Controllers/MonitorSettingsController.php`, `app/Http/Controllers/AlertSeenController.php`, `resources/js/pages/pengaturan.tsx`
- Modify: halaman settings bawaan kit (ganti password dipakai ulang di bawah `/pengaturan`, sisanya dihapus)
- Test: `tests/Feature/SettingsTest.php`

**Interfaces:**
- Produces: `PUT /pengaturan/monitor` (`freshness_days` integer 1–365) memanggil `RecalculateStatuses`. `POST /notifikasi/dibaca` mengisi `users.alerts_seen_at = now()`. Interval cron ditampilkan read-only dari `check_interval_hours`.

- [ ] **Step 1:** Tulis tes yang gagal: mengubah `freshness_days` ke 7 mengubah status instansi berkonten 10 hari menjadi `kurang-aktif`, nilai 0 dan 400 ditolak, ganti password dengan password lama yang salah ditolak, dan `POST /notifikasi/dibaca` membuat `alerts.count` menjadi 0 pada request berikutnya.
- [ ] **Step 2:** Jalankan tes, hasil yang diharapkan FAIL. Implementasikan, lalu pastikan PASS.
- [ ] **Step 3:** Hubungkan `AlertBell`: membuka popover akan memanggil `POST /notifikasi/dibaca`, dan item di popover mengarah ke Detail.
- [ ] **Step 4:** Commit `feat: pengaturan dan notifikasi`.

### Task 13: Light mode & pemeriksaan akhir

**Files:**
- Modify: `resources/js/styles/tokens.css`, komponen yang masih memakai warna hardcoded

- [ ] **Step 1:** Cari warna hardcoded dengan `rg "#[0-9a-fA-F]{3,6}|rgb\(" resources/js --glob '!styles/tokens.css'`. Hasil yang diharapkan: tidak ada hasil setelah semuanya diganti token.
- [ ] **Step 2:** Isi nilai `.light` dari `DESIGN.md`, lalu cek ulang kontras status dan teks di light mode dengan contrast checker.
- [ ] **Step 3:** Telusuri semua halaman dalam dua tema di lebar 1366px. Periksa empty state, filter tanpa hasil, instansi "Menunggu cek pertama", dan tombol "Mengecek…". Semua harus tampil benar, dan tidak boleh ada tombol yang tidak berfungsi.
- [ ] **Step 4:** Jalankan `php artisan test`, `npm run test`, `npm run build`, dan `npm run types` (atau `tsc --noEmit`). Semuanya harus PASS tanpa error.
- [ ] **Step 5:** Commit `feat: light mode dan perapian akhir`.
