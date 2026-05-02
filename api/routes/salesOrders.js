const express = require('express');
const router  = express.Router();
const supabase = require('../supabase');

// GET all sales orders
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('*, customer:customer_id(id,code,name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// GET single SO with lines
router.get('/:id', async (req, res, next) => {
  try {
    const { data: so, error: soErr } = await supabase
      .from('sales_orders')
      .select('*, customer:customer_id(id,code,name)')
      .eq('id', req.params.id).single();
    if (soErr) throw soErr;

    const { data: lines, error: lErr } = await supabase
      .from('sales_order_lines')
      .select('*, part:part_id(id,part_number,name,uom)')
      .eq('so_id', req.params.id);
    if (lErr) throw lErr;

    res.json({ ...so, lines: lines || [] });
  } catch (err) { next(err); }
});

// POST create SO with lines
router.post('/', async (req, res, next) => {
  try {
    const { customer_id, so_number, order_date, due_date, notes, lines } = req.body;

    // Generate SO number if not provided
    const soNum = so_number || `SO-${Date.now()}`;

    const { data: so, error: soErr } = await supabase
      .from('sales_orders')
      .insert({ customer_id, so_number: soNum, order_date, due_date, notes, status: 'Draft' })
      .select().single();
    if (soErr) throw soErr;

    if (lines && lines.length > 0) {
      const lineRows = lines.map(l => ({
        so_id: so.id,
        part_id: l.part_id,
        order_qty: l.order_qty,
        shipped: false,
      }));
      const { error: lErr } = await supabase.from('sales_order_lines').insert(lineRows);
      if (lErr) throw lErr;
    }

    res.status(201).json(so);
  } catch (err) { next(err); }
});

// PUT update SO status
router.put('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('sales_orders').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE SO
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('sales_orders').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
