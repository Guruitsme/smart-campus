const express = require('express');
const router = express.Router();
const { uploadNotes: uploadNotesFile } = require('../config/cloudinary');
const { uploadNotes, getNotes, getNoteById, updateNote, deleteNote } = require('../controllers/notes.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.post('/', authorize('faculty', 'admin'), uploadNotesFile.single('file'), uploadNotes);
router.put('/:id', authorize('faculty', 'admin'), updateNote);
router.delete('/:id', authorize('faculty', 'admin'), deleteNote);

module.exports = router;
