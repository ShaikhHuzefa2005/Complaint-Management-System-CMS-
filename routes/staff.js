// routes/staff.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/staffController');
const { isStaff } = require('../middleware/auth');

router.use(isStaff);

router.get('/dashboard', ctrl.getDashboard);
router.get('/complaints', ctrl.getComplaints);
router.get('/complaints/:id', ctrl.getComplaintDetail);
router.post('/complaints/:id/update', ctrl.updateComplaint);
router.get('/profile', ctrl.getProfile);
router.post('/profile/change-password', ctrl.changePassword);

module.exports = router;
