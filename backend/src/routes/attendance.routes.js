// attendance.routes.js
const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceBySubject, getMyAttendance, updateAttendance } = require('../controllers/attendance.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/my-attendance', authorize('student'), getMyAttendance);
router.get('/subject/:subjectId', authorize('faculty', 'admin'), getAttendanceBySubject);
router.post('/', authorize('faculty', 'admin'), markAttendance);
router.put('/:id', authorize('faculty', 'admin'), updateAttendance);

module.exports = router;
