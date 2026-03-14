# 🎓 Smart Campus — College Management Platform

A production-ready, full-stack Smart Campus application for colleges — built with Next.js, React Native (Expo), Node.js/Express, and MongoDB.

---

## 📦 Project Structure

```
smart-campus/
├── backend/          # Node.js + Express REST API
├── frontend/         # Next.js 14 Web App
├── mobile/           # React Native (Expo) App
└── docs/             # Architecture & API docs
```

---

## 🚀 Tech Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Web        | Next.js 14, React, TailwindCSS       |
| Mobile     | React Native, Expo                   |
| Backend    | Node.js, Express.js                  |
| Database   | MongoDB, Mongoose                    |
| Auth       | JWT, bcryptjs, Role-Based Access     |
| Storage    | Cloudinary (PDF/file uploads)        |
| Charts     | Recharts (web), Victory Native (mob) |

---

## 👤 User Roles

- **Student** — Attendance, notes, assignments, marks, feedback
- **Faculty** — Upload notes, mark attendance, grade assignments
- **Admin** — Manage users, view analytics, send announcements

---

## ⚙️ Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env       # Fill in your MongoDB URI, JWT secret, Cloudinary keys
npm install
npm run dev                # Starts on http://localhost:5000
```

### 2. Frontend (Web)

```bash
cd frontend
cp .env.example .env.local # Set NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev                # Starts on http://localhost:3000
```

### 3. Mobile App

```bash
cd mobile
cp .env.example .env
npm install
npx expo start             # Scan QR with Expo Go app
```

---

## 🌐 API Base URL

```
http://localhost:5000/api
```

---

## 🔐 Default Test Credentials (seed data)

| Role    | Email                    | Password   |
|---------|--------------------------|------------|
| Admin   | admin@campus.edu         | Admin@1234 |
| Faculty | faculty@campus.edu       | Faculty@123|
| Student | student@campus.edu       | Student@123|

> Run `npm run seed` inside `/backend` to populate test data.

---

## 📁 Key Features

- ✅ JWT Authentication with role-based access control
- ✅ Student: Attendance %, notes, assignments, marks, announcements
- ✅ Faculty: Upload notes/PPT, mark attendance, grade students
- ✅ Admin: Full user management, feedback analytics, timetable
- ✅ Anonymous feedback system with star ratings
- ✅ File upload (PDF/PPT) via Cloudinary
- ✅ Real-time notifications
- ✅ Attendance alerts when below 75%
- ✅ Charts: attendance trends, performance graphs

---

## 🚢 Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for:
- Backend → Railway / Render
- Frontend → Vercel
- Mobile → Expo EAS Build (Android/iOS)
- Database → MongoDB Atlas

---

## 📄 License

MIT — Built with ❤️ for modern campuses.
