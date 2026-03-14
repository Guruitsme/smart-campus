const express = require('express');
const router = express.Router();
const { uploadSubmission: uploadFile } = require('../config/cloudinary');
const {
  createAssignment, getAssignments, submitAssignment,
  getSubmissions, gradeSubmission, deleteAssignment,
} = require('../controllers/assignment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', getAssignments);
router.post('/', authorize('faculty', 'admin'), uploadFile.single('attachment'), createAssignment);
router.post('/:id/submit', authorize('student'), uploadFile.single('file'), submitAssignment);
router.get('/:id/submissions', authorize('faculty', 'admin'), getSubmissions);
router.put('/submissions/:submissionId/grade', authorize('faculty', 'admin'), gradeSubmission);
router.delete('/:id', authorize('faculty', 'admin'), deleteAssignment);

module.exports = router;
