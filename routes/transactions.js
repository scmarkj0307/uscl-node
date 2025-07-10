// routes/transactions.js
const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');
const crypto = require('crypto');

function generateTrackingId() {
  const now = Date.now().toString(36).toUpperCase(); // timestamp base36
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  return `TRX-${now}-${rand}`;
}



// GET transaction by trackingId (string)
router.get('/:id', async (req, res) => {
  const trackingId = req.params.id; // treat it as string

  if (!trackingId || typeof trackingId !== 'string') {
    return res.status(400).json({ error: 'Invalid tracking ID' });
  }

  try {
    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .input('trackingId', sql.NVarChar, trackingId)
      .query(`
        SELECT 
          t.trackingId, 
          t.clientId,
          c.clientName,
          t.trackingMessage, 
          s.statusName, 
          t.created_at
        FROM tblTransactions t
        INNER JOIN tblClients c ON t.clientId = c.clientId
        INNER JOIN tblStatus s ON t.trackingStatusId = s.Id
        WHERE t.trackingId = @trackingId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching transaction by tracking ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET all transactions with pagination
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const pool = await sql.connect(config);

    const dataResult = await pool.request().query(`
      SELECT 
        t.trackingId, 
        t.clientId,
        c.clientName, 
        t.trackingMessage, 
        s.statusName, 
        t.created_at
      FROM tblTransactions t
      INNER JOIN tblClients c ON t.clientId = c.clientId
      INNER JOIN tblStatus s ON t.trackingStatusId = s.Id
      ORDER BY t.trackingId ASC
      OFFSET ${offset} ROWS
      FETCH NEXT ${limit} ROWS ONLY
    `);

    const countResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM tblTransactions
    `);

    const total = countResult.recordset[0].total;

    res.status(200).json({
      transactions: dataResult.recordset,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});


// POST a new transaction with retry on duplicate trackingId
router.post('/', async (req, res) => {
  const { clientId, trackingMessage, trackingStatusId } = req.body;

  if (!clientId || !trackingMessage || !trackingStatusId) {
    return res.status(400).json({
      error: 'clientId, trackingMessage, and trackingStatusId are required',
    });
  }

  const pool = await sql.connect(config);

  let trackingId;
  let inserted = false;
  let attempts = 0;
  const maxAttempts = 5;

  while (!inserted && attempts < maxAttempts) {
    trackingId = generateTrackingId();
    attempts++;

    try {
      await pool.request()
        .input('trackingId', sql.NVarChar(50), trackingId)
        .input('clientId', sql.Int, clientId)
        .input('trackingMessage', sql.NVarChar(255), trackingMessage)
        .input('trackingStatusId', sql.Int, trackingStatusId)
        .query(`
          INSERT INTO tblTransactions (trackingId, clientId, trackingMessage, trackingStatusId)
          VALUES (@trackingId, @clientId, @trackingMessage, @trackingStatusId)
        `);

      inserted = true;

      res.status(201).json({
        message: 'Transaction created successfully',
        trackingId
      });

    } catch (error) {
      if (error.originalError?.info?.number === 2627) {
        console.warn(`Duplicate trackingId on attempt ${attempts}: ${trackingId}`);
        continue; // try again
      }

      console.error('Error creating transaction:', error);
      return res.status(500).json({ error: 'Failed to create transaction' });
    }
  }

  if (!inserted) {
    return res.status(500).json({
      error: 'Failed to generate a unique tracking ID. Please try again.'
    });
  }
});


module.exports = router;
