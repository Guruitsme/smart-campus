// student.routes.js
const express = require('express');
const router = express.Router();
const { getStudentDashboard, getMyMarks, getMyTimetable } = require('../controllers/student.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('student'));
router.get('/dashboard', getStudentDashboard);
router.get('/marks', getMyMarks);
router.get('/timetable', getMyTimetable);

module.exports = router;
