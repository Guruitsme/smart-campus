const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "10:00"
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  room: { type: String, default: '' },
  type: { type: String, enum: ['lecture', 'lab', 'tutorial', 'free'], default: 'lecture' },
});

const timetableSchema = new mongoose.Schema(
  {
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, default: 'A' },
    academicYear: { type: String, required: true },
    schedule: {
      monday: [periodSchema],
      tuesday: [periodSchema],
      wednesday: [periodSchema],
      thursday: [periodSchema],
      friday: [periodSchema],
      saturday: [periodSchema],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

timetableSchema.index({ department: 1, semester: 1, section: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
