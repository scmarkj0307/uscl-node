const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key'; // Use env var in production

// Register
router.post('/register', async (req, res) => {
  const {
    username,
    password,
    email,
    isAdmin = false,
    isSuperAdmin = false,
    isDemo = false
  } = req.body;

  const roles = [Boolean(isAdmin), Boolean(isSuperAdmin), Boolean(isDemo)];
  const trueCount = roles.filter(Boolean).length;

  if (trueCount === 0) {
    return res.status(400).json({ message: 'At least one role must be true (isAdmin, isSuperAdmin, isDemo).' });
  }

  if (trueCount > 1) {
    return res.status(400).json({ message: 'Only one role can be true at a time.' });
  }

  try {
    // Check if username exists
    const checkResult = await pool.query(
      'SELECT * FROM tblAdmins WHERE username = $1',
      [username]
    );

    if (checkResult.rows.length > 0) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new admin
    await pool.query(
      `INSERT INTO tblAdmins (username, password, email, isAdmin, isSuperAdmin, isDemo)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [username, hashedPassword, email, isAdmin, isSuperAdmin, isDemo]
    );

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
    const result = await pool.query(
      'SELECT * FROM tblAdmins WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({
      admin_id: user.admin_id,
      username: user.username,
      isAdmin: user.isadmin,
      isSuperAdmin: user.issuperadmin,
      isDemo: user.isdemo
    }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
