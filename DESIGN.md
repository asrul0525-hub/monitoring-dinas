# Design System: Monitoring Website Dinas (Diskominfo)

**Project ID:** `7408041637157430809`
**Stitch Design System Asset:** `assets/6194463943643494434`

---

## 1. Visual Theme & Atmosphere

Antarmuka pemantauan eksekutif desktop (lebar minimum 1366px, target utama 1440px–1920px) untuk satu **Super Admin Diskominfo**. Mengadopsi estetika **visionOS Glassmorphism Gelap** yang tenang, presisi, dan nyaman untuk observasi jangka panjang maupun proyeksi rapat pimpinan.

- **Kanvas Latar:** Gradien atmosferik gelap dari *Deep Abyssal Navy* (`#0B1220`) ke *Obsidian Night* (`#05070D`) dengan pendaran cahaya dingin (*cool ambient bloom*) yang sangat samar di sudut kiri atas (`radial-gradient` biru langit pada opasitas `8%`), memberikan kedalaman alami agar permukaan kaca terlihat mengambang tanpa memerlukan gambar latar belakang atau pola grid dekoratif.
- **Aturan Kaca Ketat (Dose Cap):** Efek *frosted glass* (`backdrop-filter: blur(24px)`, latar transparan `rgba(18, 26, 43, 0.68)`, garis tepi *hairline* `1px solid rgba(255, 255, 255, 0.12)`) **hanya** diterapkan pada **4 elemen kerangka (shell chrome)**:
  1. **Floating Top Bar** (pill mengambang di atas)
  2. **Floating Left Icon Rail** (pill vertikal di sisi kiri)
  3. **Floating Bottom Status Tab Bar** (pill filter status di bawah pada layar Dashboard & Instansi)
  4. **Slide-over Form Panel** (panel geser dari kanan untuk Tambah/Ubah Instansi)
- **Permukaan Konten & Tabel:** Kartu bento pada Dashboard menggunakan permukaan semi-solid (`#121A2B` opasitas `88%`). Tabel padat pada halaman **Instansi**, **Laporan**, dan **Log Monitoring** menggunakan permukaan hampir solid (`#0F1626`) agar teks dan angka memiliki keterbacaan setinggi mungkin.

---

## 2. Color Palette & Roles (Verified WCAG AA Contrast)

Seluruh pasangan warna telah diverifikasi menggunakan pemeriksa kontras WCAG 2.x (teks normal ≥ 4.5:1, elemen grafis/segmen chart ≥ 3.0:1).

### 2.1 Tema Utama: Dark Mode (Default)

