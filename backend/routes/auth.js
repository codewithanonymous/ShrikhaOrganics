const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();


// ==========================
// ADMIN LOGIN (SEPARATE TABLE)
// ==========================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 🔥 IMPORTANT: check ADMINS table (not users)
    const result = await pool.query(
      'SELECT * FROM admins WHERE email=$1 AND password=$2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: 'admin'
      },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
