const express  = require('express');
const router   = express.Router();
const supabase = require('../supabase');

// ─────────────────────────────────────────────────────────────
// MRP CALCULATION ENGINE
// ─────────────────────────────────────────────────────────────
async function runMrpEngine() {
  const suggestions = [];

  // PHASE 0: Clear pending suggestions
  const { error: delErr } = await supabase
    .from('mrp_suggestions')
    .delete()
    .eq('status', 'Pending');
  if (delErr) throw delErr;

  // Get gross demand from unshipped SO lines
  const { data: demand, error: demErr } = await supabase
    .from('sales_order_lines')
    .select('part_id, order_qty, so:so_id(so_number, due_date)')
    .eq('shipped', false);
  if (demErr) throw demErr;

  if (!demand || demand.length === 0) {
    return { generated: 0, message: 'No open demand found' };
  }

  // Build queue: aggregate demand per part + due_date
  const queue = demand.map(d => ({
    part_id:   d.part_id,
    gross_qty: d.order_qty,
    due_date:  d.so.due_date,
    source_so: d.so.so_number,
  }));

  // Track processed parts to avoid infinite BOM loops
  const visited = new Set();

  // PHASE 1+2: The Calculation Loop
  while (queue.length > 0) {
    const item = queue.shift();

    // Fetch part details
    const { data: part, error: pErr } = await supabase
      .from('parts')
      .select('id, part_number, name, type, on_hand_qty, lot_size, lead_time_days')
      .eq('id', item.part_id)
      .single();
    if (pErr) continue;

    // Dedup guard: key = part_id + due_date
    const visitKey = `${item.part_id}::${item.due_date}`;
    if (visited.has(visitKey)) continue;
    visited.add(visitKey);

    // ── NETTING ──
    const netReq = item.gross_qty - (part.on_hand_qty || 0);
    if (netReq <= 0) continue; // stock sufficient

    // ── LOT SIZING ──
    let orderQty = netReq;
    const lotSize = part.lot_size || 1;
    if (netReq < lotSize) {
      orderQty = lotSize;
    } else {
      // Round up to nearest lot size multiple
      orderQty = Math.ceil(netReq / lotSize) * lotSize;
    }

    // ── OFFSETTING ──
    const dueDate   = new Date(item.due_date);
    const startDate = new Date(dueDate);
    startDate.setDate(dueDate.getDate() - (part.lead_time_days || 1));

    // Determine suggestion type
    const suggType = (part.type === 'Raw Material') ? 'Purchase' : 'Job';

    suggestions.push({
      part_id:    item.part_id,
      order_qty:  orderQty,
      start_date: startDate.toISOString().split('T')[0],
      due_date:   dueDate.toISOString().split('T')[0],
      type:       suggType,
      status:     'Pending',
      source_so:  item.source_so || null,
    });

    // ── BOM EXPLOSION ──
    const { data: bomLines } = await supabase
      .from('bom')
      .select('child_part_id, qty_per')
      .eq('parent_part_id', item.part_id);

    if (bomLines && bomLines.length > 0) {
      for (const line of bomLines) {
        queue.push({
          part_id:   line.child_part_id,
          gross_qty: Math.ceil(orderQty * line.qty_per),
          due_date:  startDate.toISOString().split('T')[0],
          source_so: item.source_so,
        });
      }
    }
  }

  // PHASE 3: Batch insert all suggestions
  if (suggestions.length > 0) {
    const { error: insErr } = await supabase
      .from('mrp_suggestions')
      .insert(suggestions);
    if (insErr) throw insErr;
  }

  return { generated: suggestions.length };
}

// POST /api/mrp/run
router.post('/run', async (req, res, next) => {
  try {
    const result = await runMrpEngine();
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// GET /api/mrp/suggestions
router.get('/suggestions', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('mrp_suggestions')
      .select('*, part:part_id(id,part_number,name,type,uom), supplier:supplier_id(id,code,name)')
      .order('start_date');
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// PUT /api/mrp/suggestions/:id/approve
router.put('/suggestions/:id/approve', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('mrp_suggestions')
      .update({ status: 'Firm' })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// PUT /api/mrp/suggestions/:id/cancel
router.put('/suggestions/:id/cancel', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('mrp_suggestions')
      .update({ status: 'Cancelled' })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
