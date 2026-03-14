// faculty.controller.js
const User = require('../models/User.model');
const Subject = require('../models/Subject.model');
const InternalMarks = require('../models/InternalMarks.model');
const Attendance = require('../models/Attendance.model');
const { Notification } = require('../models/Announcement.model');

// @desc    Get faculty dashboard data
// @route   GET /api/faculty/dashboard
// @access  Faculty
exports.getFacultyDashboard = async (req, res) => {
  const subjects = await Subject.find({ faculty: req.user._id, isActive: true });
  const subjectIds = subjects.map((s) => s._id);

  // Get student count for faculty's department/subjects
  const students = await User.countDocuments({
    role: 'student',
    department: req.user.department,
    isActive: true,
  });

  // Recent attendance sessions
  const recentAttendance = await Attendance.find({ faculty: req.user._id })
    .populate('subject', 'name code')
    .sort({ date: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    data: { subjects, studentCount: students, recentAttendance },
  });
};

// @desc    Upload internal marks
// @route   POST /api/faculty/marks
// @access  Faculty
exports.uploadMarks = async (req, res) => {
  const { records, subjectId, examType, totalMarks, semester, department } = req.body;
  // records: [{ studentId, marksObtained, remarks }]

  const bulkOps = records.map((r) => ({
    updateOne: {
      filter: { student: r.studentId, subject: subjectId, examType },
      update: {
        $set: {
          student: r.studentId,
          subject: subjectId,
          faculty: req.user._id,
          examType,
          marksObtained: r.marksObtained,
          totalMarks,
          semester,
          department,
          remarks: r.remarks || '',
        },
      },
      upsert: true,
    },
  }));

  await InternalMarks.bulkWrite(bulkOps);

  // Notify students
  const notifications = records.map((r) => ({
    recipient: r.studentId,
    title: '📊 Marks Updated',
    message: `${examType} marks have been uploaded for your subject.`,
    type: 'marks',
    referenceId: subjectId,
    referenceModel: 'Subject',
  }));
  await Notification.insertMany(notifications);

  res.status(200).json({ success: true, message: 'Marks uploaded successfully.' });
};

// @desc    Get student performance for a subject
// @route   GET /api/faculty/performance/:subjectId
// @access  Faculty
exports.getStudentPerformance = async (req, res) => {
  const { subjectId } = req.params;
  const { semester, department } = req.query;

  const students = await User.find({
    role: 'student',
    department: department || req.user.department,
    semester: Number(semester),
    isActive: true,
  }).select('name rollNumber email');

  const marksData = await InternalMarks.find({ subject: subjectId, semester: Number(semester) });

  const attendanceData = await Attendance.find({ subject: subjectId, semester: Number(semester) });

  const performance = students.map((student) => {
    const studentMarks = marksData.filter((m) => m.student.toString() === student._id.toString());
    const totalAttendance = attendanceData.reduce((acc, session) => {
      const rec = session.records.find((r) => r.student.toString() === student._id.toString());
      if (rec) { acc.total++; if (['present', 'late'].includes(rec.status)) acc.present++; }
      return acc;
    }, { total: 0, present: 0 });

    return {
      student,
      marks: studentMarks,
      attendancePercentage: totalAttendance.total > 0
        ? Math.round((totalAttendance.present / totalAttendance.total) * 100) : 0,
    };
  });

  res.status(200).json({ success: true, data: performance });
};
