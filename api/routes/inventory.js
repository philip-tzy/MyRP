const express = require('express');
const router  = express.Router();
const supabase = require('../supabase');

// POST inventory adjustment
router.post('/adjust', async (req, res, next) => {
  try {
    const { part_id, qty_change, reason } = req.body;

    const { data: adj, error: adjErr } = await supabase
      .from('inventory_adjustments')
      .insert({ part_id, qty_change, reason })
      .select().single();
    if (adjErr) throw adjErr;

    // Update on_hand_qty on the part
    const { data: part, error: pErr } = await supabase
      .from('parts').select('on_hand_qty').eq('id', part_id).single();
    if (pErr) throw pErr;

    const newQty = (part.on_hand_qty || 0) + qty_change;
    const { error: updErr } = await supabase
      .from('parts').update({ on_hand_qty: Math.max(0, newQty) }).eq('id', part_id);
    if (updErr) throw updErr;

    res.status(201).json({ adjustment: adj, new_qty: Math.max(0, newQty) });
  } catch (err) { next(err); }
});

// GET adjustment history for a part
router.get('/history/:partId', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('inventory_adjustments')
      .select('*, part:part_id(part_number,name)')
      .eq('part_id', req.params.partId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
