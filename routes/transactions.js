// routes/transactions.js
const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');

// GET transaction by ID
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id); // ensure it's an integer

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  try {
    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM tblTransactions WHERE trackingId = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching transaction by ID:', err);
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
        t.trackingStatusId, 
        t.created_at
      FROM tblTransactions t
      INNER JOIN tblClients c ON t.clientId = c.clientId
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

module.exports = router;
