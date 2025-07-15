const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_secret_key'; // Ideally use process.env.JWT_SECRET

// Register (Sign-up)
router.post('/register', async (req, res) => {
  const {
    username,
    password,
    email,
    isAdmin = false,
    isSuperAdmin = false,
    isDemo = false
  } = req.body;

  // Convert role values to booleans
  const roles = [Boolean(isAdmin), Boolean(isSuperAdmin), Boolean(isDemo)];
  const trueCount = roles.filter(Boolean).length;

  // Validation: At least one and only one role must be true
  if (trueCount === 0) {
    return res.status(400).json({ message: 'At least one role must be true (isAdmin, isSuperAdmin, isDemo).' });
  }

  if (trueCount > 1) {
    return res.status(400).json({ message: 'Only one role can be true at a time (isAdmin, isSuperAdmin, isDemo).' });
  }

  try {
    const pool = await sql.connect(config);

    // Check if username exists
    const checkResult = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .query('SELECT * FROM tblAdmins WHERE username = @username');

    if (checkResult.recordset.length > 0) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new admin with role
    await pool.request()
      .input('username', sql.NVarChar(50), username)
      .input('password', sql.NVarChar(255), hashedPassword)
      .input('email', sql.NVarChar(100), email)
      .input('isAdmin', sql.Bit, isAdmin)
      .input('isSuperAdmin', sql.Bit, isSuperAdmin)
      .input('isDemo', sql.Bit, isDemo)
      .query(`
        INSERT INTO tblAdmins (username, password, email, isAdmin, isSuperAdmin, isDemo)
        VALUES (@username, @password, @email, @isAdmin, @isSuperAdmin, @isDemo)
      `);

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await sql.connect(config);

    const result = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .query('SELECT * FROM tblAdmins WHERE username = @username');

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.recordset[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { admin_id: user.admin_id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
