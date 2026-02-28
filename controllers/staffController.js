// controllers/staffController.js
const db = require('../config/db');
const bcrypt = require('bcrypt');

// GET /staff/dashboard
exports.getDashboard = async (req, res) => {
  const userId = req.session.user.id;
  try {
    const [[stats]] = await db.query(`
      SELECT
        COUNT(*) AS assigned,
        SUM(status = 'open') AS open,
        SUM(status = 'in_progress') AS in_progress,
        SUM(status = 'resolved') AS resolved
      FROM complaints WHERE assigned_staff_id = ?
    `, [userId]);

    const [recent] = await db.query(`
      SELECT c.id, c.title, c.category, c.status, u.name AS student_name
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      WHERE c.assigned_staff_id = ?
      ORDER BY c.updated_at DESC LIMIT 5
    `, [userId]);

    const [chartData] = await db.query(`
      SELECT status, COUNT(*) as count FROM complaints
      WHERE assigned_staff_id = ?
      GROUP BY status
    `, [userId]);

    res.render('staff/dashboard', {
      title: 'Staff Dashboard • CMS',
      user: req.session.user,
      stats: stats || { assigned: 0, open: 0, in_progress: 0, resolved: 0 },
      recent, chartData,
      active: 'dashboard',
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error(err);
    res.render('staff/dashboard', { title: 'Dashboard', user: req.session.user, stats: { assigned: 0, open: 0, in_progress: 0, resolved: 0 }, recent: [], chartData: [], active: 'dashboard', error: [], success: [] });
  }
};

// GET /staff/complaints
exports.getComplaints = async (req, res) => {
  const userId = req.session.user.id;
  try {
    const [complaints] = await db.query(`
      SELECT c.id, c.title, c.category, c.status, c.created_at, u.name AS student_name
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      WHERE c.assigned_staff_id = ?
      ORDER BY c.updated_at DESC
    `, [userId]);
    res.render('staff/complaints', {
      title: 'Assigned Complaints • CMS',
      user: req.session.user,
      complaints,
      active: 'complaints',
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    res.redirect('/staff/dashboard');
  }
};

// GET /staff/complaints/:id
exports.getComplaintDetail = async (req, res) => {
  const staffId = req.session.user.id;
  const { id } = req.params;
  try {
    const [[complaint]] = await db.query(`
      SELECT c.*, u.name AS student_name, s.name AS staff_name
      FROM complaints c
      LEFT JOIN users u ON c.student_id = u.id
      LEFT JOIN users s ON c.assigned_staff_id = s.id
      WHERE c.id = ? AND c.assigned_staff_id = ?
    `, [id, staffId]);
    if (!complaint) { req.flash('error', 'Complaint not found.'); return res.redirect('/staff/complaints'); }

    const [comments] = await db.query(`
      SELECT cm.*, u.name, u.role FROM comments cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.complaint_id = ? ORDER BY cm.created_at ASC
    `, [id]);

    res.render('staff/complaint-detail', {
      title: `${complaint.title} • CMS`,
      user: req.session.user,
      complaint, comments,
      active: 'complaints',
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    res.redirect('/staff/complaints');
  }
};

// POST /staff/complaints/:id/update
exports.updateComplaint = async (req, res) => {
  const { status, note } = req.body;
  const { id } = req.params;
  const staffId = req.session.user.id;
  try {
    await db.query('UPDATE complaints SET status = ? WHERE id = ? AND assigned_staff_id = ?', [status, id, staffId]);
    if (note?.trim()) {
      await db.query('INSERT INTO comments (complaint_id, user_id, message) VALUES (?, ?, ?)', [id, staffId, note]);
    }
    await db.query('INSERT INTO activity_logs (complaint_id, action, user_id) VALUES (?, ?, ?)', [id, `Status updated to ${status}`, staffId]);
    req.flash('success', 'Complaint updated successfully.');
    res.redirect(`/staff/complaints/${id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Update failed.');
    res.redirect(`/staff/complaints/${id}`);
  }
};

// GET /staff/profile
exports.getProfile = async (req, res) => {
  const userId = req.session.user.id;
  try {
    const [[profile]] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [userId]);
    res.render('staff/profile', {
      title: 'Profile • CMS',
      user: req.session.user,
      profile,
      active: 'profile',
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    res.redirect('/staff/dashboard');
  }
};

// POST /staff/profile/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNew } = req.body;
  const userId = req.session.user.id;
  if (newPassword !== confirmNew) { req.flash('error', 'Passwords do not match.'); return res.redirect('/staff/profile'); }
  try {
    const [[user]] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) { req.flash('error', 'Current password is incorrect.'); return res.redirect('/staff/profile'); }
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
    req.flash('success', 'Password updated.');
    res.redirect('/staff/profile');
  } catch (err) {
    req.flash('error', 'Failed to update password.');
    res.redirect('/staff/profile');
  }
};
