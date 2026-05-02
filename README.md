# Planify MRP — Fullstack (Express + React)

Satu project, satu deploy. Express API + React frontend berjalan di port yang sama.

## Struktur Project

```
planify-mrp/
├── api/                  ← Express backend
│   ├── index.js          ← Entry point (serves API + static React)
│   ├── supabase.js       ← Supabase client
│   └── routes/           ← API route handlers
│       ├── parts.js
│       ├── customers.js
│       ├── suppliers.js
│       ├── salesOrders.js
│       ├── inventory.js
│       └── mrp.js
├── client/               ← React/Vite frontend
│   ├── src/
│   ├── index.html
│   ├── vite.config.js    ← Dev proxy /api → localhost:3000
│   └── package.json
├── supabase/
│   ├── schema.sql        ← Jalankan ini di Supabase SQL Editor
│   └── seed.sql          ← Data contoh (opsional)
├── vercel.json           ← Vercel deployment config
├── package.json          ← Root package (backend deps)
└── .env.example
```

---

## Cara Menjalankan di Localhost

### Step 1 — Setup Supabase

1. Buat project gratis di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** → jalankan isi file `supabase/schema.sql`
3. (Opsional) Jalankan `supabase/seed.sql` untuk data contoh
4. Salin **Project URL** dan **anon key** dari Settings → API

### Step 2 — Buat file `.env`

```bash
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
```

### Step 3 — Install & Build Frontend

```bash
# Install backend dependencies
npm install

# Install & build frontend
cd client && npm install && npm run build && cd ..
```

### Step 4 — Jalankan

```bash
npm start
# Buka http://localhost:3000
```

#### Mode Development (Hot Reload)

Buka **2 terminal**:

```bash
# Terminal 1 — Backend (Express)
npm run dev:api

# Terminal 2 — Frontend (Vite hot reload)
cd client && npm run dev
# Buka http://localhost:5173
# (API calls di-proxy otomatis ke localhost:3000)
```

---

## Deploy ke Vercel

### Persiapan: Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/planify-mrp.git
git push -u origin main
```

### Step 1 — Buka Vercel

Pergi ke [vercel.com](https://vercel.com) → Login dengan GitHub.

### Step 2 — Import Project

1. Klik **"Add New Project"**
2. Pilih repository `planify-mrp` dari daftar
3. Klik **"Import"**

### Step 3 — Konfigurasi Build

Di halaman konfigurasi, isi seperti ini:

| Field | Value |
|---|---|
| **Framework Preset** | `Other` |
| **Root Directory** | `.` (titik, biarkan default) |
| **Build Command** | `npm run build` |
| **Output Directory** | `client/dist` |
| **Install Command** | `npm install` |

> `vercel.json` sudah mengatur semua ini secara otomatis — biasanya tidak perlu diubah manual.

### Step 4 — Tambah Environment Variables

Di bagian **"Environment Variables"**, tambahkan:

| Key | Value |
|---|---|
| `SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
| `SUPABASE_KEY` | `eyJhbGci...` (anon key dari Supabase) |

**Pastikan environment** di-set ke: ✅ Production ✅ Preview ✅ Development

### Step 5 — Deploy

Klik **"Deploy"** dan tunggu 1-2 menit. Vercel akan:
1. `npm install` — install backend dependencies
2. `npm run build` → `cd client && npm install && npm run build` — build React
3. Deploy Express sebagai Serverless Function di `/api`
4. Serve static files dari `client/dist`

### Step 6 — Selesai!

Buka URL yang diberikan Vercel (contoh: `https://planify-mrp.vercel.app`). Aplikasi sudah live!

---

## Cara Kerja di Vercel

```
Request masuk
    │
    ├── /api/*  ──→  api/index.js (Express Serverless Function)
    │                     │
    │                     └──→ Supabase (database)
    │
    └── /*      ──→  client/dist/index.html (React SPA)
```

`vercel.json` mengatur routing ini:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/(.*)",     "destination": "/index.html" }
  ]
}
```

---

## Troubleshooting

**Build gagal di Vercel?**
- Pastikan `client/package.json` ada dan `npm run build` berhasil di local
- Cek log build di Vercel dashboard

**API error 500?**
- Cek Environment Variables di Vercel → Settings → Environment Variables
- Pastikan `SUPABASE_URL` dan `SUPABASE_KEY` sudah diisi dengan benar

**Halaman blank / putih?**
- Cek browser console untuk error
- Pastikan Supabase schema sudah dijalankan (`schema.sql`)
