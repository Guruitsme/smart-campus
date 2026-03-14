const Attendance = require('../models/Attendance.model');
const User = require('../models/User.model');
const { Notification } = require('../models/Announcement.model');

// @desc    Mark attendance for a class
// @route   POST /api/attendance
// @access  Faculty
exports.markAttendance = async (req, res) => {
  const { subjectId, date, records, semester, department, section } = req.body;

  // records: [{ studentId, status: 'present'|'absent'|'late' }]
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  // Check if attendance already marked for this session
  const existing = await Attendance.findOne({
    subject: subjectId,
    date: attendanceDate,
    department,
    semester,
  });

  if (existing) {
    return res.status(400).json({ success: false, message: 'Attendance already marked for this date and subject.' });
  }

  const presentCount = records.filter((r) => r.status === 'present' || r.status === 'late').length;

  const attendance = await Attendance.create({
    subject: subjectId,
    faculty: req.user._id,
    date: attendanceDate,
    semester,
    department,
    section: section || 'A',
    records: records.map((r) => ({ student: r.studentId, status: r.status })),
    totalStudents: records.length,
    presentCount,
  });

  // Check for students below 75% and send notifications
  await checkAttendanceAlerts(records.map((r) => r.studentId), subjectId, req.app.get('io'));

  await attendance.populate('subject', 'name code');
  res.status(201).json({ success: true, data: attendance });
};

// @desc    Get attendance for a subject + semester
// @route   GET /api/attendance/subject/:subjectId
// @access  Faculty / Admin
exports.getAttendanceBySubject = async (req, res) => {
  const { subjectId } = req.params;
  const { startDate, endDate, department, semester } = req.query;

  const query = { subject: subjectId };
  if (department) query.department = department;
  if (semester) query.semester = Number(semester);
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const records = await Attendance.find(query)
    .populate('subject', 'name code')
    .populate('records.student', 'name rollNumber')
    .sort({ date: -1 });

  res.status(200).json({ success: true, count: records.length, data: records });
};

// @desc    Get student's own attendance summary
// @route   GET /api/attendance/my-attendance
// @access  Student
exports.getMyAttendance = async (req, res) => {
  const studentId = req.user._id;

  const records = await Attendance.find({
    'records.student': studentId,
    department: req.user.department,
    semester: req.user.semester,
  }).populate('subject', 'name code');

  // Group by subject
  const subjectMap = {};
  records.forEach((session) => {
    const subKey = session.subject._id.toString();
    if (!subjectMap[subKey]) {
      subjectMap[subKey] = {
        subject: session.subject,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        sessions: [],
      };
    }
    const studentRecord = session.records.find((r) => r.student.toString() === studentId.toString());
    if (studentRecord) {
      subjectMap[subKey].total += 1;
      subjectMap[subKey][studentRecord.status] += 1;
      subjectMap[subKey].sessions.push({ date: session.date, status: studentRecord.status });
    }
  });

  const summary = Object.values(subjectMap).map((s) => ({
    ...s,
    percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    isLow: s.total > 0 && (s.present / s.total) * 100 < 75,
  }));

  res.status(200).json({ success: true, data: summary });
};

// @desc    Update attendance (correct a record)
// @route   PUT /api/attendance/:id
// @access  Faculty
exports.updateAttendance = async (req, res) => {
  const { records } = req.body;
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) return res.status(404).json({ success: false, message: 'Attendance record not found.' });

  if (attendance.faculty.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  attendance.records = records.map((r) => ({ student: r.studentId, status: r.status }));
  attendance.presentCount = records.filter((r) => ['present', 'late'].includes(r.status)).length;
  attendance.totalStudents = records.length;
  await attendance.save();

  res.status(200).json({ success: true, data: attendance });
};

// Helper: check if any student is below 75% and send notification
async function checkAttendanceAlerts(studentIds, subjectId, io) {
  for (const studentId of studentIds) {
    const records = await Attendance.find({ subject: subjectId, 'records.student': studentId });
    let total = 0, present = 0;
    records.forEach((r) => {
      const rec = r.records.find((x) => x.student.toString() === studentId.toString());
      if (rec) { total++; if (['present', 'late'].includes(rec.status)) present++; }
    });
    const percentage = total > 0 ? (present / total) * 100 : 100;
    if (percentage < 75 && total >= 3) {
      await Notification.create({
        recipient: studentId,
        title: '⚠️ Low Attendance Alert',
        message: `Your attendance has dropped below 75%. Current: ${percentage.toFixed(1)}%`,
        type: 'attendance_alert',
        referenceId: subjectId,
        referenceModel: 'Subject',
      });
      if (io) io.to(studentId.toString()).emit('notification', { type: 'attendance_alert', percentage });
    }
  }
}
