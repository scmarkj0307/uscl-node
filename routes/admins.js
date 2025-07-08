const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const pool = await sql.connect(config);

    const dataResult = await pool.request().query(`
      SELECT admin_id, username, email, created_at
      FROM tblAdmins
      ORDER BY admin_id ASC
      OFFSET ${offset} ROWS
      FETCH NEXT ${limit} ROWS ONLY
    `);

    const countResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM tblAdmins
    `);

    const total = countResult.recordset[0].total;
    res.status(200).json({
      admins: dataResult.recordset,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

module.exports = router;
