# Rencana Implementasi: Peningkatan UI/UX & Navigasi Frontend

> **Tujuan:** Memperbarui antarmuka pengguna (UI/UX) dan sistem navigasi sistem Monitoring Website Dinas menjadi lebih interaktif, modern, dan ekspresif dengan sentuhan animasi mikro, grafik batang horizontal, modal pop-up tengah layar, kategori instansi, jam real-time WITA, serta skeleton loading.

---

## 1. Pembahasan Desain UI/UX & Navigasi

### A. Dashboard: Horizontal Bar Chart & Skeleton Shimmer
- **Horizontal Bar Chart (`StatusBarChart.tsx`):**
  - Menggantikan doughnut chart. Menampilkan 3 baris status utama: **Aktif**, **Kurang Aktif**, dan **Tidak Aktif**.
  - Setiap baris memiliki: nama status, dot indikator, persentase proporsi, progress bar horizontal dengan transisi lebar halus (`transition-all duration-700 ease-out`), dan angka jumlah instansi.
  - Interaksi: Setiap baris bar chart bertindak sebagai tombol interaktif yang bisa diklik untuk langsung menyaring tabel di `/instansi?status={key}` dengan efek hover & press glow.
- **Skeleton Shimmer Loading (`Skeleton.tsx`):**
  - Efek skeleton berbasis CSS gradient linear shimmer (`animate-shimmer`) dengan latar semi-transparan yang bergelombang lembut, digunakan untuk membungkus kartu metriks saat proses memuat data.

### B. Shell & Navigasi: TopBar & RailNav
- **Jam Real-time WITA (`RealtimeClockWita.tsx`):**
  - Menggantikan teks statis jadwal cek. Menampilkan waktu lokal **WITA (UTC+8)** secara live: `HH:mm:ss WITA` dengan font mono tabular, berkedip lembut pada separator detik.
- **Identitas Akun Dinamis:**
  - Di **TopBar**: Nama dan inisial avatar diambil langsung dari akun admin yang sedang login (`auth.user.name` dan `auth.user.email`).
  - Di **RailNav**: Label teks "SIMON" dan inisial "SM" diperbarui menjadi inisial dinamis user yang sedang login dengan tooltip nama lengkap.
- **Modern Icon Theme Toggle (`ThemeToggle.tsx`):**
  - Menghilangkan teks "Gelap/Terang". Menggunakan satu pill / tombol bulat kaca dengan ikon Matahari (Sun) dan Bulan (Moon) SVG.
  - Dilengkapi animasi rotasi mikro 45° dan transisi warna halus saat berganti mode.

### C. Komponen Form: Modal Pop-up Tengah Layar
- **Modal Pop-Up Tambah / Ubah (`InstansiFormModal.tsx`):**
  - Menggantikan panel geser dari kanan (*slide-over*).
  - Berada tepat di tengah layar dengan backdrop blur (`backdrop-blur-sm bg-scrim`), animasi scale-in (`scale-95 opacity-0` ke `scale-100 opacity-100` durasi 200ms).
  - Ukuran kompak dan fokus, menghilangkan area kosong berlebih di layar lebar.

### D. Struktur Data: Kategori Instansi (Bukan "Sumber Konten")
- **Field & Pilihan Kategori:**
  - Pilihan: `Instansi Vertikal` (`vertikal`), `Dinas` (`dinas`), dan `Kec/Kel/PKM` (`kec_kel_pkm`).
  - Logika pengecekan teknis (HTTP 200 dan parsing update konten) tetap berjalan utuh di background tanpa gangguan.
  - Ditambahkan ke migrasi/database tabel `instansi`, dropdown modal form, badge pill di tabel, serta filter kategori di **Laporan** dan **Log Monitoring**.

### E. Micro-Animations & Glow Interaktif
- **Animasi Tombol & Glow (`tokens.css`):**
  - `active:scale-[0.97]` saat ditekan.
  - Glow tipis `box-shadow: 0 0 14px var(--accent-glow)` saat tombol aksen aktif/ditekan.
- **Tombol Aksi Tabel (Ubah & Hapus):**
  - **Ubah:** Icon pensil dengan transisi warna latar aksen lembut saat hover, scale feedback saat klik.
  - **Hapus:** Icon tempat sampah dengan transisi warna merah lembut, efek hover tegas, dan trigger modal konfirmasi hapus di tengah layar.
