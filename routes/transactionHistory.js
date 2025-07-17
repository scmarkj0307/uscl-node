const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// GET /transaction-history
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const clientNameFilter = req.query.clientName || '';
  const offset = (page - 1) * limit;

  try {
    const values = [];
    let whereClause = '';
    
    if (clientNameFilter) {
      values.push(`%${clientNameFilter}%`);
      whereClause = `WHERE c.clientname ILIKE $${values.length}`;
    }

    // Main paginated query
    const dataQuery = `
      SELECT 
        th.historyid,
        th.trackingid,
        th.clientid,
        c.clientname,
        th.trackingmessage,
        th.description,
        s.statusname,
        th.created_at,
        th.changed_at
      FROM tbltransactionhistory th
      INNER JOIN tblclients c ON th.clientid = c.clientid
      INNER JOIN tblstatus s ON th.trackingstatusid = s.id
      ${whereClause}
      ORDER BY th.historyid ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const dataResult = await pool.query(dataQuery, values);

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tbltransactionhistory th
      INNER JOIN tblclients c ON th.clientid = c.clientid
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    res.status(200).json({
      history: dataResult.rows,
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
    // Check if record exists
    const checkResult = await pool.query(
      'SELECT trackingid FROM tbltransactionhistory WHERE trackingid = $1',
      [trackingId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction history not found' });
    }

    // Delete record
    await pool.query(
      'DELETE FROM tbltransactionhistory WHERE trackingid = $1',
      [trackingId]
    );

    res.status(200).json({ message: 'Transaction history deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction history:', error);
    res.status(500).json({ error: 'Failed to delete transaction history' });
  }
});

module.exports = router;
