# DB Server Tester

Aplikasi Full Stack modern untuk melakukan pengujian, benchmarking, dan diagnostik server database jarak jauh (**Remote Database**), baik **MariaDB / MySQL** maupun **PostgreSQL**.

---

## ✨ Fitur Utama

1. **Uji Koneksi & Latensi Real-Time**:
   - Menghitung breakdown latensi jaringan: **TCP Connect**, **Authentication Handshake**, dan **Query Ping** (`SELECT version()`).
   - Mendeteksi RTT (Round Trip Time) total dari lokal ke host remote.

2. **Diagnostik Mesin Server & Kesehatan Koneksi**:
   - Deteksi otomatis versi server dan engine (MariaDB vs MySQL vs PostgreSQL).
   - Pengukuran beban koneksi: **Active Connections** vs **Max Allowed Connections** (`max_connections`).
   - Server Uptime, Charset / Encoding, dan daftar Database di remote server.

3. **Smart Troubleshooting Advisor**:
   - Jika koneksi gagal (misalnya `ECONNREFUSED`, `ETIMEDOUT`, atau `ER_ACCESS_DENIED_ERROR`), sistem memberikan rekomendasi perbaikan teknis seperti firewall, `bind-address = 0.0.0.0` di `my.cnf`, atau konfigurasi `pg_hba.conf` / `listen_addresses` di PostgreSQL.

4. **Interactive SQL Playground**:
   - Editor query SQL interaktif dengan template cepat (`SHOW TABLES`, `SHOW PROCESSLIST`, `pg_stat_activity`, ukuran database).
   - Penampil tabel interaktif dengan fitur pencarian/filter data langsung di browser.
   - Export hasil query ke format **CSV** dan **JSON**.

5. **Latency & Throughput Benchmark (Stress Test)**:
   - Mengukur stabilitas remote connection dengan simulasi *parallel workers* (konkurensi 1 - 15) dan jumlah request yang dapat diatur.
   - Perhitungan metrik kuantitatif: **QPS (Queries Per Second)**, Latensi **Min**, **Avg**, **P50 (Median)**, **P90**, **P99**, dan **Max**.

6. **Manajemen Profil Koneksi (Saved Profiles)**:
   - Simpan konfigurasi server remote favorit Anda di browser.
   - Sekali klik untuk beralih konfigurasi.
   - Dukungan **Export & Import file JSON** untuk berbagi profil dengan tim.

---

## 🚀 Cara Menjalankan

Aplikasi ini dibangun menggunakan **Next.js 16 (App Router)**, **TypeScript**, dan **Tailwind CSS**.

### 1. Jalankan Mode Development

```bash
npm run dev
```

Buka browser Anda dan akses:
👉 [http://localhost:3000](http://localhost:3000)

### 2. Build untuk Mode Production

```bash
npm run build
npm run start
```

---

## 🛠️ Stack Teknologi

- **Frontend**: Next.js 16, React 19, Tailwind CSS, Lucide Icons
- **Backend API**: Next.js Route Handlers (Node.js runtime)
- **Database Drivers**:
  - `mysql2` untuk MySQL & MariaDB (mendukung SSL, promise-based)
  - `pg` (`node-postgres`) untuk PostgreSQL (mendukung SSL, client pool)