- **Label Cetak:**
  - Mengubah tombol "Export Excel" & "Export PDF" menjadi **"Cetak Excel"** dan **"Cetak PDF"**.

---

## 2. Rincian Tahapan Tugas (Task Breakdown)

### Task 1: Skema Database & Model Kategori Instansi
- **File Modifikasi:**
  - `database/migrations/2026_11_07_000001_create_monitoring_tables.php` (tambahkan kolom `kategori` default `dinas`)
  - `app/Models/Instansi.php` (tambahkan `kategori` ke `$fillable`, casting, dan `toRow()`)
  - `app/Http/Requests/InstansiRequest.php` (validasi `kategori` in: `vertikal,dinas,kec_kel_pkm`)
  - `database/seeders/SampleDataSeeder.php` (generate data kategori untuk 42 instansi)
  - `tests/Feature/InstansiTest.php`
- **Verifikasi:** Jalankan `php artisan migrate:fresh --seed` dan tes instansi lulus.

### Task 2: Animasi Global, Token Glow, & Skeleton Shimmer
- **File Modifikasi/Buat:**
  - `resources/js/styles/tokens.css` (tambahkan variable `--accent-glow`, keyframes shimmer, animasi glow tombol)
  - `resources/js/Components/ui/Skeleton.tsx` (komponen skeleton shimmer yang reusable)
- **Verifikasi:** Build vite lulus tanpa error CSS/Tailwind.

### Task 3: TopBar & RailNav (Jam WITA, Ikon Theme, Identitas Dinamis)
- **File Modifikasi/Buat:**
  - `resources/js/Components/shell/RealtimeClockWita.tsx` (jam digital live WIB/WITA)
  - `resources/js/Components/shell/ThemeToggle.tsx` (ganti ke mode ikon SVG Sun/Moon)
  - `resources/js/Components/shell/TopBar.tsx` (pasang jam WITA, bersihkan teks lama)
  - `resources/js/Components/shell/RailNav.tsx` (nama & inisial dinamis dari user auth)
- **Verifikasi:** Vitest & Pest shared props test lulus.

### Task 4: Dashboard Horizontal Bar Chart
- **File Modifikasi/Buat:**
  - `resources/js/Components/charts/StatusBarChart.tsx` (horizontal status bars dengan persen & klik filter)
  - `resources/js/Pages/Dashboard.tsx` (ganti `StatusDoughnut` ke `StatusBarChart`)
  - `tests/Feature/DashboardTest.php`
- **Verifikasi:** Vite build dan Pest Dashboard test lulus.

### Task 5: Modal Pop-up Tengah & Animasi Tombol Aksi (Ubah/Hapus)
- **File Modifikasi/Buat:**
  - `resources/js/Components/instansi/InstansiFormModal.tsx` (dialog modal tengah layar, pilihan kategori)
  - `resources/js/Components/instansi/InstansiTable.tsx` (ganti kolom sumber konten ke kategori, tombol ubah/hapus animasi)
  - `resources/js/Pages/Instansi/Index.tsx`
  - `resources/js/Pages/Instansi/Show.tsx`
- **Verifikasi:** Tes CRUD Instansi lulus dan modal berfungsi interaktif.

### Task 6: Filter Kategori & Label "Cetak" di Halaman Laporan
- **File Modifikasi:**
  - `app/Reports/ReportQuery.php` & `app/Http/Requests/ReportFilterRequest.php` (dukung filter `kategori`)
  - `resources/js/Pages/Laporan.tsx` (dropdown filter kategori, ganti teks tombol ke "Cetak Excel" & "Cetak PDF")
  - `tests/Feature/ReportTest.php` & `tests/Feature/ReportExportTest.php`
- **Verifikasi:** Tes laporan & cetak export lulus.

### Task 7: Filter Kategori di Log Monitoring
- **File Modifikasi:**
  - `app/Http/Controllers/LogController.php` (dukung query `kategori`)
  - `resources/js/Pages/Log.tsx` (tambahkan opsi filter kategori di filter bar)
  - `tests/Feature/LogTest.php`
- **Verifikasi:** Tes log filtering lulus.

### Task 8: Verifikasi Akhir Menyeluruh
- Jalankan:
  1. `npm run types`
  2. `npm run test`
  3. `npm run build`
  4. `php artisan test`
  5. `php artisan migrate:fresh --seed`
- Commit seluruh perubahan dengan pesan jelas.
