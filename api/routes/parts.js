const express = require('express');
const router  = express.Router();
const supabase = require('../supabase');

// GET all parts
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .order('part_number');
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// GET single part with BOM and BOO
router.get('/:id', async (req, res, next) => {
  try {
    const { data: part, error: pErr } = await supabase
      .from('parts').select('*').eq('id', req.params.id).single();
    if (pErr) throw pErr;

    const { data: bom } = await supabase
      .from('bom')
      .select('*, child:child_part_id(id,part_number,name,uom)')
      .eq('parent_part_id', req.params.id);

    const { data: boo } = await supabase
      .from('boo').select('*').eq('part_id', req.params.id).order('step_no');

    res.json({ ...part, bom: bom || [], boo: boo || [] });
  } catch (err) { next(err); }
});

// POST create part
router.post('/', async (req, res, next) => {
  try {
    const { part_number, name, type, uom, on_hand_qty, lot_size, lead_time_days } = req.body;
    const { data, error } = await supabase
      .from('parts')
      .insert({ part_number, name, type, uom, on_hand_qty: on_hand_qty || 0, lot_size: lot_size || 1, lead_time_days: lead_time_days || 1 })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// PUT update part
router.put('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('parts').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE part
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('parts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET BOM for a part
router.get('/:id/bom', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('bom')
      .select('*, child:child_part_id(id,part_number,name,uom,type)')
      .eq('parent_part_id', req.params.id);
    if (error) throw error;
    res.json(data || []);
  } catch (err) { next(err); }
});

// POST add BOM line
router.post('/:id/bom', async (req, res, next) => {
  try {
    const { child_part_id, qty_per } = req.body;
    const { data, error } = await supabase
      .from('bom')
      .insert({ parent_part_id: req.params.id, child_part_id, qty_per })
      .select('*, child:child_part_id(id,part_number,name,uom)').single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// DELETE BOM line
router.delete('/:id/bom/:bomId', async (req, res, next) => {
  try {
    const { error } = await supabase.from('bom').delete().eq('id', req.params.bomId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET BOO for a part
router.get('/:id/boo', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('boo').select('*').eq('part_id', req.params.id).order('step_no');
    if (error) throw error;
    res.json(data || []);
  } catch (err) { next(err); }
});

// POST add BOO step
router.post('/:id/boo', async (req, res, next) => {
  try {
    const { step_no, operation, work_center, time_minutes } = req.body;
    const { data, error } = await supabase
      .from('boo')
      .insert({ part_id: req.params.id, step_no, operation, work_center, time_minutes })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// DELETE BOO step
router.delete('/:id/boo/:booId', async (req, res, next) => {
  try {
    const { error } = await supabase.from('boo').delete().eq('id', req.params.booId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
