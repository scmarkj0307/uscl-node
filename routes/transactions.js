const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const crypto = require('crypto');

function generateTrackingId() {
  const now = Date.now().toString(36).toUpperCase(); // timestamp base36
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  return `TRX-${now}-${rand}`;
}

// GET /transactions/:id
router.get('/:id', async (req, res) => {
  const trackingId = req.params.id;

  if (!trackingId || typeof trackingId !== 'string') {
    return res.status(400).json({ error: 'Invalid tracking ID' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        t.trackingid, 
        t.clientid,
        c.clientname,
        t.trackingmessage,
        t.description, 
        s.statusname, 
        t.created_at
      FROM tbltransactions t
      INNER JOIN tblclients c ON t.clientid = c.clientid
      INNER JOIN tblstatus s ON t.trackingstatusid = s.id
      WHERE t.trackingid = $1
    `, [trackingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching transaction by tracking ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /transactions?page=1&limit=10
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const dataResult = await pool.query(`
      SELECT 
        t.trackingid, 
        t.clientid,
        c.clientname, 
        t.trackingmessage,
        t.description, 
        s.statusname, 
        t.created_at
      FROM tbltransactions t
      INNER JOIN tblclients c ON t.clientid = c.clientid
      INNER JOIN tblstatus s ON t.trackingstatusid = s.id
      ORDER BY t.trackingid ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await pool.query(`SELECT COUNT(*) AS total FROM tbltransactions`);
    const total = parseInt(countResult.rows[0].total, 10);

    res.status(200).json({
      transactions: dataResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /transactions
router.post('/', async (req, res) => {
  const { clientId, trackingMessage, trackingStatusId, description } = req.body;

  if (!clientId || !trackingMessage || !trackingStatusId) {
    return res.status(400).json({
      error: 'clientId, trackingMessage, and trackingStatusId are required',
    });
  }

  let trackingId;
  let inserted = false;
  let attempts = 0;
  const maxAttempts = 5;

  while (!inserted && attempts < maxAttempts) {
    trackingId = generateTrackingId();
    attempts++;

    try {
      // Check for duplicate
      const existing = await pool.query(
        'SELECT trackingid FROM tbltransactions WHERE trackingid = $1',
        [trackingId]
      );

      if (existing.rows.length > 0) {
        console.warn(`Duplicate trackingId on attempt ${attempts}: ${trackingId}`);
        continue;
      }

      await pool.query(`
        INSERT INTO tbltransactions (trackingid, clientid, trackingmessage, trackingstatusid, description)
        VALUES ($1, $2, $3, $4, $5)
      `, [trackingId, clientId, trackingMessage, trackingStatusId, description || null]);

      inserted = true;
      res.status(201).json({ message: 'Transaction created successfully', trackingId });
    } catch (error) {
      console.error('Error creating transaction:', error);
      return res.status(500).json({ error: 'Failed to create transaction' });
    }
  }

  if (!inserted) {
    res.status(500).json({
      error: 'Failed to generate a unique tracking ID. Please try again.'
    });
  }
});

// PUT /transactions/:id
router.put('/:id', async (req, res) => {
  const trackingId = req.params.id;
  const { clientId, trackingMessage, trackingStatusId, description } = req.body;

  if (!trackingId || !clientId || !trackingMessage || !trackingStatusId) {
    return res.status(400).json({
      error: 'trackingId, clientId, trackingMessage, and trackingStatusId are required',
    });
  }

  try {
    const existing = await pool.query(
      'SELECT trackingid FROM tbltransactions WHERE trackingid = $1',
      [trackingId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await pool.query(`
      UPDATE tbltransactions
      SET clientid = $1,
          trackingmessage = $2,
          trackingstatusid = $3,
          description = $4
      WHERE trackingid = $5
    `, [clientId, trackingMessage, trackingStatusId, description || null, trackingId]);

    res.status(200).json({ message: 'Transaction updated successfully' });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// DELETE /transactions/:id
router.delete('/:id', async (req, res) => {
  const trackingId = req.params.id;

  if (!trackingId) {
    return res.status(400).json({ error: 'Invalid tracking ID' });
  }

  try {
    const existing = await pool.query(
      'SELECT trackingid FROM tbltransactions WHERE trackingid = $1',
      [trackingId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await pool.query('DELETE FROM tbltransactions WHERE trackingid = $1', [trackingId]);

    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

module.exports = router;
