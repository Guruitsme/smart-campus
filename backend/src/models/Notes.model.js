const mongoose = require('mongoose');

const notesSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'other'], default: 'pdf' },
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 }, // in bytes
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    unit: { type: String, default: '' }, // Unit/Chapter number
    tags: [{ type: String }],
    downloadCount: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

notesSchema.index({ subject: 1, department: 1, semester: 1 });
notesSchema.index({ tags: 1 });
notesSchema.index({ title: 'text', description: 'text', tags: 'text' }); // text search

module.exports = mongoose.model('Notes', notesSchema);
