const express = require('express');
const router  = express.Router();
const supabase = require('../supabase');

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('customers').select('*').order('code');
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('customers').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { code, name, city, contact, email } = req.body;
    const { data, error } = await supabase.from('customers').insert({ code, name, city, contact, email }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('customers').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('customers').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
