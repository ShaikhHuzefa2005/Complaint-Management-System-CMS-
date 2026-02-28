// middleware/auth.js — Role-based access control

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error', 'Please login to continue.');
  res.redirect('/login');
}

function isStudent(req, res, next) {
  if (req.session?.user?.role === 'student') return next();
  res.redirect('/login');
}

function isStaff(req, res, next) {
  if (req.session?.user?.role === 'staff') return next();
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.session?.user?.role === 'admin') return next();
  res.redirect('/login');
}

function isStaffOrAdmin(req, res, next) {
  const role = req.session?.user?.role;
  if (role === 'staff' || role === 'admin') return next();
  res.redirect('/login');
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session?.user) {
    const role = req.session.user.role;
    if (role === 'admin') return res.redirect('/admin/dashboard');
    if (role === 'staff') return res.redirect('/staff/dashboard');
    return res.redirect('/student/dashboard');
  }
  next();
}

module.exports = { isAuthenticated, isStudent, isStaff, isAdmin, isStaffOrAdmin, redirectIfAuthenticated };
