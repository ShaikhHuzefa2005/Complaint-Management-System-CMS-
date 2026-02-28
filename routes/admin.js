// routes/admin.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');

router.use(isAdmin);

router.get('/dashboard', ctrl.getDashboard);
router.get('/complaints', ctrl.getComplaints);
router.get('/complaints/:id', ctrl.getComplaintDetail);
router.post('/complaints/:id/manage', ctrl.manageComplaint);
router.post('/complaints/:id/comment', ctrl.postComment);
router.get('/users', ctrl.getUsers);
router.post('/users/:id/toggle', ctrl.toggleUser);
router.post('/users/:id/delete', ctrl.deleteUser);
router.get('/api/stats', ctrl.apiStats);

module.exports = router;
