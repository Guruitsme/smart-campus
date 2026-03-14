require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Subject = require('../models/Subject.model');
const { Announcement } = require('../models/Announcement.model');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected for seeding');
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Subject.deleteMany({});
  await Announcement.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // Create Admin
  const admin = await User.create({
    name: 'Dr. Campus Admin',
    email: 'admin@campus.edu',
    password: 'Admin@1234',
    role: 'admin',
    department: 'Administration',
    phone: '9876543210',
  });

  // Create Faculty
  const faculty1 = await User.create({
    name: 'Prof. Rajesh Kumar',
    email: 'faculty@campus.edu',
    password: 'Faculty@123',
    role: 'faculty',
    department: 'Computer Science',
    employeeId: 'FAC001',
    designation: 'Associate Professor',
    qualifications: ['M.Tech', 'Ph.D'],
    phone: '9876543211',
  });

  const faculty2 = await User.create({
    name: 'Dr. Priya Sharma',
    email: 'priya@campus.edu',
    password: 'Faculty@123',
    role: 'faculty',
    department: 'Computer Science',
    employeeId: 'FAC002',
    designation: 'Assistant Professor',
    qualifications: ['M.Sc', 'Ph.D'],
  });

  // Create Students
  const students = await User.insertMany([
    {
      name: 'Arjun Mehta',
      email: 'student@campus.edu',
      password: await bcrypt.hash('Student@123', 12),
      role: 'student',
      rollNumber: 'CS2021001',
      department: 'Computer Science',
      semester: 5,
      section: 'A',
      admissionYear: 2021,
    },
    {
      name: 'Sneha Reddy',
      email: 'sneha@campus.edu',
      password: await bcrypt.hash('Student@123', 12),
      role: 'student',
      rollNumber: 'CS2021002',
      department: 'Computer Science',
      semester: 5,
      section: 'A',
      admissionYear: 2021,
    },
    {
      name: 'Vikram Singh',
      email: 'vikram@campus.edu',
      password: await bcrypt.hash('Student@123', 12),
      role: 'student',
      rollNumber: 'CS2021003',
      department: 'Computer Science',
      semester: 5,
      section: 'B',
      admissionYear: 2021,
    },
  ]);

  // Create Subjects
  const subjects = await Subject.insertMany([
    { name: 'Data Structures & Algorithms', code: 'CS501', department: 'Computer Science', semester: 5, credits: 4, faculty: faculty1._id },
    { name: 'Database Management Systems', code: 'CS502', department: 'Computer Science', semester: 5, credits: 4, faculty: faculty1._id },
    { name: 'Operating Systems', code: 'CS503', department: 'Computer Science', semester: 5, credits: 3, faculty: faculty2._id },
    { name: 'Computer Networks', code: 'CS504', department: 'Computer Science', semester: 5, credits: 3, faculty: faculty2._id },
    { name: 'Software Engineering', code: 'CS505', department: 'Computer Science', semester: 5, credits: 3, faculty: faculty1._id },
    { name: 'Web Technologies', code: 'CS506', department: 'Computer Science', semester: 6, credits: 3, faculty: faculty2._id },
  ]);

  // Assign subjects to faculty
  await User.findByIdAndUpdate(faculty1._id, { subjects: [subjects[0]._id, subjects[1]._id, subjects[4]._id] });
  await User.findByIdAndUpdate(faculty2._id, { subjects: [subjects[2]._id, subjects[3]._id, subjects[5]._id] });

  // Create Announcements
  await Announcement.insertMany([
    {
      title: '🎓 Semester End Examinations Schedule',
      content: 'The semester end examinations for the current academic year will commence from December 15, 2024. Students are advised to collect their hall tickets from the examination section.',
      createdBy: admin._id,
      targetRoles: ['all'],
      priority: 'urgent',
      category: 'exam',
    },
    {
      title: '📚 Library Extended Hours',
      content: 'The central library will remain open until 9 PM on all weekdays during the examination period. Students are encouraged to utilize the facilities.',
      createdBy: admin._id,
      targetRoles: ['student'],
      priority: 'medium',
      category: 'general',
    },
    {
      title: '🏆 Campus Hackathon 2024',
      content: 'The annual SmartCampus Hackathon is scheduled for November 30 - December 1, 2024. Register your teams at the CS department office.',
      createdBy: admin._id,
      targetRoles: ['student', 'faculty'],
      priority: 'high',
      category: 'event',
    },
  ]);

  console.log('✅ Seed data created successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin    → admin@campus.edu      / Admin@1234');
  console.log('Faculty  → faculty@campus.edu    / Faculty@123');
  console.log('Student  → student@campus.edu    / Student@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
