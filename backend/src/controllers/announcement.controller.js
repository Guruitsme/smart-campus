const { Announcement, Notification } = require('../models/Announcement.model');
const User = require('../models/User.model');

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Admin / Faculty
exports.createAnnouncement = async (req, res) => {
  const { title, content, targetRoles, targetDepartments, targetSemesters, priority, category, expiresAt } = req.body;

  const announcement = await Announcement.create({
    title, content,
    createdBy: req.user._id,
    targetRoles: targetRoles || ['all'],
    targetDepartments: targetDepartments || [],
    targetSemesters: targetSemesters || [],
    priority: priority || 'medium',
    category: category || 'general',
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    attachmentUrl: req.file?.path || '',
  });

  // Find target users and create notifications
  const userQuery = { isActive: true };
  if (!targetRoles?.includes('all')) userQuery.role = { $in: targetRoles };
  if (targetDepartments?.length) userQuery.department = { $in: targetDepartments };
  if (targetSemesters?.length) userQuery.semester = { $in: targetSemesters };

  const targetUsers = await User.find(userQuery).select('_id');

  if (targetUsers.length) {
    const notifications = targetUsers.map((u) => ({
      recipient: u._id,
      title: `📢 ${title}`,
      message: content.substring(0, 120),
      type: 'announcement',
      referenceId: announcement._id,
      referenceModel: 'Announcement',
    }));
    await Notification.insertMany(notifications);

    const io = req.app.get('io');
    if (io) {
      targetUsers.forEach((u) => {
        io.to(u._id.toString()).emit('announcement', { title, priority, category });
      });
    }
  }

  await announcement.populate('createdBy', 'name role');
  res.status(201).json({ success: true, data: announcement });
};

// @desc    Get announcements for current user
// @route   GET /api/announcements
// @access  Private
exports.getAnnouncements = async (req, res) => {
  const { category, priority, page = 1, limit = 20 } = req.query;
  const now = new Date();

  const query = {
    isActive: true,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
    $or: [
      { targetRoles: 'all' },
      { targetRoles: req.user.role },
    ],
  };

  if (req.user.department) {
    query.$and = [
      {
        $or: [
          { targetDepartments: { $size: 0 } },
          { targetDepartments: req.user.department },
        ],
      },
    ];
  }

  if (category) query.category = category;
  if (priority) query.priority = priority;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Announcement.countDocuments(query);
  const announcements = await Announcement.find(query)
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({ success: true, count: announcements.length, total, data: announcements });
};

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private
exports.getAnnouncementById = async (req, res) => {
  const announcement = await Announcement.findById(req.params.id).populate('createdBy', 'name role');
  if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found.' });

  await Announcement.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
  res.status(200).json({ success: true, data: announcement });
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Admin
exports.updateAnnouncement = async (req, res) => {
  const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found.' });
  res.status(200).json({ success: true, data: announcement });
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Admin
exports.deleteAnnouncement = async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found.' });
  await announcement.deleteOne();
  res.status(200).json({ success: true, message: 'Announcement deleted.' });
};
