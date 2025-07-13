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


// PUT - update an admin
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;

  try {
    const pool = await sql.connect(config);

    // Check for duplicate username (excluding current admin)
    const existingUserResult = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('id', sql.Int, id)
      .query(`
        SELECT admin_id FROM tblAdmins 
        WHERE username = @username AND admin_id != @id
      `);

    if (existingUserResult.recordset.length > 0) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    // Proceed to update
    await pool.request()
      .input('id', sql.Int, id)
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .query(`
        UPDATE tblAdmins
        SET username = @username,
            email = @email
        WHERE admin_id = @id
      `);

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
    const pool = await sql.connect(config);
    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM tblAdmins WHERE admin_id = @id`);

    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});


module.exports = router;
