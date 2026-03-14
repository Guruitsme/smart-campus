const express = require('express');
const router = express.Router();
const { createAnnouncement, getAnnouncements, getAnnouncementById, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcement.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncementById);
router.post('/', authorize('admin', 'faculty'), createAnnouncement);
router.put('/:id', authorize('admin'), updateAnnouncement);
router.delete('/:id', authorize('admin'), deleteAnnouncement);

module.exports = router;
