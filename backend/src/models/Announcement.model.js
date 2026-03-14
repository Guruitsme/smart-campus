const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetRoles: [{ type: String, enum: ['student', 'faculty', 'admin', 'all'] }],
    targetDepartments: [{ type: String }], // empty = all departments
    targetSemesters: [{ type: Number }],   // empty = all semesters
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    category: {
      type: String,
      enum: ['general', 'exam', 'event', 'holiday', 'assignment', 'result', 'placement', 'other'],
      default: 'general',
    },
    attachmentUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['announcement', 'attendance_alert', 'assignment', 'marks', 'feedback', 'general'],
      default: 'general',
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId }, // e.g., assignment ID
    referenceModel: { type: String }, // e.g., 'Assignment'
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Announcement = mongoose.model('Announcement', announcementSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Announcement, Notification };