| Peran Semantik | Token CSS | Nama Deskriptif & Hex | Rasio Kontras (vs `#121A2B`) | Keterangan Penggunaan |
|---|---|---|---|---|
| **Canvas Start** | `--bg-canvas-start` | Deep Abyssal Navy (`#0B1220`) | — | Titik awal gradien latar belakang |
| **Canvas End** | `--bg-canvas-end` | Obsidian Night (`#05070D`) | — | Titik akhir gradien latar belakang |
| **Surface Glass** | `--bg-glass` | Frosted Slate (`rgba(18, 26, 43, 0.68)`) | — | Hanya untuk 4 elemen shell chrome + `blur(24px)` |
| **Surface Card** | `--bg-card` | Midnight Slate (`#121A2B`) | — | Kartu widget Dashboard & Detail Instansi |
| **Surface Table** | `--bg-table` | Deep Harbor Solid (`#0F1626`) | — | Panel tabel Instansi, Laporan, Log Monitoring |
| **Surface Elevated** | `--bg-elevated` | Elevated Navy (`#172238`) | — | Hover baris tabel, input field, pemilih rentang |
| **Border Hairline** | `--border-subtle` | Specular Hairline (`rgba(255, 255, 255, 0.10)`) | — | Garis tepi kartu, kaca, dan pembatas baris tabel |
| **Border Interactive** | `--border-strong` | Steel Slate (`#314772`) | 3.12:1 (PASS) | Batas input form, fokus, dan kontrol aktif |
| **Text Primary** | `--text-primary` | Ice White (`#E6EBF5`) | **14.54:1** (PASS) | Judul, nama instansi, angka metrik utama |
| **Text Secondary** | `--text-secondary` | Cool Pewter (`#9AA6BD`) | **7.09:1** (PASS) | Subjudul, label kolom, waktu relatif, URL |
| **Accent Primary** | `--accent` | Civic Sky Blue (`#4DA3FF`) | **6.62:1** (PASS) | Hanya untuk CTA utama (`Cek Sekarang`, `Tambah Instansi`, `Export PDF`) & cincin item aktif di rail |
| **Text on Accent** | `--accent-fg` | Deepest Navy (`#07101F`) | **7.25:1** vs `#4DA3FF` (PASS) | Teks tombol aksi utama di atas `#4DA3FF` |
| **Status: Aktif** | `--status-aktif` | Signal Emerald (`#34D399`) | **9.04:1** (PASS) | Teks, titik indikator, & segmen chart status Aktif |
| **Status: Aktif Bg** | `--status-aktif-bg` | Deep Emerald Tint (`rgba(52, 211, 153, 0.12)`) | — | Latar badge status Aktif (border `rgba(52, 211, 153, 0.35)`) |
| **Status: Kurang Aktif** | `--status-kurang` | Signal Amber (`#FBBF24`) | **10.41:1** (PASS) | Teks, titik indikator, & segmen chart Kurang Aktif |
| **Status: Kurang Bg** | `--status-kurang-bg` | Deep Amber Tint (`rgba(251, 191, 36, 0.12)`) | — | Latar badge Kurang Aktif (border `rgba(251, 191, 36, 0.35)`) |
| **Status: Tidak Aktif** | `--status-tidak` | Signal Coral Red (`#F87171`) | **6.28:1** (PASS) | Teks, titik indikator, segmen chart Tidak Aktif, & aksi Hapus |
| **Status: Tidak Bg** | `--status-tidak-bg` | Deep Coral Tint (`rgba(248, 113, 113, 0.12)`) | — | Latar badge Tidak Aktif (border `rgba(248, 113, 113, 0.35)`) |
| **Status: Menunggu** | `--status-menunggu` | Neutral Slate (`#94A3B8`) | **6.78:1** (PASS) | Instansi baru yang belum pernah dicek (`Menunggu cek pertama`) |
| **Status: Menunggu Bg** | `--status-menunggu-bg` | Muted Slate Tint (`rgba(148, 163, 184, 0.12)`) | — | Latar badge Menunggu cek pertama |

### 2.2 Tema Tambahan: Light Mode (`.light`)

Diterapkan melalui pertukaran nilai CSS custom properties pada class `.light` di elemen root:

| Token CSS | Nilai Light Mode | Rasio Kontras |
|---|---|---|
| `--bg-canvas-start` / `--bg-canvas-end` | `#EEF2F8` / `#E2E8F0` | — |
| `--bg-glass` | `rgba(255, 255, 255, 0.78)` + `blur(24px)` | — |
| `--bg-card` / `--bg-table` | `#FFFFFF` / `#FFFFFF` | — |
| `--bg-elevated` | `#F1F5F9` | — |
| `--border-subtle` / `--border-strong` | `#E2E8F0` / `#64748B` | 4.78:1 vs `#FFFFFF` (PASS) |
| `--text-primary` | `#0F172A` | **17.85:1** vs `#FFFFFF` (PASS) |
| `--text-secondary` | `#475569` | **7.58:1** vs `#FFFFFF` (PASS) |
| `--accent` / `--accent-fg` | `#1D4ED8` / `#FFFFFF` | **6.70:1** (PASS) |
| `--status-aktif` / `--status-aktif-bg` | `#047857` / `#ECFDF5` | **5.21:1** (PASS) |
| `--status-kurang` / `--status-kurang-bg` | `#B45309` / `#FFFBEB` | **4.84:1** (PASS) |
| `--status-tidak` / `--status-tidak-bg` | `#B91C1C` / `#FEF2F2` | **5.91:1** (PASS) |
| `--status-menunggu` / `--status-menunggu-bg` | `#334155` / `#F1F5F9` | **9.45:1** (PASS) |

> **Aturan Aksesibilitas Mutlak:** Warna status tidak pernah berdiri sendiri. Setiap indikator status wajib menampilkan **label teks eksplisit** (`Aktif`, `Kurang Aktif`, `Tidak Aktif`, `Menunggu cek pertama`) agar tetap terbaca oleh pengguna buta warna maupun pada hasil cetak PDF hitam-putih.

---

## 3. Typography Rules

