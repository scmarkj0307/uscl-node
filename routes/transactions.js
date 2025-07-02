// routes/transactions.js
const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');

// GET transaction by ID
router.get('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM tblTransactions WHERE trackingId = @id');

    if (result.recordset.length === 0) {
      return res.status(404).send('Transaction not found');
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
