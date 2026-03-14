const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'absent' },
});

const attendanceSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    semester: { type: Number, required: true },
    department: { type: String, required: true },
    section: { type: String, default: 'A' },
    records: [attendanceRecordSchema],
    totalStudents: { type: Number, default: 0 },
    presentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attendanceSchema.index({ subject: 1, date: 1, department: 1, semester: 1 }, { unique: true });
attendanceSchema.index({ 'records.student': 1, subject: 1 });

// Virtual: attendance percentage for a session
attendanceSchema.virtual('sessionPercentage').get(function () {
  if (!this.totalStudents) return 0;
  return ((this.presentCount / this.totalStudents) * 100).toFixed(1);
});

module.exports = mongoose.model('Attendance', attendanceSchema);
