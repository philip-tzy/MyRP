require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

// ── Startup env check ──────────────────────────────────────
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('\n❌  SUPABASE_URL or SUPABASE_KEY missing!');
  console.error('    Copy .env.example → .env and fill in your Supabase credentials.\n');
  process.exit(1);
}

const partsRouter       = require('./routes/parts');
const customersRouter   = require('./routes/customers');
const suppliersRouter   = require('./routes/suppliers');
const salesOrdersRouter = require('./routes/salesOrders');
const inventoryRouter   = require('./routes/inventory');
const mrpRouter         = require('./routes/mrp');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── API routes ─────────────────────────────────────────────
app.use('/api/parts',         partsRouter);
app.use('/api/customers',     customersRouter);
app.use('/api/suppliers',     suppliersRouter);
app.use('/api/sales-orders',  salesOrdersRouter);
app.use('/api/inventory',     inventoryRouter);
app.use('/api/mrp',           mrpRouter);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── Serve React static build (production) ─────────────────
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// SPA fallback — all non-API routes → index.html
app.get('*', (req, res) => {
  // Skip fallback for /api routes (already handled above)
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Global error handler — always JSON ─────────────────────
app.use((err, _req, res, _next) => {
  console.error('API error:', err.message || err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n✅  Planify MRP running → http://localhost:${PORT}`);
  console.log(`    API health         → http://localhost:${PORT}/api/health`);
  console.log(`    Frontend           → http://localhost:${PORT}\n`);
});

module.exports = app;
