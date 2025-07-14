// routes/transactionHistory.js
const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const clientNameFilter = req.query.clientName || ''; // ✅ New filter
  const offset = (page - 1) * limit;

  try {
    const pool = await sql.connect(config);

    // Build WHERE clause
    const whereClause = clientNameFilter
      ? `WHERE c.clientName LIKE '%' + @clientName + '%'`
      : '';

    // Main data query
    const dataResult = await pool.request()
      .input('clientName', sql.NVarChar, clientNameFilter)
      .query(`
        SELECT 
          th.historyId,
          th.trackingId,
          th.clientId,
          c.clientName,
          th.trackingMessage,
          th.description,
          s.statusName,
          th.created_at,
          th.changed_at
        FROM tblTransactionHistory th
        INNER JOIN tblClients c ON th.clientId = c.clientId
        INNER JOIN tblStatus s ON th.trackingStatusId = s.Id
        ${whereClause}
        ORDER BY th.historyId ASC
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY
      `);

    // Count query
    const countResult = await pool.request()
      .input('clientName', sql.NVarChar, clientNameFilter)
      .query(`
        SELECT COUNT(*) as total
        FROM tblTransactionHistory th
        INNER JOIN tblClients c ON th.clientId = c.clientId
        ${whereClause}
      `);

    const total = countResult.recordset[0].total;

    res.status(200).json({
      history: dataResult.recordset,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});


// DELETE /transaction-history/:id
router.delete('/:id', async (req, res) => {
  const trackingId = req.params.id;

  if (!trackingId) {
    return res.status(400).json({ error: 'Invalid history ID' });
  }

  try {
    const pool = await sql.connect(config);

    // Check if record exists
    const existing = await pool.request()
      .input('trackingId', sql.NVarChar(50), trackingId)
      .query('SELECT trackingId FROM tblTransactionHistory WHERE trackingId = @trackingId');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: 'Transaction history not found' });
    }

    // Delete the record
    await pool.request()
      .input('trackingId', sql.NVarChar(50), trackingId)
      .query('DELETE FROM tblTransactionHistory WHERE trackingId = @trackingId');

    res.status(200).json({ message: 'Transaction history deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction history:', error);
    res.status(500).json({ error: 'Failed to delete transaction history' });
  }
});


module.exports = router;
