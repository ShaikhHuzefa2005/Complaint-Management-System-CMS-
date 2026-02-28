// controllers/authController.js
const bcrypt = require('bcrypt');
const db = require('../config/db');

// GET /login
exports.getLogin = (req, res) => {
  res.render('login', {
    title: 'Login • CMS',
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// POST /login
exports.postLogin = async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/login');
  }
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, role]);
    if (!rows.length) {
      req.flash('error', 'Invalid credentials or role.');
      return res.redirect('/login');
    }
    const user = rows[0];
    if (!user.is_active) {
      req.flash('error', 'Your account has been deactivated. Contact admin.');
      return res.redirect('/login');
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.flash('error', 'Invalid credentials.');
      return res.redirect('/login');
    }
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    if (user.role === 'admin') return res.redirect('/admin/dashboard');
    if (user.role === 'staff') return res.redirect('/staff/dashboard');
    res.redirect('/student/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Server error. Please try again.');
    res.redirect('/login');
  }
};

// GET /register
exports.getRegister = (req, res) => {
  res.render('register', {
    title: 'Register • CMS',
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// POST /register
exports.postRegister = async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body;
  if (!name || !email || !password || !confirmPassword || !role) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/register');
  }
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/register');
  }
  if (password.length < 6) {
    req.flash('error', 'Password must be at least 6 characters.');
    return res.redirect('/register');
  }
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      req.flash('error', 'Email already registered.');
      return res.redirect('/register');
    }
    const hashed = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashed, role]);
    req.flash('success', 'Account created! Please login.');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Registration failed. Try again.');
    res.redirect('/register');
  }
};

// GET /logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
