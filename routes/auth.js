const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabaseClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key'; // Use .env in production

// 🔐 Register
router.post('/register', async (req, res) => {
  const {
    username,
    password,
    email,
    isAdmin = false,
    isSuperAdmin = false,
    isDemo = false
  } = req.body;

  const roles = [isAdmin, isSuperAdmin, isDemo].filter(Boolean);

  if (roles.length === 0) {
    return res.status(400).json({ message: 'At least one role must be true (isAdmin, isSuperAdmin, isDemo).' });
  }

  if (roles.length > 1) {
    return res.status(400).json({ message: 'Only one role can be true at a time.' });
  }

  try {
    // ✅ Check for existing username
    const { data: existingUser, error: findError } = await supabase
      .from('tblAdmins')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    // 🔒 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert new admin
    const { error: insertError } = await supabase
      .from('tblAdmins')
      .insert([{
        username,
        password: hashedPassword,
        email,
        isAdmin,
        isSuperAdmin,
        isDemo
      }]);

    if (insertError) {
      throw insertError;
    }

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    console.error('Register Error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔐 Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const { data: user, error: findError } = await supabase
      .from('tblAdmins')
      .select('*')
      .eq('username', username)
      .single();

    if (findError || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // ✅ Create JWT
    const token = jwt.sign({
      admin_id: user.admin_id,
      username: user.username,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
      isDemo: user.isDemo
    }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login Error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
