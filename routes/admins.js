const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// GET - fetch paginated admins
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const dataQuery = `
      SELECT admin_id, username, email, created_at
      FROM tblAdmins
      ORDER BY admin_id ASC
      OFFSET $1 LIMIT $2
    `;
    const countQuery = `SELECT COUNT(*) AS total FROM tblAdmins`;

    const dataResult = await pool.query(dataQuery, [offset, limit]);
    const countResult = await pool.query(countQuery);

    const total = parseInt(countResult.rows[0].total);

    res.status(200).json({
      admins: dataResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});


// PUT - update an admin
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;

  try {
    // Check for duplicate username (excluding current admin)
    const existingUserResult = await pool.query(
      `SELECT admin_id FROM tblAdmins WHERE username = $1 AND admin_id != $2`,
      [username, id]
    );

    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    // Proceed to update
    await pool.query(
      `UPDATE tblAdmins SET username = $1, email = $2 WHERE admin_id = $3`,
      [username, email, id]
    );

    res.status(200).json({ message: 'Admin updated successfully' });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ error: 'Failed to update admin' });
  }
});


// DELETE - delete an admin
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`DELETE FROM tblAdmins WHERE admin_id = $1`, [id]);
    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

module.exports = router;