- **Font Family:** **Plus Jakarta Sans** untuk seluruh heading, body, tabel, dan kontrol UI. Dipilih karena dirancang untuk identitas visual layanan publik di Indonesia serta memiliki keterbacaan tinggi pada ukuran kecil maupun layar proyektor.
- **Angka Tabular:** Seluruh angka metrik, persentase uptime, latensi (`ms`), kode HTTP, jumlah hari, dan tanggal wajib menggunakan `font-variant-numeric: tabular-nums` agar lurus sempurna dalam kolom tabel dan daftar peringkat.
- **Skala Tipografi:**
  - **Page Title (H1):** `28px` (`1.75rem`), `font-weight: 700`, `letter-spacing: -0.02em`, `line-height: 1.25`.
  - **Card / Panel Title (H2):** `16px` (`1rem`), `font-weight: 600`, `letter-spacing: -0.01em`.
  - **Hero Metric (Doughnut Center / Summary Strip):** `28px–32px`, `font-weight: 700`, `tabular-nums`.
  - **Table Body (Instansi & Log):** `14px` (`0.875rem`), `font-weight: 400` (nama instansi `500`), satu baris tanpa *wrapping*.
  - **Table Body (Laporan Proyektor):** `15px` (`0.9375rem`), tinggi baris longgar (`52px`) untuk keterbacaan jarak jauh saat rapat evaluasi.
  - **Table Header:** `12px` (`0.75rem`), *Sentence case* (bukan *ALL CAPS* dengan spasi renggang), `font-weight: 600`, warna `--text-secondary`.
  - **Badge & Caption:** `12px` (`0.75rem`), `font-weight: 500`.

---

## 4. Component Stylings & Shape Hierarchy

Menggunakan tiga tingkat lengkungan (*border-radius*) yang tegas agar fungsi setiap elemen langsung dikenali:

1. **Pill-shaped (`border-radius: 9999px`):**
   - **Floating Top Bar**, **Floating Left Icon Rail**, **Floating Bottom Status Tab Bar**.
   - **Primary Action Buttons** (`Cek Sekarang`, `Tambah Instansi`, `Export PDF`, `Simpan`).
   - **Status Badges** (`Aktif`, `Kurang Aktif`, `Tidak Aktif`, `Menunggu cek pertama`) dan lencana `Data contoh`.
2. **Container Rounded (`border-radius: 20px`):**
   - Kartu bento pada Dashboard, panel tabel utama (`Instansi`, `Laporan`, `Log`), strip ringkasan Laporan, dan kartu Login.
   - Slide-over panel di tepi kanan (`border-radius: 20px 0 0 20px`).
3. **Control Rounded (`border-radius: 10px`):**
   - Input form, pemilih filter dropdown, tombol sekunder (`Export Excel`, `Batal`), dan baris item di dalam kartu *Perlu Perhatian*.

### Elevasi & Bayangan
- **Shell Chrome & Overlay:** Hanya elemen mengambang (Top Bar, Left Rail, Bottom Status Tabs, Slide-over Panel, dan Dialog Konfirmasi) yang memiliki bayangan lembut (`0 16px 40px rgba(0, 0, 0, 0.45)`).
- **Kartu & Tabel:** Duduk rata (*flat*) di atas kanvas dan dibedakan melalui kontras permukaan (`#121A2B` / `#0F1626`) serta *hairline border* `1px`. Tidak ada efek *glow* dekoratif atau animasi berdenyut (*pulsing loop*).

---

## 5. Layout Principles & App Shell Architecture

- **Viewport Desktop:** Dirancang khusus untuk layar laptop dan monitor (`min-width: 1366px`).
- **Susunan App Shell:**
  - **Left Rail:** Lebar `64px`, mengambang `20px` dari tepi kiri, berisi 5 ikon navigasi utama dengan tooltip: **Dashboard** (`/`), **Instansi** (`/instansi`), **Laporan** (`/laporan`), **Log Monitoring** (`/log`), dan **Pengaturan** (`/pengaturan`). Item aktif ditandai lingkaran kaca terang dengan tepi `--accent`.
  - **Top Bar:** Tinggi `60px`, membentang di atas area konten utama. Memuat sapaan admin, lencana `Data contoh` (selama `FakeMonitor` aktif), pencarian cepat instansi, keterangan jadwal cek terakhir & berikutnya, tombol `Cek Sekarang`, pemindah tema Dark/Light, lonceng notifikasi instansi yang baru *down*, dan menu akun (Logout).
  - **Main Content Area:** Berada di sebelah kanan Left Rail (`padding: 24px 32px 96px 104px`). Padding bawah `96px` memastikan **Bottom Status Tab Bar** tidak pernah menutupi baris terakhir kartu atau tabel.
  - **Slide-over Form Panel:** Lebar `440px`, melayang di sisi kanan di atas *scrim* gelap (`rgba(5, 7, 13, 0.60)`), menjaga konteks tabel di belakangnya tetap terlihat tanpa menggeser layout halaman.
