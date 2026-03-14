const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    // Anonymous: no direct student reference stored
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    semester: { type: Number, required: true },
    department: { type: String, required: true },
    academicYear: { type: String, required: true }, // e.g., "2023-24"

    // Ratings (1-5)
    ratings: {
      teachingQuality: { type: Number, min: 1, max: 5, required: true },
      subjectKnowledge: { type: Number, min: 1, max: 5, required: true },
      communication: { type: Number, min: 1, max: 5, required: true },
      punctuality: { type: Number, min: 1, max: 5, required: true },
      helpfulness: { type: Number, min: 1, max: 5, required: true },
    },
    overallRating: { type: Number, min: 1, max: 5 },
    comments: { type: String, default: '', maxlength: 500 },

    // To prevent duplicate feedback per student per subject (but stay anonymous)
    // We store a hash of student ID + subject, not the student ID itself
    submissionHash: { type: String, required: true },
  },
  { timestamps: true }
);

feedbackSchema.index({ faculty: 1, subject: 1, semester: 1 });
feedbackSchema.index({ submissionHash: 1 }, { unique: true });

// Pre-save: calculate overall rating
feedbackSchema.pre('save', function (next) {
  const r = this.ratings;
  const avg = (r.teachingQuality + r.subjectKnowledge + r.communication + r.punctuality + r.helpfulness) / 5;
  this.overallRating = Math.round(avg * 10) / 10;
  next();
});

module.exports = mongoose.model('Feedback', feedbackSchema);
