const Notes = require('../models/Notes.model');
const Subject = require('../models/Subject.model');

// @desc    Upload notes
// @route   POST /api/notes
// @access  Faculty
exports.uploadNotes = async (req, res) => {
  const { title, description, subjectId, unit, tags, semester, department } = req.body;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a file.' });
  }

  const subject = await Subject.findById(subjectId);
  if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  const fileType = ['pdf','ppt','pptx','doc','docx'].includes(ext) ? ext : 'other';

  const notes = await Notes.create({
    title,
    description,
    subject: subjectId,
    uploadedBy: req.user._id,
    fileUrl: req.file.path,
    fileName: req.file.originalname,
    fileType,
    fileSize: req.file.size || 0,
    department: department || subject.department,
    semester: semester || subject.semester,
    unit,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
  });

  await notes.populate('subject', 'name code');
  await notes.populate('uploadedBy', 'name');

  res.status(201).json({ success: true, data: notes });
};

// @desc    Get all notes (with search + filter)
// @route   GET /api/notes
// @access  Private
exports.getNotes = async (req, res) => {
  const { subject, department, semester, search, unit, page = 1, limit = 20 } = req.query;
  const query = { isVisible: true };

  if (subject) query.subject = subject;
  if (department) query.department = department;
  if (semester) query.semester = Number(semester);
  if (unit) query.unit = unit;

  // For students: only their department/semester
  if (req.user.role === 'student') {
    query.department = req.user.department;
    query.semester = req.user.semester;
  }

  if (search) {
    query.$text = { $search: search };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Notes.countDocuments(query);
  const notes = await Notes.find(query)
    .populate('subject', 'name code')
    .populate('uploadedBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    count: notes.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: Number(page),
    data: notes,
  });
};

// @desc    Get single note
// @route   GET /api/notes/:id
// @access  Private
exports.getNoteById = async (req, res) => {
  const note = await Notes.findById(req.params.id)
    .populate('subject', 'name code')
    .populate('uploadedBy', 'name email');

  if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

  // Increment download count
  await Notes.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });

  res.status(200).json({ success: true, data: note });
};

// @desc    Update note metadata
// @route   PUT /api/notes/:id
// @access  Faculty (owner) / Admin
exports.updateNote = async (req, res) => {
  let note = await Notes.findById(req.params.id);
  if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

  if (req.user.role === 'faculty' && note.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this note.' });
  }

  note = await Notes.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: note });
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Faculty (owner) / Admin
exports.deleteNote = async (req, res) => {
  const note = await Notes.findById(req.params.id);
  if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

  if (req.user.role === 'faculty' && note.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  await note.deleteOne();
  res.status(200).json({ success: true, message: 'Note deleted successfully.' });
};
