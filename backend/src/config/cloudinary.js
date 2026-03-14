const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Notes / PDF storage
const notesStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'smart-campus/notes',
    allowed_formats: ['pdf', 'ppt', 'pptx', 'doc', 'docx'],
    resource_type: 'raw',
  },
});

// Assignment submissions storage
const submissionStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'smart-campus/submissions',
    allowed_formats: ['pdf', 'doc', 'docx', 'zip', 'txt', 'jpg', 'png'],
    resource_type: 'auto',
  },
});

// Profile/Avatar storage
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'smart-campus/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'fill' }],
  },
});

const uploadNotes = multer({ storage: notesStorage, limits: { fileSize: 50 * 1024 * 1024 } });
const uploadSubmission = multer({ storage: submissionStorage, limits: { fileSize: 25 * 1024 * 1024 } });
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { cloudinary, uploadNotes, uploadSubmission, uploadAvatar };
