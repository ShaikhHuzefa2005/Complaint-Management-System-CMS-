// controllers/adminController.js
const db = require('../config/db');

// GET /admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'open') AS open,
        SUM(status = 'in_progress') AS in_progress,
        SUM(status = 'resolved') AS resolved
      FROM complaints
    `);

    const [recent] = await db.query(`
      SELECT c.id, c.title, c.category, c.status, c.created_at,
             u.name AS student_name, s.name AS staff_name
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      LEFT JOIN users s ON c.assigned_staff_id = s.id
      ORDER BY c.created_at DESC LIMIT 5
    `);

    const [chartData] = await db.query(`
      SELECT status, COUNT(*) as count FROM complaints GROUP BY status
    `);

    const [[userStats]] = await db.query(`
      SELECT
        SUM(role='student') AS students,
        SUM(role='staff') AS staff,
        SUM(role='admin') AS admins
      FROM users
    `);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard • CMS',
      user: req.session.user,
      stats: stats || { total: 0, open: 0, in_progress: 0, resolved: 0 },
      recent, chartData, userStats,
      active: 'dashboard',
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error(err);
    res.render('admin/dashboard', { title: 'Admin Dashboard', user: req.session.user, stats: { total: 0, open: 0, in_progress: 0, resolved: 0 }, recent: [], chartData: [], userStats: {}, active: 'dashboard', error: [], success: [] });
  }
};

// GET /admin/complaints
exports.getComplaints = async (req, res) => {
  try {
    const [complaints] = await db.query(`
      SELECT c.id, c.title, c.category, c.status, c.created_at,
             u.name AS student_name, s.name AS staff_name, s.id AS staff_id
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      LEFT JOIN users s ON c.assigned_staff_id = s.id
      ORDER BY c.created_at DESC
    `);

    const [staffList] = await db.query(`SELECT id, name FROM users WHERE role = 'staff' AND is_active = 1`);

    res.render('admin/complaints', {
      title: 'All Complaints • CMS',
      user: req.session.user,
      complaints, staffList,
      active: 'complaints',
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/dashboard');
  }
};

// GET /admin/complaints/:id
exports.getComplaintDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const [[complaint]] = await db.query(`
      SELECT c.*, u.name AS student_name, u.email AS student_email,
             s.name AS staff_name
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      LEFT JOIN users s ON c.assigned_staff_id = s.id
      WHERE c.id = ?
    `, [id]);
    if (!complaint) { req.flash('error', 'Complaint not found.'); return res.redirect('/admin/complaints'); }

    const [comments] = await db.query(`
      SELECT cm.*, u.name, u.role FROM comments cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.complaint_id = ? ORDER BY cm.created_at ASC
    `, [id]);

    const [staffList] = await db.query(`SELECT id, name FROM users WHERE role = 'staff' AND is_active = 1`);

    const [logs] = await db.query(`
      SELECT al.*, u.name FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.complaint_id = ? ORDER BY al.timestamp DESC LIMIT 10
    `, [id]);

    res.render('admin/complaint-detail', {
      title: `${complaint.title} • CMS`,
      user: req.session.user,
      complaint, comments, staffList, logs,
      active: 'complaints',
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/complaints');
  }
};

// POST /admin/complaints/:id/manage
exports.manageComplaint = async (req, res) => {
  const { status, assigned_staff_id } = req.body;
  const { id } = req.params;
  const adminId = req.session.user.id;
  try {
    const staffId = assigned_staff_id && assigned_staff_id !== '' ? assigned_staff_id : null;
    await db.query(
      'UPDATE complaints SET status = ?, assigned_staff_id = ? WHERE id = ?',
      [status, staffId, id]
    );
    await db.query(
      'INSERT INTO activity_logs (complaint_id, action, user_id) VALUES (?, ?, ?)',
      [id, `Admin updated: status=${status}, staff=${staffId || 'unassigned'}`, adminId]
    );
    req.flash('success', 'Complaint updated successfully.');
    res.redirect(`/admin/complaints/${id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Update failed.');
    res.redirect(`/admin/complaints/${id}`);
  }
};

// POST /admin/complaints/:id/comment
exports.postComment = async (req, res) => {
  const { message } = req.body;
  const { id } = req.params;
  const userId = req.session.user.id;
  if (!message?.trim()) { req.flash('error', 'Comment is empty.'); return res.redirect(`/admin/complaints/${id}`); }
  try {
    await db.query('INSERT INTO comments (complaint_id, user_id, message) VALUES (?, ?, ?)', [id, userId, message]);
    req.flash('success', 'Comment added.');
    res.redirect(`/admin/complaints/${id}`);
  } catch (err) {
    res.redirect(`/admin/complaints/${id}`);
  }
};

// GET /admin/users
exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC');
    res.render('admin/users', {
      title: 'Users • CMS',
      user: req.session.user,
      users,
      active: 'users',
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    res.redirect('/admin/dashboard');
  }
};

// POST /admin/users/:id/toggle
exports.toggleUser = async (req, res) => {
  const { id } = req.params;
  const adminId = req.session.user.id;
  if (parseInt(id) === adminId) { req.flash('error', 'Cannot deactivate your own account.'); return res.redirect('/admin/users'); }
  try {
    await db.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [id]);
    req.flash('success', 'User status updated.');
    res.redirect('/admin/users');
  } catch (err) {
    req.flash('error', 'Failed to update user.');
    res.redirect('/admin/users');
  }
};

// POST /admin/users/:id/delete
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const adminId = req.session.user.id;
  if (parseInt(id) === adminId) { req.flash('error', 'Cannot delete your own account.'); return res.redirect('/admin/users'); }
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    req.flash('success', 'User deleted.');
    res.redirect('/admin/users');
  } catch (err) {
    req.flash('error', 'Failed to delete user.');
    res.redirect('/admin/users');
  }
};

// API: GET /api/admin/stats
exports.apiStats = async (req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT COUNT(*) AS total, SUM(status='open') AS open,
             SUM(status='in_progress') AS in_progress, SUM(status='resolved') AS resolved
      FROM complaints
    `);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
