const User = require('../models/User.model');
const { Notification } = require('../models/Announcement.model');
const crypto = require('crypto');

// Helper to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateToken();
  const refreshToken = user.generateRefreshToken();

  // Don't send password
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      semester: user.semester,
      rollNumber: user.rollNumber,
      employeeId: user.employeeId,
    },
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (Admin can also create users)
exports.register = async (req, res) => {
  const { name, email, password, role, department, semester, rollNumber, section, employeeId, designation, admissionYear } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already registered.' });
  }

  const user = await User.create({
    name, email, password, role,
    department, semester, rollNumber, section,
    employeeId, designation, admissionYear,
  });

  sendTokenResponse(user, 201, res);
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('subjects', 'name code');
  res.status(200).json({ success: true, data: user });
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  const allowed = ['name', 'phone', 'avatar', 'qualifications'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: user });
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated successfully.' });
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'No refresh token provided.' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid refresh token.' });

    const newToken = user.generateToken();
    res.status(200).json({ success: true, token: newToken });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};
