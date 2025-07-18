const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabaseClient');

// GET /transaction-history
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const clientNameFilter = req.query.clientName || '';

  try {
    // Initial query
    let { data, error } = await supabase
      .from('tbltransactionhistory')
      .select(`
        historyid,
        trackingid,
        clientid,
        trackingmessage,
        description,
        created_at,
        changed_at,
        tblClients (clientName),
        tblStatus (statusname)
      `)
      .order('historyid', { ascending: true })
      .range(offset, offset + limit - 1);

    // ✅ Check if error occurred or data is null
    if (error || !data) {
      throw error || new Error('No data returned from Supabase');
    }

    // Apply clientName filter manually (since Supabase cannot filter on joined data directly)
    if (clientNameFilter) {
      data = data.filter(entry =>
        entry.tblClients?.clientName?.toLowerCase().includes(clientNameFilter.toLowerCase())
      );
    }

    // Total count query (counting unpaginated rows)
    const { count, error: countError } = await supabase
      .from('tbltransactionhistory')
      .select('historyid', { count: 'exact', head: true });

    if (countError) throw countError;

    // Transform data for frontend
    const history = data.map((h) => ({
      historyid: h.historyid,
      trackingid: h.trackingid,
      clientid: h.clientid,
      clientName: h.tblClients?.clientName || '',
      trackingmessage: h.trackingmessage,
      description: h.description,
      statusname: h.tblStatus?.statusname || '',
      created_at: h.created_at,
      changed_at: h.changed_at,
    }));

    res.status(200).json({
      history,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});



// DELETE /transaction-history/:id
router.delete('/:id', async (req, res) => {
  const trackingid = req.params.id;
  if (!trackingid) {
    return res.status(400).json({ error: 'Invalid history ID' });
  }

  try {
    // Check if record exists
    const { data: existing, error: findError } = await supabase
      .from('tbltransactionhistory')
      .select('trackingid')
      .eq('trackingid', trackingid)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Transaction history not found' });
    }

    // Delete
    const { error: deleteError } = await supabase
      .from('tbltransactionhistory')
      .delete()
      .eq('trackingid', trackingid);

    if (deleteError) throw deleteError;

    res.status(200).json({ message: 'Transaction history deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction history:', error.message || error);
    res.status(500).json({ error: 'Failed to delete transaction history' });
  }
});

module.exports = router;
