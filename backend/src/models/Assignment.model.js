const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date, required: true },
    totalMarks: { type: Number, required: true, default: 10 },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, default: 'All' },
    attachmentUrl: { type: String, default: '' }, // Optional question paper
    attachmentName: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    submissionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    marksObtained: { type: Number, default: null },
    feedback: { type: String, default: '' },
    isLate: { type: Boolean, default: false },
    status: { type: String, enum: ['submitted', 'graded', 'returned'], default: 'submitted' },
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);
const Submission = mongoose.model('Submission', submissionSchema);

module.exports = { Assignment, Submission };
