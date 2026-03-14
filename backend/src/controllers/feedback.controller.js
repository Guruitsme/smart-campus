const Feedback = require('../models/Feedback.model');
const crypto = require('crypto');

// @desc    Submit anonymous feedback
// @route   POST /api/feedback
// @access  Student
exports.submitFeedback = async (req, res) => {
  const { facultyId, subjectId, ratings, comments, semester, academicYear } = req.body;

  // Create a hash to prevent duplicate submissions while keeping anonymity
  const hashInput = `${req.user._id}${subjectId}${semester}${academicYear}`;
  const submissionHash = crypto.createHash('sha256').update(hashInput).digest('hex');

  const existing = await Feedback.findOne({ submissionHash });
  if (existing) {
    return res.status(400).json({ success: false, message: 'You have already submitted feedback for this subject.' });
  }

  const feedback = await Feedback.create({
    faculty: facultyId,
    subject: subjectId,
    semester: Number(semester),
    department: req.user.department,
    academicYear,
    ratings,
    comments,
    submissionHash,
  });

  res.status(201).json({ success: true, message: 'Feedback submitted anonymously. Thank you!', data: { _id: feedback._id } });
};

// @desc    Get feedback analytics for a faculty
// @route   GET /api/feedback/analytics/:facultyId
// @access  Admin / Faculty (own)
exports.getFacultyFeedbackAnalytics = async (req, res) => {
  const { facultyId } = req.params;
  const { semester, academicYear } = req.query;

  if (req.user.role === 'faculty' && req.user._id.toString() !== facultyId) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  const query = { faculty: facultyId };
  if (semester) query.semester = Number(semester);
  if (academicYear) query.academicYear = academicYear;

  const feedbacks = await Feedback.find(query).populate('subject', 'name code');

  if (!feedbacks.length) {
    return res.status(200).json({ success: true, data: { totalFeedbacks: 0, averages: {}, subjectBreakdown: [] } });
  }

  // Compute averages
  const totals = { teachingQuality: 0, subjectKnowledge: 0, communication: 0, punctuality: 0, helpfulness: 0, overall: 0 };
  feedbacks.forEach((f) => {
    Object.keys(totals).forEach((k) => {
      if (k === 'overall') totals[k] += f.overallRating;
      else totals[k] += f.ratings[k];
    });
  });

  const n = feedbacks.length;
  const averages = {};
  Object.keys(totals).forEach((k) => { averages[k] = Math.round((totals[k] / n) * 10) / 10; });

  // Subject breakdown
  const subjectMap = {};
  feedbacks.forEach((f) => {
    const key = f.subject._id.toString();
    if (!subjectMap[key]) subjectMap[key] = { subject: f.subject, count: 0, totalRating: 0, comments: [] };
    subjectMap[key].count++;
    subjectMap[key].totalRating += f.overallRating;
    if (f.comments) subjectMap[key].comments.push(f.comments);
  });

  const subjectBreakdown = Object.values(subjectMap).map((s) => ({
    subject: s.subject,
    count: s.count,
    avgRating: Math.round((s.totalRating / s.count) * 10) / 10,
    comments: s.comments,
  }));

  // Rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbacks.forEach((f) => { distribution[Math.round(f.overallRating)]++; });

  res.status(200).json({
    success: true,
    data: { totalFeedbacks: n, averages, subjectBreakdown, ratingDistribution: distribution },
  });
};

// @desc    Get all feedback analytics (Admin dashboard)
// @route   GET /api/feedback/analytics
// @access  Admin
exports.getAllFeedbackAnalytics = async (req, res) => {
  const { academicYear, department } = req.query;
  const query = {};
  if (academicYear) query.academicYear = academicYear;
  if (department) query.department = department;

  const feedbacks = await Feedback.find(query)
    .populate('faculty', 'name department')
    .populate('subject', 'name code');

  // Group by faculty
  const facultyMap = {};
  feedbacks.forEach((f) => {
    const key = f.faculty._id.toString();
    if (!facultyMap[key]) facultyMap[key] = { faculty: f.faculty, count: 0, totalRating: 0 };
    facultyMap[key].count++;
    facultyMap[key].totalRating += f.overallRating;
  });

  const rankings = Object.values(facultyMap)
    .map((f) => ({ ...f, avgRating: Math.round((f.totalRating / f.count) * 10) / 10 }))
    .sort((a, b) => b.avgRating - a.avgRating);

  res.status(200).json({ success: true, data: { total: feedbacks.length, facultyRankings: rankings } });
};
