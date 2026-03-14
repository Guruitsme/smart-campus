const User = require('../models/User.model');
const Subject = require('../models/Subject.model');
const Timetable = require('../models/Timetable.model');
const Attendance = require('../models/Attendance.model');
const { Assignment, Submission } = require('../models/Assignment.model');
const Notes = require('../models/Notes.model');
const Feedback = require('../models/Feedback.model');
const InternalMarks = require('../models/InternalMarks.model');

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Admin
exports.getDashboard = async (req, res) => {
  const [students, faculty, subjects, assignments, notes, feedbacks] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'faculty', isActive: true }),
    Subject.countDocuments({ isActive: true }),
    Assignment.countDocuments(),
    Notes.countDocuments({ isVisible: true }),
    Feedback.countDocuments(),
  ]);

  // Department-wise student count
  const deptStats = await User.aggregate([
    { $match: { role: 'student', isActive: true } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Recent registrations (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentRegistrations = await User.countDocuments({ createdAt: { $gte: weekAgo } });

  res.status(200).json({
    success: true,
    data: { students, faculty, subjects, assignments, notes, feedbacks, deptStats, recentRegistrations },
  });
};

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Admin
exports.getAllStudents = async (req, res) => {
  const { department, semester, search, page = 1, limit = 20, isActive } = req.query;
  const query = { role: 'student' };
  if (department) query.department = department;
  if (semester) query.semester = Number(semester);
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { rollNumber: { $regex: search, $options: 'i' } },
  ];

  const skip = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(query);
  const students = await User.find(query).sort({ name: 1 }).skip(skip).limit(Number(limit));

  res.status(200).json({ success: true, count: students.length, total, data: students });
};

// @desc    Get all faculty
// @route   GET /api/admin/faculty
// @access  Admin
exports.getAllFaculty = async (req, res) => {
  const { department, search, page = 1, limit = 20 } = req.query;
  const query = { role: 'faculty' };
  if (department) query.department = department;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { employeeId: { $regex: search, $options: 'i' } },
  ];

  const skip = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(query);
  const faculty = await User.find(query).populate('subjects', 'name code').sort({ name: 1 }).skip(skip).limit(Number(limit));

  res.status(200).json({ success: true, count: faculty.length, total, data: faculty });
};

// @desc    Create user (student/faculty)
// @route   POST /api/admin/users
// @access  Admin
exports.createUser = async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: user });
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Admin
exports.updateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.status(200).json({ success: true, data: user });
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Admin
exports.toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, data: user });
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.status(200).json({ success: true, message: 'User deleted.' });
};

// @desc    Manage subjects
// @route   POST /api/admin/subjects
// @access  Admin
exports.createSubject = async (req, res) => {
  const subject = await Subject.create(req.body);
  res.status(201).json({ success: true, data: subject });
};

exports.getSubjects = async (req, res) => {
  const { department, semester } = req.query;
  const query = {};
  if (department) query.department = department;
  if (semester) query.semester = Number(semester);
  const subjects = await Subject.find(query).populate('faculty', 'name').sort({ semester: 1, name: 1 });
  res.status(200).json({ success: true, data: subjects });
};

exports.updateSubject = async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });
  res.status(200).json({ success: true, data: subject });
};

exports.deleteSubject = async (req, res) => {
  await Subject.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Subject deleted.' });
};

// @desc    Upload/Update timetable
// @route   POST /api/admin/timetable
// @access  Admin
exports.uploadTimetable = async (req, res) => {
  const { department, semester, section, academicYear, schedule } = req.body;
  const timetable = await Timetable.findOneAndUpdate(
    { department, semester, section, academicYear },
    { schedule, isActive: true },
    { new: true, upsert: true, runValidators: true }
  );
  res.status(200).json({ success: true, data: timetable });
};
