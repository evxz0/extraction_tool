# Extraction Tools Hub ⚡

> **High-Performance Data Extraction, Algorithmic Matching, and Overtime Expense Recap Matrix Web Application.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20(Python%203.11+)-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com)
[![Upstash Redis](https://img.shields.io/badge/Session%20Lock-Upstash%20Redis-FF4438.svg?logo=redis&logoColor=white)](https://upstash.com)

---

## 📌 Fitur Utama

### 1. Sistem Keamanan & Autentikasi (1 User 1 Device Lock)
- **Single Active Session Locking:** Menggunakan Upstash Redis dengan TTL 8 jam (28.800 detik). Login dari perangkat baru akan ditolak (409 Conflict) jika sesi masih aktif di perangkat lain.
- **Force Login Support:** Opsi pemutusan sesi jarak jauh dan pengambilalihan perangkat secara aman.
- **Bcrypt Password Hashing & JWT Bearer Authentication.**
- **Password Reset Flow:** Dilengkapi token pemulihan dan validasi keamanan.

### 2. Tool 1: Multi-Format Specific Data Extractor
- Menerima file `.txt`, `.csv`, atau `.xlsx` + filter target User ID / Identifier.
- Mengekstrak **Waktu Transaksi**, **Nominal (Rupiah)**, dan **Nama Outlet / Merchant**.
- Output berupa tabel interaktif dengan fitur pencarian real-time dan ekspor langsung ke spreadsheet Excel (`.xlsx`).

### 3. Tool 2: Simsem Account Matcher (Subset Sum Problem)
- Menyelesaikan persoalan **Subset Sum Problem** menggunakan algoritma Backtracking & Dynamic Programming berkinerja tinggi di Python.
- Menemukan kombinasi pecahan transaksi return/nominal yang presisi sesuai target penarikan.
- Menampilkan visual breakdown pecahan, total akurat, dan rekomendasi kombinasi terdekat jika tidak ada exact match.

### 4. Tool 3: Overtime Expense Matrix & Multi-Year Recap Generator
- Mem-parsing log mutasi rekening bank mentah dengan regex spesifik (`36 PEMINDAHAN`, tanggal, nomor rekening, nominal).
- **Sub-row Preserving:** Transaksi identik pada tanggal dan rekening yang sama **TIDAK digabung**, melainkan ditampilkan sebagai sub-baris terpisah.
- **Wizard 3 Langkah:**
  1. *Upload Log .txt*
  2. *Mapping Nomor Rekening -> Nama Karyawan* (dengan penyimpanan preferensi lokal)
  3. *Generate Dual-Sheet Excel (.xlsx):*
     - **Sheet 1 ("Rekap Transaksi"):** Matriks transaksi harian dengan multi-header (Nama & No Rekening).
     - **Sheet 2 ("Rekapan Bulanan"):** Rekapitulasi multi-tahun (2024, 2025, 2026) Jan–Des per orang lengkap dengan formula horizontal dan vertikal `=SUM()` dan border berstandar akuntansi.

---

## 🏗️ Struktur Proyek

```
Extraction-Tools/
├── backend/
│   ├── app/
│   │   ├── auth/                  # Keamanan, JWT, deps 1-device lock, routes
│   │   ├── tools/                 # Tool 1 Extractor, Tool 2 Matcher, Tool 3 Recap
│   │   ├── routers/               # Endpoint FastAPI
│   │   ├── config.py              # Konfigurasi environment
│   │   ├── database.py            # Supabase / SQLite client
│   │   ├── redis_client.py        # Upstash Redis / Redis / InMemory manager
│   │   └── main.py                # Entrypoint FastAPI + Lifespan + CORS
│   ├── tests/
│   │   ├── test_auth.py           # Unit test session locking & auth
│   │   └── test_tools.py          # Unit test Tool 1, 2, 3
│   ├── schema.sql                 # SQL migration untuk Supabase
│   ├── seed.py                    # Seeder admin/demo user
│   ├── requirements.txt           # Python dependencies
│   ├── Dockerfile
│   └── render.yaml                # Render Blueprint deployment config
├── frontend/
│   ├── src/
│   │   ├── components/            # Navbar, ToolCard, ModalDrawer, Dropzone, Modals
│   │   ├── context/               # AuthContext (1-device listener)
│   │   ├── pages/                 # ToolsHub, LoginPage, ResetPasswordPage
│   │   ├── services/api.js        # Axios instance & interceptors
│   │   ├── App.jsx
│   │   └── index.css              # Styling Tailwind & Design Tokens
│   ├── package.json
│   ├── vite.config.js             # Vite config & API Proxy
│   └── vercel.json                # Vercel SPA routing config
├── samples/                       # Sample test files (.csv, .txt)
└── PRD.md                         # Product Requirements Document
```

---

## 🚀 Panduan Menjalankan Lokal

### Prasyarat
- Python 3.11+
- Node.js v18+ & npm

### 1. Menjalankan Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
Backend akan berjalan di `http://localhost:8000` (Dokumentasi Swagger API di `http://localhost:8000/docs`).

*Akun Default Admin:*
- **Username / Email:** `admin` atau `admin@extractiontools.com`
- **Password:** `admin123`

### 2. Menjalankan Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend akan berjalan di `http://localhost:5173`.

### 3. Menjalankan Pengujian Otomatis (Pytest)
```bash
python -m pytest backend/tests -v
```

---

## ☁️ Panduan Deployment

### Deployment Backend ke Render
1. Hubungkan repository GitHub ini ke **Render**.
2. Buat Web Service baru dengan blueprint `backend/render.yaml` atau isi:
   - **Environment:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Tambahkan Environment Variables:
   - `SECRET_KEY`: *(Generate random string)*
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_KEY`: `your-supabase-anon-or-service-role-key`
   - `UPSTASH_REDIS_REST_URL`: `https://your-instance.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN`: `your-upstash-token`

### Deployment Frontend ke Vercel
1. Import repository GitHub ini ke **Vercel**.
2. Set **Root Directory** ke `frontend`.
3. Set **Framework Preset** ke `Vite`.
4. Tambahkan Environment Variable:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com/api`
5. Deploy.

---

## 📄 Lisensi
Distributed under the MIT License.
