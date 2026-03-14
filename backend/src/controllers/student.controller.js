const User = require('../models/User.model');
const InternalMarks = require('../models/InternalMarks.model');
const Timetable = require('../models/Timetable.model');
const { Notification } = require('../models/Announcement.model');

// @desc    Get student dashboard
// @route   GET /api/students/dashboard
// @access  Student
exports.getStudentDashboard = async (req, res) => {
  const Attendance = require('../models/Attendance.model');
  const { Assignment, Submission } = require('../models/Assignment.model');

  const student = req.user;

  // Attendance summary
  const attendanceSessions = await Attendance.find({
    'records.student': student._id,
    department: student.department,
    semester: student.semester,
  });
  let totalClasses = 0, presentClasses = 0;
  attendanceSessions.forEach((session) => {
    const rec = session.records.find((r) => r.student.toString() === student._id.toString());
    if (rec) { totalClasses++; if (['present', 'late'].includes(rec.status)) presentClasses++; }
  });
  const overallAttendance = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  // Pending assignments
  const assignments = await Assignment.find({ department: student.department, semester: student.semester, isActive: true });
  const submissions = await Submission.find({ student: student._id });
  const submittedIds = submissions.map((s) => s.assignment.toString());
  const pendingAssignments = assignments.filter((a) =>
    !submittedIds.includes(a._id.toString()) && new Date(a.dueDate) > new Date()
  );

  // Recent marks
  const recentMarks = await InternalMarks.find({ student: student._id, semester: student.semester })
    .populate('subject', 'name code')
    .sort({ createdAt: -1 })
    .limit(5);

  // Unread notifications
  const unreadCount = await Notification.countDocuments({ recipient: student._id, isRead: false });

  res.status(200).json({
    success: true,
    data: {
      overallAttendance,
      totalClasses,
      pendingAssignments: pendingAssignments.length,
      recentMarks,
      unreadNotifications: unreadCount,
    },
  });
};

// @desc    Get student internal marks
// @route   GET /api/students/marks
// @access  Student
exports.getMyMarks = async (req, res) => {
  const marks = await InternalMarks.find({ student: req.user._id, semester: req.user.semester })
    .populate('subject', 'name code')
    .sort({ createdAt: -1 });

  // Group by subject
  const subjectMap = {};
  marks.forEach((m) => {
    const key = m.subject._id.toString();
    if (!subjectMap[key]) subjectMap[key] = { subject: m.subject, exams: [] };
    subjectMap[key].exams.push({ examType: m.examType, marksObtained: m.marksObtained, totalMarks: m.totalMarks, remarks: m.remarks });
  });

  res.status(200).json({ success: true, data: Object.values(subjectMap) });
};

// @desc    Get timetable for student
// @route   GET /api/students/timetable
// @access  Student
exports.getMyTimetable = async (req, res) => {
  const timetable = await Timetable.findOne({
    department: req.user.department,
    semester: req.user.semester,
    isActive: true,
  })
    .populate('schedule.monday.subject', 'name code')
    .populate('schedule.tuesday.subject', 'name code')
    .populate('schedule.wednesday.subject', 'name code')
    .populate('schedule.thursday.subject', 'name code')
    .populate('schedule.friday.subject', 'name code')
    .populate('schedule.saturday.subject', 'name code')
    .populate('schedule.monday.faculty', 'name')
    .populate('schedule.tuesday.faculty', 'name')
    .populate('schedule.wednesday.faculty', 'name')
    .populate('schedule.thursday.faculty', 'name')
    .populate('schedule.friday.faculty', 'name')
    .populate('schedule.saturday.faculty', 'name');

  res.status(200).json({ success: true, data: timetable });
};
