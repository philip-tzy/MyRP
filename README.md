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
