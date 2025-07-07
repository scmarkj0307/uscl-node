const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');

// GET /clients?page=1&limit=10
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const pool = await sql.connect(config);

    // Fetch paginated clients
    const dataResult = await pool.request().query(`
      SELECT clientId, clientName, email, created_at
      FROM tblClients
      ORDER BY created_at DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${limit} ROWS ONLY
    `);

    // Get total number of clients
    const countResult = await pool.request().query(`
      SELECT COUNT(*) AS total FROM tblClients
    `);

    const total = countResult.recordset[0].total;

    res.status(200).json({
      clients: dataResult.recordset,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

module.exports = router;
