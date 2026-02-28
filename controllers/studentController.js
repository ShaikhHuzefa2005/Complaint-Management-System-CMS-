// controllers/studentController.js
const db = require('../config/db');

// GET /student/dashboard
exports.getDashboard = async (req, res) => {
  const userId = req.session.user.id;
  try {
    const [[stats]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'open') AS open,
        SUM(status = 'in_progress') AS in_progress,
        SUM(status = 'resolved') AS resolved
      FROM complaints WHERE student_id = ?
    `, [userId]);

    const [recent] = await db.query(`
      SELECT id, title, category, status, created_at
      FROM complaints WHERE student_id = ?
      ORDER BY created_at DESC LIMIT 5
    `, [userId]);

    const [chartData] = await db.query(`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM complaints
      WHERE student_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `, [userId]);

    res.render('student/dashboard', {
      title: 'Student Dashboard • CMS',
      user: req.session.user,
      stats, recent, chartData,
      active: 'dashboard',
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error(err);
    res.render('student/dashboard', { title: 'Dashboard', user: req.session.user, stats: {}, recent: [], chartData: [], active: 'dashboard', error: ['Failed to load data.'], success: [] });
  }
};

// GET /student/complaints
exports.getComplaints = async (req, res) => {
  const userId = req.session.user.id;
  try {
    const [complaints] = await db.query(`
      SELECT id, title, category, status, created_at
      FROM complaints WHERE student_id = ?
      ORDER BY created_at DESC
    `, [userId]);
    res.render('student/complaints', {
      title: 'My Complaints • CMS',
      user: req.session.user,
      complaints,
      active: 'complaints',
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error(err);
    res.redirect('/student/dashboard');
  }
};

// GET /student/complaints/:id
exports.getComplaintDetail = async (req, res) => {
  const userId = req.session.user.id;
  const { id } = req.params;
  try {
    const [[complaint]] = await db.query(`
      SELECT c.*, u.name AS student_name, s.name AS staff_name
      FROM complaints c
      LEFT JOIN users u ON c.student_id = u.id
      LEFT JOIN users s ON c.assigned_staff_id = s.id
      WHERE c.id = ? AND c.student_id = ?
    `, [id, userId]);
    if (!complaint) { req.flash('error', 'Complaint not found.'); return res.redirect('/student/complaints'); }

    const [comments] = await db.query(`
      SELECT cm.*, u.name, u.role FROM comments cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.complaint_id = ? ORDER BY cm.created_at ASC
    `, [id]);

    res.render('student/complaint-detail', {
      title: `${complaint.title} • CMS`,
      user: req.session.user,
      complaint, comments,
      active: 'complaints',
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error(err);
    res.redirect('/student/complaints');
  }
};

// GET /student/new-complaint
exports.getNewComplaint = (req, res) => {
  res.render('student/new-complaint', {
    title: 'New Complaint • CMS',
    user: req.session.user,
    active: 'new-complaint',
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// POST /student/new-complaint
exports.postNewComplaint = async (req, res) => {
  const { title, category, description } = req.body;
  const userId = req.session.user.id;
  if (!title || !category || !description) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/student/new-complaint');
  }
  if (description.length < 20) {
    req.flash('error', 'Description must be at least 20 characters.');
    return res.redirect('/student/new-complaint');
  }
  try {
    await db.query(
      'INSERT INTO complaints (student_id, title, description, category) VALUES (?, ?, ?, ?)',
      [userId, title, description, category]
    );
    await db.query(
      `INSERT INTO activity_logs (complaint_id, action, user_id) SELECT id, 'Complaint created', ? FROM complaints ORDER BY id DESC LIMIT 1`,
      [userId]
    );
    req.flash('success', 'Complaint submitted successfully!');
    res.redirect('/student/complaints');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to submit complaint.');
    res.redirect('/student/new-complaint');
  }
};

// POST /student/complaints/:id/comment
exports.postComment = async (req, res) => {
  const { message } = req.body;
  const { id } = req.params;
  const userId = req.session.user.id;
  if (!message?.trim()) { req.flash('error', 'Comment cannot be empty.'); return res.redirect(`/student/complaints/${id}`); }
  try {
    await db.query('INSERT INTO comments (complaint_id, user_id, message) VALUES (?, ?, ?)', [id, userId, message]);
    req.flash('success', 'Comment added.');
    res.redirect(`/student/complaints/${id}`);
  } catch (err) {
    console.error(err);
    res.redirect(`/student/complaints/${id}`);
  }
};

// GET /student/profile
exports.getProfile = async (req, res) => {
  const userId = req.session.user.id;
  try {
    const [[user]] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [userId]);
    res.render('student/profile', {
      title: 'Profile • CMS',
      user: req.session.user,
      profile: user,
      active: 'profile',
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    res.redirect('/student/dashboard');
  }
};

// POST /student/profile/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNew } = req.body;
  const userId = req.session.user.id;
  if (newPassword !== confirmNew) { req.flash('error', 'Passwords do not match.'); return res.redirect('/student/profile'); }
  try {
    const [[user]] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    const match = await require('bcrypt').compare(currentPassword, user.password);
    if (!match) { req.flash('error', 'Current password is incorrect.'); return res.redirect('/student/profile'); }
    const hashed = await require('bcrypt').hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
    req.flash('success', 'Password updated successfully.');
    res.redirect('/student/profile');
  } catch (err) {
    req.flash('error', 'Failed to update password.');
    res.redirect('/student/profile');
  }
};
