const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabaseClient');
const crypto = require('crypto');

// Helper: Generate unique tracking ID
function generateTrackingId() {
  const now = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TRX-${now}-${rand}`;
}

// GET /transactions/:id
router.get('/:id', async (req, res) => {
  const trackingId = req.params.id;

  if (!trackingId || typeof trackingId !== 'string') {
    return res.status(400).json({ error: 'Invalid tracking ID' });
  }

  try {
    const { data, error } = await supabase
      .from('tblTransactions')
      .select(`
        trackingid,
        clientid,
        trackingmessage,
        description,
        created_at,
        tblClients (clientName),
        tblStatus (statusname)
      `)
      .eq('trackingid', trackingId)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const result = {
      trackingid: data.trackingid,
      clientid: data.clientid,
      trackingmessage: data.trackingmessage,
      description: data.description,
      created_at: data.created_at,
      clientname: data.tblClients?.clientname || '',
      statusname: data.tblStatus?.statusname || '',
    };

    res.json(result);
  } catch (err) {
    console.error('Error fetching transaction by tracking ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /transactions?page=1&limit=10
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    // Fetch paginated transactions with joins to tblClients and tblStatus
    const { data, error } = await supabase
      .from('tblTransactions')
      .select(`
        trackingid,
        clientid,
        trackingmessage,
        description,
        created_at,
        tblClients (clientName),
        tblStatus (statusname)
      `)
      .order('trackingid', { ascending: true })
      .range(from, to);
    if (error) {
      console.log('check error')
      throw error;
    }

    // Fetch total count separately
    const { count, error: countError } = await supabase
      .from('tblTransactions')
      .select('trackingid', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    // Format joined data
    const transactions = data.map(t => ({
      trackingid: t.trackingid,
      clientid: t.clientid,
      clientName: t.tblClients?.clientName || '',
      trackingmessage: t.trackingmessage,
      description: t.description,
      statusname: t.tblStatus?.statusname || '',
      created_at: t.created_at
    }));

    res.status(200).json({
      transactions,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error('Error fetching transactions:', error.message || error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});


// POST /transactions
router.post('/', async (req, res) => {
  const { clientid, trackingmessage, trackingstatusid, description } = req.body;

  if (!clientid || !trackingmessage || !trackingstatusid) {
    return res.status(400).json({
      error: 'clientid, trackingMessage, and trackingStatusId are required',
    });
  }

  let trackingid;
  let inserted = false;
  let attempts = 0;

  while (!inserted && attempts < 5) {
    trackingid = generateTrackingId(); // Your own custom function
    attempts++;

    // Check if tracking ID already exists
    const { data: existing, error: checkError } = await supabase
      .from('tblTransactions')
      .select('trackingid')
      .eq('trackingid', trackingid)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking duplicate tracking ID:', checkError.message);
      return res.status(500).json({ error: 'Failed to check tracking ID' });
    }

    if (existing) {
      continue; // Duplicate ID found — retry
    }

    // Insert transaction
    const { error: insertError } = await supabase
      .from('tblTransactions')
      .insert([{
        trackingid,
        clientid,
        trackingmessage: trackingmessage,
        trackingstatusid: trackingstatusid,
        description: description || null,
      }]);

    if (!insertError) {
      inserted = true;
      return res.status(201).json({ message: 'Transaction created successfully', trackingid });
    } else {
      console.error('❌ Insert error:', insertError.message);
    }
  }

  // If 5 attempts fail
  return res.status(500).json({
    error: 'Failed to generate a unique tracking ID. Please try again.',
  });
});

// PUT /transactions/:id
router.put('/:id', async (req, res) => {
  const trackingid = req.params.id;
  const { clientid, trackingmessage, trackingstatusid, description } = req.body;

  if (!trackingid || !clientid || !trackingmessage || !trackingstatusid) {
    return res.status(400).json({
      error: 'trackingId, clientId, trackingMessage, and trackingStatusId are required',
    });
  }

  try {
    const { data: existing, error: findError } = await supabase
      .from('tblTransactions')
      .select('trackingid')
      .eq('trackingid', trackingid)
      .maybeSingle();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const { error } = await supabase
      .from('tblTransactions')
      .update({
        clientid: clientid,
        trackingmessage: trackingmessage,
        trackingstatusid: trackingstatusid,
        description: description || null
      })
      .eq('trackingid', trackingid);

    if (error) throw error;

    res.status(200).json({ message: 'Transaction updated successfully' });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// DELETE /transactions/:id
router.delete('/:id', async (req, res) => {
  const trackingid = req.params.id;

  if (!trackingid) {
    return res.status(400).json({ error: 'Invalid tracking ID' });
  }

  try {
    const { data: existing, error: findError } = await supabase
      .from('tblTransactions')
      .select('trackingid')
      .eq('trackingid', trackingid)
      .maybeSingle();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const { error } = await supabase
      .from('tblTransactions')
      .delete()
      .eq('trackingid', trackingid);

    if (error) throw error;

    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

module.exports = router;
