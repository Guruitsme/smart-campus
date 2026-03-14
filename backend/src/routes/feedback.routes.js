// feedback.routes.js
const express = require('express');
const router = express.Router();
const { submitFeedback, getFacultyFeedbackAnalytics, getAllFeedbackAnalytics } = require('../controllers/feedback.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.post('/', authorize('student'), submitFeedback);
router.get('/analytics', authorize('admin'), getAllFeedbackAnalytics);
router.get('/analytics/:facultyId', authorize('faculty', 'admin'), getFacultyFeedbackAnalytics);

module.exports = router;
