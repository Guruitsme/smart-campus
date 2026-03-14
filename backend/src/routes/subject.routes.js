// subject.routes.js
const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject.model');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', async (req, res) => {
  const { department, semester } = req.query;
  const query = { isActive: true };
  if (department) query.department = department;
  if (semester) query.semester = Number(semester);
  const subjects = await Subject.find(query).populate('faculty', 'name').sort({ name: 1 });
  res.json({ success: true, data: subjects });
});

module.exports = router;
