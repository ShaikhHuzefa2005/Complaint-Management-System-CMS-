// server.js — CMS Entry Point
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'cms_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

app.use(flash());

// Global locals for all views
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.currentUser = req.session.user || null;
  next();
});

// Routes
app.get('/', (req, res) => res.render('index', { title: 'CMS - Complaint Management System', user: req.session.user || null }));
app.use('/', require('./routes/auth'));
app.use('/student', require('./routes/student'));
app.use('/staff', require('./routes/staff'));
app.use('/admin', require('./routes/admin'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: '404 • CMS', user: req.session.user || null });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(PORT, () => {
  console.log(`✅ CMS Server running at http://localhost:${PORT}`);
});
