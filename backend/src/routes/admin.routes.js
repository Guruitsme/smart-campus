const express = require('express');
const router = express.Router();
const {
  getDashboard, getAllStudents, getAllFaculty, createUser, updateUser,
  toggleUserStatus, deleteUser, createSubject, getSubjects, updateSubject,
  deleteSubject, uploadTimetable,
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));
router.get('/dashboard', getDashboard);
router.get('/students', getAllStudents);
router.get('/faculty', getAllFaculty);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);
router.post('/timetable', uploadTimetable);

module.exports = router;
