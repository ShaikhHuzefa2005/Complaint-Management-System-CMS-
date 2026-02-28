// routes/student.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/studentController');
const { isStudent } = require('../middleware/auth');

router.use(isStudent);

router.get('/dashboard', ctrl.getDashboard);
router.get('/complaints', ctrl.getComplaints);
router.get('/complaints/:id', ctrl.getComplaintDetail);
router.post('/complaints/:id/comment', ctrl.postComment);
router.get('/new-complaint', ctrl.getNewComplaint);
router.post('/new-complaint', ctrl.postNewComplaint);
router.get('/profile', ctrl.getProfile);
router.post('/profile/change-password', ctrl.changePassword);

module.exports = router;
