const mongoose = require('mongoose');

const internalMarksSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    semester: { type: Number, required: true },
    department: { type: String, required: true },
    examType: {
      type: String,
      enum: ['IA1', 'IA2', 'IA3', 'Assignment', 'Lab', 'Quiz', 'Project'],
      required: true,
    },
    marksObtained: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

internalMarksSchema.index({ student: 1, subject: 1, examType: 1 });

module.exports = mongoose.model('InternalMarks', internalMarksSchema);
