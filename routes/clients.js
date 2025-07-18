const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabaseClient');

// GET /clients?page=1&limit=10
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Fetch paginated clients
    const { data: clients, error } = await supabase
      .from('tblClients')
      .select(`
        clientid,
        clientName,
        email,
        isactive,
        created_at
      `)
      .order('clientid', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get total count
    const { count, error: countError } = await supabase
      .from('tblClients')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Transform status text
    const transformedClients = clients.map(client => ({
      ...client,
      status: client.isactive ? 'Active' : 'Inactive'
    }));

    res.status(200).json({
      clients: transformedClients,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error fetching clients:', error.message || error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// POST /clients
router.post('/', async (req, res) => {
  const { clientName, email, isActive } = req.body;

  if (!clientName || !email || typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'clientName, email, and isActive (boolean) are required' });
  }

  try {
    const { error } = await supabase
      .from('tblClients')
      .insert([{
        clientName: clientName,
        email,
        isactive: isActive
      }]);

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Client with the same name or email already exists' });
      }
      throw error;
    }

    res.status(201).json({ message: 'Client added successfully' });
  } catch (error) {
    console.error('Error adding client:', error.message || error);
    res.status(500).json({ error: 'Failed to add client' });
  }
});

// PUT /clients/:id
router.put('/:id', async (req, res) => {
  const clientid = parseInt(req.params.id);
  const { clientName, email, isActive } = req.body;

  if (!clientid || !clientName || !email || typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'clientId, clientName, email, and isActive (boolean) are required' });
  }

  try {
    // Check if client exists
    const { data: existingClient, error: findError } = await supabase
      .from('tblClients')
      .select('clientid')
      .eq('clientid', clientid)
      .single();

    if (findError || !existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Update client
    const { error: updateError } = await supabase
      .from('tblClients')
      .update({
        clientName: clientName,
        email,
        isactive: isActive
      })
      .eq('clientid', clientid);

    if (updateError) {
      if (updateError.code === '23505') {
        return res.status(409).json({ error: 'Client with the same name or email already exists' });
      }
      throw updateError;
    }

    res.status(200).json({ message: 'Client updated successfully' });
  } catch (error) {
    console.error('Error updating client:', error.message || error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /clients/:id
router.delete('/:id', async (req, res) => {
  const idParam = req.params.id;
  const clientid = parseInt(idParam);
  console.log('DELETE request for clientId:', idParam);

  if (!clientid) {
    return res.status(400).json({ error: 'Invalid client ID' });
  }

  try {
    // Check if client exists
    const { data: existing, error: findError } = await supabase
      .from('tblClients')
      .select('clientid')
      .eq('clientid', clientid)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Delete client
    const { error: deleteError } = await supabase
      .from('tblClients')
      .delete()
      .eq('clientid', clientid);

    if (deleteError) throw deleteError;

    res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error.message || error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;
