const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// GET /clients?page=1&limit=10
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const dataResult = await pool.query(`
      SELECT 
        clientid,
        clientname,
        email,
        CASE 
          WHEN isactive THEN 'Active'
          ELSE 'Inactive'
        END AS status,
        created_at
      FROM tblclients
      ORDER BY clientid ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await pool.query(`SELECT COUNT(*) FROM tblclients`);
    const total = parseInt(countResult.rows[0].count, 10);

    res.status(200).json({
      clients: dataResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
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
    await pool.query(`
      INSERT INTO tblclients (clientname, email, isactive)
      VALUES ($1, $2, $3)
    `, [clientName, email, isActive]);

    res.status(201).json({ message: 'Client added successfully' });
  } catch (error) {
    console.error('Error adding client:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Client with the same name or email already exists' });
    }
    res.status(500).json({ error: 'Failed to add client' });
  }
});

// PUT /clients/:id
router.put('/:id', async (req, res) => {
  const clientId = parseInt(req.params.id);
  const { clientName, email, isActive } = req.body;

  if (!clientId || !clientName || !email || typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'clientId, clientName, email, and isActive (boolean) are required' });
  }

  try {
    const existingClient = await pool.query(
      'SELECT * FROM tblclients WHERE clientid = $1',
      [clientId]
    );

    if (existingClient.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await pool.query(`
      UPDATE tblclients
      SET clientname = $1,
          email = $2,
          isactive = $3
      WHERE clientid = $4
    `, [clientName, email, isActive, clientId]);

    res.status(200).json({ message: 'Client updated successfully' });
  } catch (error) {
    console.error('Error updating client:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Client with the same name or email already exists' });
    }
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /clients/:id
router.delete('/:id', async (req, res) => {
  const clientId = parseInt(req.params.id);

  if (!clientId) {
    return res.status(400).json({ error: 'Invalid client ID' });
  }

  try {
    const existing = await pool.query(
      'SELECT clientid FROM tblclients WHERE clientid = $1',
      [clientId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await pool.query(
      'DELETE FROM tblclients WHERE clientid = $1',
      [clientId]
    );

    res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;
