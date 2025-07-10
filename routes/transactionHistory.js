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


module.exports = router;
