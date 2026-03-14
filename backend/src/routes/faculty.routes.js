const express = require('express');
const router = express.Router();
const { getFacultyDashboard, uploadMarks, getStudentPerformance } = require('../controllers/faculty.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('faculty', 'admin'));
router.get('/dashboard', getFacultyDashboard);
router.post('/marks', uploadMarks);
router.get('/performance/:subjectId', getStudentPerformance);

module.exports = router;
