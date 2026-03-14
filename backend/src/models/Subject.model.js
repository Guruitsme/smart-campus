const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    credits: { type: Number, default: 3 },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subjectSchema.index({ department: 1, semester: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
