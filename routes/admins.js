const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabaseClient');

// GET - fetch paginated admins
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const { data: admins, error, count } = await supabase
      .from('tblAdmins')
      .select('admin_id, username, email, created_at', { count: 'exact' })
      .order('admin_id', { ascending: true })
      .range(from, to);

    if (error) throw error;

    res.status(200).json({
      admins,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error fetching admins:', error.message);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// PUT - update an admin
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;

  try {
    // Check for duplicate username
    const { data: existingUser, error: checkError } = await supabase
      .from('tblAdmins')
      .select('admin_id')
      .eq('username', username)
      .neq('admin_id', id);

    if (checkError) throw checkError;
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    const { error: updateError } = await supabase
      .from('tblAdmins')
      .update({ username, email })
      .eq('admin_id', id);

    if (updateError) throw updateError;

    res.status(200).json({ message: 'Admin updated successfully' });
  } catch (error) {
    console.error('Error updating admin:', error.message);
    res.status(500).json({ error: 'Failed to update admin' });
  }
});

// DELETE - delete an admin
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('tblAdmins')
      .delete()
      .eq('admin_id', id);

    if (error) throw error;

    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error.message);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

module.exports = router;
