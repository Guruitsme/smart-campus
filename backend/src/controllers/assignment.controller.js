const { Assignment, Submission } = require('../models/Assignment.model');
const { Notification } = require('../models/Announcement.model');
const User = require('../models/User.model');

// @desc    Create assignment
// @route   POST /api/assignments
// @access  Faculty
exports.createAssignment = async (req, res) => {
  const { title, description, subjectId, dueDate, totalMarks, department, semester, section } = req.body;

  const assignment = await Assignment.create({
    title, description,
    subject: subjectId,
    createdBy: req.user._id,
    dueDate: new Date(dueDate),
    totalMarks: totalMarks || 10,
    department, semester,
    section: section || 'All',
    attachmentUrl: req.file?.path || '',
    attachmentName: req.file?.originalname || '',
  });

  await assignment.populate('subject', 'name code');

  // Notify students
  const students = await User.find({
    role: 'student',
    department,
    semester: Number(semester),
    isActive: true,
  });

  const notifications = students.map((s) => ({
    recipient: s._id,
    title: '📝 New Assignment Posted',
    message: `New assignment: "${title}" — Due: ${new Date(dueDate).toLocaleDateString()}`,
    type: 'assignment',
    referenceId: assignment._id,
    referenceModel: 'Assignment',
  }));

  await Notification.insertMany(notifications);
  const io = req.app.get('io');
  students.forEach((s) => {
    if (io) io.to(s._id.toString()).emit('notification', { type: 'assignment', title });
  });

  res.status(201).json({ success: true, data: assignment });
};

// @desc    Get assignments (filtered by role)
// @route   GET /api/assignments
// @access  Private
exports.getAssignments = async (req, res) => {
  const { subject, department, semester, status } = req.query;
  let query = {};

  if (req.user.role === 'student') {
    query.department = req.user.department;
    query.semester = req.user.semester;
    query.isActive = true;
  } else if (req.user.role === 'faculty') {
    query.createdBy = req.user._id;
  }

  if (subject) query.subject = subject;
  if (department && req.user.role !== 'student') query.department = department;
  if (semester && req.user.role !== 'student') query.semester = Number(semester);

  const assignments = await Assignment.find(query)
    .populate('subject', 'name code')
    .populate('createdBy', 'name')
    .sort({ dueDate: 1 });

  // For students, attach submission status
  if (req.user.role === 'student') {
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
      student: req.user._id,
    });
    const submMap = {};
    submissions.forEach((s) => { submMap[s.assignment.toString()] = s; });

    const enriched = assignments.map((a) => ({
      ...a.toObject(),
      submission: submMap[a._id.toString()] || null,
      isOverdue: new Date(a.dueDate) < new Date() && !submMap[a._id.toString()],
    }));
    return res.status(200).json({ success: true, count: enriched.length, data: enriched });
  }

  res.status(200).json({ success: true, count: assignments.length, data: assignments });
};

// @desc    Submit assignment (student)
// @route   POST /api/assignments/:id/submit
// @access  Student
exports.submitAssignment = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });
  if (!assignment.isActive) return res.status(400).json({ success: false, message: 'Assignment is closed.' });

  if (!req.file) return res.status(400).json({ success: false, message: 'Please upload your submission file.' });

  const existing = await Submission.findOne({ assignment: req.params.id, student: req.user._id });
  if (existing) return res.status(400).json({ success: false, message: 'You have already submitted this assignment.' });

  const isLate = new Date() > new Date(assignment.dueDate);

  const submission = await Submission.create({
    assignment: req.params.id,
    student: req.user._id,
    fileUrl: req.file.path,
    fileName: req.file.originalname,
    isLate,
    status: 'submitted',
  });

  // Increment submission count
  await Assignment.findByIdAndUpdate(req.params.id, { $inc: { submissionCount: 1 } });

  res.status(201).json({ success: true, data: submission, isLate });
};

// @desc    Get submissions for an assignment (faculty)
// @route   GET /api/assignments/:id/submissions
// @access  Faculty / Admin
exports.getSubmissions = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate('subject', 'name');
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

  const submissions = await Submission.find({ assignment: req.params.id })
    .populate('student', 'name rollNumber email')
    .sort({ submittedAt: 1 });

  res.status(200).json({ success: true, count: submissions.length, data: submissions, assignment });
};

// @desc    Grade a submission
// @route   PUT /api/assignments/submissions/:submissionId/grade
// @access  Faculty
exports.gradeSubmission = async (req, res) => {
  const { marksObtained, feedback } = req.body;
  const submission = await Submission.findById(req.params.submissionId).populate('assignment');

  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });
  if (marksObtained > submission.assignment.totalMarks) {
    return res.status(400).json({ success: false, message: 'Marks cannot exceed total marks.' });
  }

  submission.marksObtained = marksObtained;
  submission.feedback = feedback || '';
  submission.status = 'graded';
  await submission.save();

  // Notify student
  await Notification.create({
    recipient: submission.student,
    title: '✅ Assignment Graded',
    message: `Your assignment "${submission.assignment.title}" has been graded. Marks: ${marksObtained}/${submission.assignment.totalMarks}`,
    type: 'marks',
    referenceId: submission._id,
    referenceModel: 'Submission',
  });

  res.status(200).json({ success: true, data: submission });
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Faculty / Admin
exports.deleteAssignment = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

  if (req.user.role === 'faculty' && assignment.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  await Submission.deleteMany({ assignment: req.params.id });
  await assignment.deleteOne();

  res.status(200).json({ success: true, message: 'Assignment deleted.' });
};
